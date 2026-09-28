-- RT-B verification.
-- Run against a staging Supabase database with at least three profile rows.
-- The transaction is rolled back at the end; no fixture data is retained.

begin;

-- Structural checks are deliberately independent of the fixture section.
do $$
declare
  missing text;
begin
  select required_name
  into missing
  from (
    values
      ('messages.client_message_id'),
      ('messages.version'),
      ('conversation_members.last_read_message_id')
  ) as required_column(required_name)
  where not exists (
    select 1
    from information_schema.columns column_info
    where column_info.table_schema = 'public'
      and column_info.table_name = split_part(required_column.required_name, '.', 1)
      and column_info.column_name = split_part(required_column.required_name, '.', 2)
  )
  limit 1;

  if missing is not null then
    raise exception 'RT-B missing required column: %', missing;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and conname = 'messages_sender_client_message_id_key'
  ) then
    raise exception 'RT-B idempotency unique constraint is missing';
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'messages'
      and indexname = 'messages_conversation_created_id_idx'
  ) then
    raise exception 'RT-B stable conversation/created_at/id index is missing';
  end if;

  if exists (
    select 1
    from pg_class table_class
    join pg_namespace table_namespace
      on table_namespace.oid = table_class.relnamespace
    where table_namespace.nspname = 'public'
      and table_class.relname in ('messages', 'conversation_members')
      and table_class.relrowsecurity = false
  ) then
    raise exception 'RT-B changed tables must have RLS enabled';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'Members can send accepted messages'
  ) then
    raise exception 'RT-B accepted-message insert policy is missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'conversation_members'
      and policyname = 'Users can update their own read cursor'
  ) then
    raise exception 'RT-B read cursor update policy is missing';
  end if;

  if not exists (
    select 1
    from pg_proc
    where oid = 'public.insert_message_idempotent(bigint,uuid,text,text,bigint)'::regprocedure
  ) then
    raise exception 'RT-B idempotent insert function is missing';
  end if;
end;
$$;

create temporary table rt_b_users (
  user_a uuid not null,
  user_b uuid not null,
  user_c uuid not null
) on commit drop;

insert into rt_b_users (user_a, user_b, user_c)
select
  max(profile_id::text) filter (where profile_number = 1)::uuid,
  max(profile_id::text) filter (where profile_number = 2)::uuid,
  max(profile_id::text) filter (where profile_number = 3)::uuid
from (
  select
    id as profile_id,
    row_number() over (order by id) as profile_number
  from public.profiles
  limit 3
) profiles_for_test;

do $$
begin
  if not exists (
    select 1
    from rt_b_users
    where user_a is not null
      and user_b is not null
      and user_c is not null
  ) then
    raise exception 'RT-B needs at least three profiles for A/B/C RLS checks';
  end if;
end;
$$;

create temporary table rt_b_conversation (
  id bigint not null,
  public_id uuid not null
) on commit drop;

-- Fixture setup runs with RLS bypassed, like a migration/test harness.
set local role service_role;

delete from public.user_blocks
where (
  blocker_id = (select user_a from rt_b_users)
  and blocked_id = (select user_b from rt_b_users)
)
or (
  blocker_id = (select user_b from rt_b_users)
  and blocked_id = (select user_a from rt_b_users)
);

with created as (
  insert into public.conversations (
    kind,
    direct_key,
    created_by
  )
  select
    'direct',
    'rt-b-test:' || gen_random_uuid()::text,
    user_a
  from rt_b_users
  returning id, public_id
)
insert into rt_b_conversation (id, public_id)
select id, public_id
from created;

insert into public.conversation_members (
  conversation_id,
  user_id,
  role
)
select conversation.id, users.user_id, users.role
from rt_b_conversation conversation
cross join lateral (
  values
    ((select user_a from rt_b_users), 'owner'::varchar(16)),
    ((select user_b from rt_b_users), 'member'::varchar(16))
) as users(user_id, role);

