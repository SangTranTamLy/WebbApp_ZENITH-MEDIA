begin;

-- Keep the RT-B tables protected even when this migration is applied to a
-- database that was bootstrapped outside the original messaging migration.
alter table public.messages enable row level security;
alter table public.conversation_members enable row level security;

-- RT-B: every message write gets a client-owned idempotency key and a
-- server-owned monotonic version. Existing rows are backfilled once so the
-- new invariant can be made NOT NULL without losing legacy messages.
alter table public.messages
  add column if not exists client_message_id uuid,
  add column if not exists version integer;

update public.messages
set client_message_id = gen_random_uuid()
where client_message_id is null;

update public.messages
set version = 1
where version is null;

alter table public.messages
  alter column client_message_id set not null,
  alter column version set default 1,
  alter column version set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and conname = 'messages_sender_client_message_id_key'
  ) then
    alter table public.messages
      add constraint messages_sender_client_message_id_key
      unique (sender_id, client_message_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and conname = 'messages_version_positive_check'
  ) then
    alter table public.messages
      add constraint messages_version_positive_check
      check (version >= 1);
  end if;
end;
$$;

-- The id is the stable tie-breaker for history pagination and read cursors.
create index if not exists messages_conversation_created_id_idx
  on public.messages (conversation_id, created_at desc, id desc)
  where deleted_at is null;

-- A message cursor is more precise than a timestamp alone. Keep the existing
-- timestamp for compatibility and derive it from the canonical message row.
alter table public.conversation_members
  add column if not exists last_read_message_id bigint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.conversation_members'::regclass
      and conname = 'conversation_members_last_read_message_id_fkey'
  ) then
    alter table public.conversation_members
      add constraint conversation_members_last_read_message_id_fkey
      foreign key (last_read_message_id)
      references public.messages(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists conversation_members_read_cursor_idx
  on public.conversation_members (conversation_id, user_id, last_read_message_id);

-- A pending message request is not an active message channel. This function
-- is separate from can_access_conversation because the requester may inspect
-- an empty request conversation without being allowed to insert messages.
create or replace function public.can_send_message(
  target_conversation_id bigint,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_members member
    where member.conversation_id = target_conversation_id
      and member.user_id = target_user_id
      and member.left_at is null
  )
  and not exists (
    select 1
    from public.message_requests request
    where request.conversation_id = target_conversation_id
      and request.status <> 'accepted'
  )
  and not exists (
    select 1
    from public.conversation_members member
    join public.user_blocks block
      on (
        block.blocker_id = target_user_id
        and block.blocked_id = member.user_id
      )
      or (
        block.blocker_id = member.user_id
        and block.blocked_id = target_user_id
      )
    where member.conversation_id = target_conversation_id
      and member.user_id <> target_user_id
      and member.left_at is null
  );
$$;

revoke all on function public.can_send_message(bigint, uuid) from public;
grant execute on function public.can_send_message(bigint, uuid)
  to authenticated, service_role;

drop policy if exists "Members can send messages" on public.messages;
create policy "Members can send accepted messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and message_type = 'text'
    and public.can_send_message(conversation_id)
  );

-- RLS alone cannot restrict which columns a role may submit. Column grants
-- prevent clients from writing server-owned message metadata directly.
revoke insert on public.messages from authenticated;
grant insert (
  conversation_id,
  client_message_id,
  reply_to_message_id,
  message_type,
  content
) on public.messages to authenticated;

revoke update on public.messages from authenticated;
grant update (content, edited_at, recalled_at)
  on public.messages to authenticated;

drop policy if exists "Users can update their own read cursor"
  on public.conversation_members;
create policy "Users can update their own read cursor"
  on public.conversation_members for update to authenticated
  using (
    user_id = auth.uid()
    and left_at is null
    and public.can_access_conversation(conversation_id)
  )
  with check (
    user_id = auth.uid()
    and left_at is null
    and public.can_access_conversation(conversation_id)
  );

revoke update on public.conversation_members from authenticated;
grant update (last_read_at, last_read_message_id)
  on public.conversation_members to authenticated;

create or replace function public.prepare_message_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- auth.uid() is the only accepted sender identity for an authenticated
    -- write. A trusted backend/service-role insert may provide the sender.
    if auth.uid() is not null then
      if new.sender_id is not null
        and new.sender_id is distinct from auth.uid() then
        raise exception 'sender_id must match auth.uid()'
          using errcode = '42501';
      end if;

      new.sender_id = auth.uid();
    end if;

    -- Never trust client timestamps or versions.
    new.created_at = clock_timestamp();
    new.updated_at = new.created_at;
    new.version = 1;
  else
    if new.public_id is distinct from old.public_id
      or new.conversation_id is distinct from old.conversation_id
      or new.sender_id is distinct from old.sender_id
      or new.client_message_id is distinct from old.client_message_id
      or new.created_at is distinct from old.created_at then
      raise exception 'message identity fields are immutable'
        using errcode = '42501';
    end if;

    new.version = old.version + 1;
  end if;

  return new;
end;
$$;

drop trigger if exists prepare_messages_write on public.messages;
create trigger prepare_messages_write
before insert or update on public.messages
for each row execute function public.prepare_message_write();

create or replace function public.validate_conversation_read_cursor()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  next_cursor_created_at timestamptz;
  current_cursor_created_at timestamptz;
