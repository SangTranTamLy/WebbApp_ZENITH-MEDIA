-- RT-FIX-08: authenticated user sends are text-only. Trusted internal
-- service code may still create system records through a separate path.

begin;

drop policy if exists "Members can send messages"
  on public.messages;
drop policy if exists "Members can send accepted messages"
  on public.messages;
create policy "Members can send accepted messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and message_type = 'text'
    and public.can_send_message(conversation_id)
  );

-- Do not allow an authenticated sender to turn a user message into a system
-- message through a direct update. service_role remains available for a
-- future explicitly trusted system-message path.
drop policy if exists "Senders can edit recent messages"
  on public.messages;
create policy "Senders can edit recent messages"
  on public.messages for update to authenticated
  using (
    sender_id = auth.uid()
    and created_at >= now() - interval '15 minutes'
    and recalled_at is null
  )
  with check (
    sender_id = auth.uid()
    and message_type = 'text'
  );

-- This protects databases that already have the idempotent RPC installed
-- without the RT-FIX-08 guard in its original migration.
create or replace function public.enforce_authenticated_text_only_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null
    and new.message_type is distinct from 'text' then
    raise exception 'only text messages are allowed for user sends'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_authenticated_text_only_message
  on public.messages;
create trigger enforce_authenticated_text_only_message
before insert or update of message_type on public.messages
for each row
execute function public.enforce_authenticated_text_only_message();

commit;
