begin;

-- RT-F: keep an immutable lifecycle trail for edits and recalls without
-- exposing message content through a client-readable table. The canonical
-- messages row remains the source of truth and keeps the current content and
-- recall marker.
create table if not exists public.message_lifecycle_audit (
  id bigint generated always as identity primary key,
  message_id bigint not null references public.messages(id) on delete cascade,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  action varchar(16) not null,
  previous_version integer not null,
  version integer not null,
  occurred_at timestamptz not null default now(),
  constraint message_lifecycle_audit_action_check
    check (action in ('edited', 'recalled')),
  constraint message_lifecycle_audit_version_check
    check (previous_version >= 1 and version > previous_version)
);

create index if not exists message_lifecycle_audit_message_idx
  on public.message_lifecycle_audit (message_id, occurred_at desc, id desc);

create index if not exists message_lifecycle_audit_conversation_idx
  on public.message_lifecycle_audit (conversation_id, occurred_at desc, id desc);

alter table public.message_lifecycle_audit enable row level security;

-- Lifecycle audit is an internal moderation/operations record. It is written
-- by the trigger below and is intentionally not readable or writable by the
-- authenticated browser role.
revoke all on public.message_lifecycle_audit from public, anon, authenticated;
grant all on public.message_lifecycle_audit to service_role;

create or replace function public.audit_message_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lifecycle_action varchar(16);
  lifecycle_actor uuid;
begin
  if new.recalled_at is distinct from old.recalled_at
    and new.recalled_at is not null then
    lifecycle_action := 'recalled';
  elsif new.content is distinct from old.content
    or new.edited_at is distinct from old.edited_at then
    lifecycle_action := 'edited';
  else
    return new;
  end if;

  -- User-scoped REST/socket writes have auth.uid(). The sender fallback keeps
  -- the audit trail valid for a trusted service-role maintenance write.
  lifecycle_actor := coalesce(auth.uid(), new.sender_id);

  insert into public.message_lifecycle_audit (
    message_id,
    conversation_id,
    actor_id,
    action,
    previous_version,
    version,
    occurred_at
  )
  values (
    new.id,
    new.conversation_id,
    lifecycle_actor,
    lifecycle_action,
    old.version,
    new.version,
    new.updated_at
  );

  return new;
end;
$$;

revoke all on function public.audit_message_lifecycle() from public;

drop trigger if exists audit_messages_lifecycle on public.messages;
create trigger audit_messages_lifecycle
after update of content, edited_at, recalled_at on public.messages
for each row execute function public.audit_message_lifecycle();

commit;