insert into public.message_requests (
  conversation_id,
  sender_id,
  recipient_id,
  status
)
select
  conversation.id,
  users.user_a,
  users.user_b,
  'pending'
from rt_b_conversation conversation
cross join rt_b_users users;

-- A must not insert while the request is pending.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  (select user_a::text from rt_b_users),
  true
);

do $$
declare
  denied boolean := false;
  caught_sqlstate text;
begin
  begin
    insert into public.messages (
      conversation_id,
      client_message_id,
      content,
      message_type
    )
    select
      conversation.id,
      '10000000-0000-0000-0000-000000000001'::uuid,
      'must be rejected while pending',
      'text'
    from rt_b_conversation conversation;
  exception when others then
    get stacked diagnostics caught_sqlstate = returned_sqlstate;
    denied := true;
    if caught_sqlstate not in ('42501', '23514') then
      raise;
    end if;
  end;

  if not denied then
    raise exception 'RT-B pending request unexpectedly accepted a message';
  end if;
end;
$$;

-- Accept the request and create one canonical message through the idempotent
-- database path. The supplied old timestamp/version must not survive.
set local role service_role;
update public.message_requests
set status = 'accepted',
    responded_at = now()
where conversation_id = (select id from rt_b_conversation);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  (select user_a::text from rt_b_users),
  true
);

create temporary table rt_b_message (
  id bigint not null,
  content text not null,
  client_message_id uuid not null,
  version integer not null,
  created_at timestamptz not null
) on commit drop;

insert into rt_b_message (id, content, client_message_id, version, created_at)
select
  id,
  content,
  client_message_id,
  version,
  created_at
from public.insert_message_idempotent(
  (select id from rt_b_conversation),
  '10000000-0000-0000-0000-000000000002'::uuid,
  'canonical body',
  'text',
  null
);

do $$
declare
  message_row record;
  expected_sender uuid;
  actual_sender uuid;
begin
  select * into message_row from rt_b_message;
  select user_a into expected_sender from rt_b_users;
  select sender_id
  into actual_sender
  from public.messages
  where id = message_row.id;

  if message_row.version <> 1
    or message_row.client_message_id <> '10000000-0000-0000-0000-000000000002'::uuid
    or message_row.created_at <= '2020-01-01'::timestamptz
    or actual_sender <> expected_sender then
    raise exception 'RT-B server-owned message metadata was not canonicalized';
  end if;
end;
$$;

-- Authenticated users cannot create system messages through the public RPC.
do $$
declare
  rejected boolean := false;
  caught_sqlstate text;
begin
  begin
    perform *
    from public.insert_message_idempotent(
      (select id from rt_b_conversation),
      '10000000-0000-0000-0000-000000000004'::uuid,
      'system body',
      'system',
      null
    );
  exception when others then
    get stacked diagnostics caught_sqlstate = returned_sqlstate;
    rejected := true;
    if caught_sqlstate not in ('22023', '42501', '23514') then
      raise;
    end if;
  end;

  if not rejected then
    raise exception 'RT-FIX-08 system message unexpectedly accepted';
  end if;
end;
$$;

-- Same key and payload returns the old row and does not create a second row.
do $$
declare
  retry_row record;
  message_count integer;
begin
  select *
  into retry_row
  from public.insert_message_idempotent(
    (select id from rt_b_conversation),
    '10000000-0000-0000-0000-000000000002'::uuid,
    'canonical body',
    'text',
    null
  );

  select count(*)
  into message_count
  from public.messages
  where sender_id = (select user_a from rt_b_users)
    and client_message_id = '10000000-0000-0000-0000-000000000002'::uuid;

  if retry_row.deduplicated is distinct from true or message_count <> 1 then
    raise exception 'RT-B duplicate retry did not return the canonical row';
  end if;
end;
$$;

