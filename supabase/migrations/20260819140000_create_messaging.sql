create table if not exists public.conversations (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  kind varchar(16) not null default 'direct',
  direct_key text unique,
  title varchar(120),
  avatar_url text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint conversations_kind_check check (kind in ('direct', 'group', 'support')),
  constraint conversations_direct_key_check check (
    (kind = 'direct' and direct_key is not null)
    or (kind <> 'direct' and direct_key is null)
  )
);

create table if not exists public.conversation_members (
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  role varchar(16) not null default 'member',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  last_read_at timestamptz,
  primary key (conversation_id, user_id),
  constraint conversation_members_role_check check (role in ('owner', 'admin', 'member', 'support'))
);

create table if not exists public.message_requests (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  conversation_id bigint not null unique references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  status varchar(16) not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint message_requests_users_check check (sender_id <> recipient_id),
  constraint message_requests_status_check check (status in ('pending', 'accepted', 'rejected', 'cancelled'))
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  reply_to_message_id bigint references public.messages(id) on delete set null,
  message_type varchar(16) not null default 'text',
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  recalled_at timestamptz,
  deleted_at timestamptz,
  constraint messages_type_check check (message_type in ('text', 'system')),
  constraint messages_content_check check (
    recalled_at is not null
    or (content is not null and char_length(btrim(content)) between 1 and 5000)
  )
);

create table if not exists public.message_deletions (
  message_id bigint not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  deleted_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_self_check check (blocker_id <> blocked_id)
);

create table if not exists public.user_discovery_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  show_online boolean not null default false,
  show_nearby boolean not null default false,
  allow_message_requests boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists conversation_members_user_idx
  on public.conversation_members (user_id, joined_at desc)
  where left_at is null;

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc)
  where deleted_at is null;

create index if not exists message_requests_recipient_status_idx
  on public.message_requests (recipient_id, status, created_at desc);

create or replace function public.is_conversation_member(
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
  );
$$;

create or replace function public.can_access_conversation(
  target_conversation_id bigint,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_conversation_member(target_conversation_id, target_user_id)
    and (
      not exists (
        select 1
        from public.message_requests request
        where request.conversation_id = target_conversation_id
      )
      or exists (
        select 1
        from public.message_requests request
        where request.conversation_id = target_conversation_id
          and (
            request.status = 'accepted'
            or (request.status = 'pending' and request.sender_id = target_user_id)
          )
      )
    );
$$;

revoke all on function public.is_conversation_member(bigint, uuid) from public;
revoke all on function public.can_access_conversation(bigint, uuid) from public;
grant execute on function public.is_conversation_member(bigint, uuid) to authenticated, service_role;
grant execute on function public.can_access_conversation(bigint, uuid) to authenticated, service_role;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.message_requests enable row level security;
alter table public.messages enable row level security;
alter table public.message_deletions enable row level security;
alter table public.user_blocks enable row level security;
alter table public.user_discovery_settings enable row level security;

create policy "Members can read accessible conversations"
  on public.conversations for select to authenticated
  using (public.can_access_conversation(id));

create policy "Members can read accessible memberships"
  on public.conversation_members for select to authenticated
  using (public.can_access_conversation(conversation_id));

create policy "Users can read their message requests"
  on public.message_requests for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "Users can create outgoing message requests"
  on public.message_requests for insert to authenticated
  with check (sender_id = auth.uid() and sender_id <> recipient_id);

create policy "Recipients can respond to message requests"
  on public.message_requests for update to authenticated
  using (recipient_id = auth.uid() and status = 'pending')
  with check (recipient_id = auth.uid() and status in ('accepted', 'rejected'));

create policy "Members can read messages"
  on public.messages for select to authenticated
  using (public.can_access_conversation(conversation_id));

create policy "Members can send messages"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.can_access_conversation(conversation_id));

create policy "Senders can edit recent messages"
  on public.messages for update to authenticated
  using (
    sender_id = auth.uid()
    and created_at >= now() - interval '15 minutes'
    and recalled_at is null
  )
  with check (sender_id = auth.uid());

create policy "Users can read their local deletions"
  on public.message_deletions for select to authenticated
  using (user_id = auth.uid());

create policy "Users can locally delete messages"
  on public.message_deletions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can manage their blocks"
  on public.user_blocks for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

create policy "Users can read their discovery settings"
  on public.user_discovery_settings for select to authenticated
  using (user_id = auth.uid());

create policy "Users can create their discovery settings"
  on public.user_discovery_settings for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their discovery settings"
  on public.user_discovery_settings for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.set_messaging_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_messaging_updated_at();

drop trigger if exists set_messages_updated_at on public.messages;
create trigger set_messages_updated_at
before update on public.messages
for each row execute function public.set_messaging_updated_at();

drop trigger if exists set_discovery_settings_updated_at on public.user_discovery_settings;
create trigger set_discovery_settings_updated_at
before update on public.user_discovery_settings
for each row execute function public.set_messaging_updated_at();