begin
  if new.last_read_message_id is null then
    if tg_op = 'UPDATE' and old.last_read_message_id is not null then
      -- A client may not move a committed cursor backwards or clear it.
      new.last_read_message_id = old.last_read_message_id;
      new.last_read_at = old.last_read_at;
    end if;

    return new;
  end if;

  select message.created_at
  into next_cursor_created_at
  from public.messages message
  where message.id = new.last_read_message_id
    and message.conversation_id = new.conversation_id;

  if next_cursor_created_at is null then
    raise exception 'read cursor must belong to the same conversation'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and old.last_read_message_id is not null then
    select message.created_at
    into current_cursor_created_at
    from public.messages message
    where message.id = old.last_read_message_id
      and message.conversation_id = old.conversation_id;

    if current_cursor_created_at is not null
      and (
        next_cursor_created_at,
        new.last_read_message_id
      ) < (
        current_cursor_created_at,
        old.last_read_message_id
      ) then
      raise exception 'read cursor cannot move backwards'
        using errcode = '23514';
    end if;
  end if;

  new.last_read_at = next_cursor_created_at;
  return new;
end;
$$;

drop trigger if exists validate_conversation_read_cursor
  on public.conversation_members;
create trigger validate_conversation_read_cursor
before insert or update on public.conversation_members
for each row execute function public.validate_conversation_read_cursor();

-- One atomic write path makes a retry return the canonical row, including a
-- concurrent retry that races the first insert. It deliberately accepts no
-- sender, timestamp or version arguments.
create or replace function public.insert_message_idempotent(
  target_conversation_id bigint,
  target_client_message_id uuid,
  target_content text,
  target_message_type text default 'text',
  target_reply_to_message_id bigint default null
)
returns table (
  id bigint,
  public_id uuid,
  conversation_id bigint,
  sender_id uuid,
  reply_to_message_id bigint,
  message_type varchar(16),
  content text,
  client_message_id uuid,
  version integer,
  created_at timestamptz,
  updated_at timestamptz,
  edited_at timestamptz,
  recalled_at timestamptz,
  deleted_at timestamptz,
  deduplicated boolean
)
language plpgsql
volatile
set search_path = ''
as $$
declare
  current_user_id uuid = auth.uid();
  candidate public.messages%rowtype;
  inserted public.messages%rowtype;
begin
  if current_user_id is null then
    raise exception 'authenticated user is required'
      using errcode = '42501';
  end if;

  if target_message_type is distinct from 'text' then
    raise exception 'only text messages are allowed for user sends'
      using errcode = '22023';
  end if;

  select message.*
  into candidate
  from public.messages message
  where message.sender_id = current_user_id
    and message.client_message_id = target_client_message_id;

  if found then
    if candidate.conversation_id <> target_conversation_id
      or candidate.content is distinct from target_content
      or candidate.message_type is distinct from target_message_type
      or candidate.reply_to_message_id is distinct from target_reply_to_message_id then
      raise exception 'IDEMPOTENCY_CONFLICT'
        using errcode = '23505';
    end if;

    return query
    select
      candidate.id,
      candidate.public_id,
      candidate.conversation_id,
      candidate.sender_id,
      candidate.reply_to_message_id,
      candidate.message_type,
      candidate.content,
      candidate.client_message_id,
      candidate.version,
      candidate.created_at,
      candidate.updated_at,
      candidate.edited_at,
      candidate.recalled_at,
      candidate.deleted_at,
      true;
    return;
  end if;

  if target_reply_to_message_id is not null
    and not exists (
      select 1
      from public.messages reply_message
      where reply_message.id = target_reply_to_message_id
        and reply_message.conversation_id = target_conversation_id
    ) then
    raise exception 'reply message must belong to the same conversation'
      using errcode = '23514';
  end if;

  insert into public.messages (
    conversation_id,
    client_message_id,
    reply_to_message_id,
    message_type,
    content
  )
  values (
    target_conversation_id,
    target_client_message_id,
    target_reply_to_message_id,
    target_message_type,
    target_content
  )
  on conflict (sender_id, client_message_id) do nothing
  returning * into inserted;

  if found then
    return query
    select
      inserted.id,
      inserted.public_id,
      inserted.conversation_id,
      inserted.sender_id,
      inserted.reply_to_message_id,
      inserted.message_type,
      inserted.content,
      inserted.client_message_id,
      inserted.version,
      inserted.created_at,
      inserted.updated_at,
      inserted.edited_at,
      inserted.recalled_at,
      inserted.deleted_at,
      false;
    return;
  end if;

  -- A concurrent caller won the unique-key race. Read its canonical row and
  -- apply the same payload check before returning it as a deduplicated retry.
  select message.*
  into candidate
  from public.messages message
  where message.sender_id = current_user_id
    and message.client_message_id = target_client_message_id;

  if not found then
    raise exception 'idempotent message insert did not return a row';
  end if;

  if candidate.conversation_id <> target_conversation_id
    or candidate.content is distinct from target_content
    or candidate.message_type is distinct from target_message_type
    or candidate.reply_to_message_id is distinct from target_reply_to_message_id then
    raise exception 'IDEMPOTENCY_CONFLICT'
      using errcode = '23505';
  end if;

  return query
  select
    candidate.id,
    candidate.public_id,
    candidate.conversation_id,
    candidate.sender_id,
    candidate.reply_to_message_id,
    candidate.message_type,
    candidate.content,
    candidate.client_message_id,
    candidate.version,
    candidate.created_at,
    candidate.updated_at,
    candidate.edited_at,
    candidate.recalled_at,
    candidate.deleted_at,
    true;
end;
$$;

revoke all on function public.insert_message_idempotent(bigint, uuid, text, text, bigint)
  from public;
grant execute on function public.insert_message_idempotent(bigint, uuid, text, text, bigint)
  to authenticated, service_role;

commit;