-- Reusing the key for another payload is a conflict, not a new message.
do $$
declare
  rejected boolean := false;
  caught_sqlstate text;
begin
  begin
    perform *
    from public.insert_message_idempotent(
      (select id from rt_b_conversation),
      '10000000-0000-0000-0000-000000000002'::uuid,
      'different body',
      'text',
      null
    );
  exception when others then
    get stacked diagnostics caught_sqlstate = returned_sqlstate;
    rejected := true;
    if caught_sqlstate <> '23505' then
      raise;
    end if;
  end;

  if not rejected then
    raise exception 'RT-B idempotency key reuse was not rejected';
  end if;
end;
$$;

-- A normal update increments the canonical version.
update public.messages
set content = 'canonical body edited'
where id = (select id from rt_b_message);

do $$
begin
  if (select version from public.messages where id = (select id from rt_b_message)) <> 2 then
    raise exception 'RT-B message version did not increment on update';
  end if;
end;
$$;

set local role service_role;
do $$
declare
  audit_row record;
begin
  select action, previous_version, version, actor_id
  into audit_row
  from public.message_lifecycle_audit
  where message_id = (select id from rt_b_message)
  order by id desc
  limit 1;

  if audit_row.action <> 'edited'
    or audit_row.previous_version <> 1
    or audit_row.version <> 2
    or audit_row.actor_id <> (select user_a from rt_b_users) then
    raise exception 'RT-F edit lifecycle audit was not recorded';
  end if;
end;
$$;

-- Read cursor belongs to the current user and is tied to a message in the
-- same conversation. The trigger derives last_read_at from that message.
set local role authenticated;
update public.conversation_members
set last_read_message_id = (select id from rt_b_message),
    last_read_at = '2000-01-01'::timestamptz
where conversation_id = (select id from rt_b_conversation)
  and user_id = (select user_a from rt_b_users);

set local role service_role;
do $$
declare
  cursor_row record;
begin
  select last_read_message_id, last_read_at
  into cursor_row
  from public.conversation_members
  where conversation_id = (select id from rt_b_conversation)
    and user_id = (select user_a from rt_b_users);

  if cursor_row.last_read_message_id <> (select id from rt_b_message)
    or cursor_row.last_read_at <= '2020-01-01'::timestamptz then
    raise exception 'RT-B read cursor was not canonicalized';
  end if;
end;
$$;

-- C cannot read or update A/B read state.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  (select user_c::text from rt_b_users),
  true
);

do $$
declare
  visible_members integer;
  changed_rows integer;
begin
  select count(*)
  into visible_members
  from public.conversation_members
  where conversation_id = (select id from rt_b_conversation);

  update public.conversation_members
  set last_read_at = now()
  where conversation_id = (select id from rt_b_conversation)
    and user_id = (select user_a from rt_b_users);
  get diagnostics changed_rows = row_count;

  if visible_members <> 0 or changed_rows <> 0 then
    raise exception 'RT-B non-member could read or update read state';
  end if;
end;
$$;

-- Blocking either direction must deny a new message even after accept.
set local role service_role;
insert into public.user_blocks (blocker_id, blocked_id)
select user_b, user_a
from rt_b_users
on conflict (blocker_id, blocked_id) do nothing;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  (select user_a::text from rt_b_users),
  true
);

do $$
declare
  denied boolean := false;
  caught_sqlstate text;
begin
  begin
    perform *
    from public.insert_message_idempotent(
      (select id from rt_b_conversation),
      '10000000-0000-0000-0000-000000000003'::uuid,
      'blocked body',
      'text',
      null
    );
  exception when others then
    get stacked diagnostics caught_sqlstate = returned_sqlstate;
    denied := true;
    if caught_sqlstate not in ('42501', '23514') then
      raise;
    end if;
  end;

  if not denied then
    raise exception 'RT-B blocked member unexpectedly sent a message';
  end if;
end;
$$;

rollback;
