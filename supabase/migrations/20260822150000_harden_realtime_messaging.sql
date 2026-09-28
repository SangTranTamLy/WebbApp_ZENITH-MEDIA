begin;

-- RT-F/RT-I/RT-K: a local delete never removes the canonical message and
-- every request report is an auditable, user-scoped record.
create table if not exists public.message_request_reports (
  id bigint generated always as identity primary key,
  request_id bigint not null references public.message_requests(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  constraint message_request_reports_reason_check check (
    reason is null or char_length(btrim(reason)) between 1 and 500
  ),
  constraint message_request_reports_unique_reporter unique (request_id, reporter_id)
);

create index if not exists message_request_reports_request_idx
  on public.message_request_reports (request_id, created_at desc);

alter table public.message_request_reports enable row level security;

alter table public.message_requests
  drop constraint if exists message_requests_status_check;
alter table public.message_requests
  add constraint message_requests_status_check
  check (status in ('pending', 'accepted', 'rejected', 'blocked', 'cancelled'));

drop policy if exists "Recipients can respond to message requests"
  on public.message_requests;
create policy "Participants can update pending message requests"
  on public.message_requests for update to authenticated
  using (
    (recipient_id = auth.uid() or sender_id = auth.uid())
    and status = 'pending'
  )
  with check (
    (recipient_id = auth.uid() and status in ('accepted', 'rejected', 'blocked'))
    or (sender_id = auth.uid() and status = 'cancelled')
  );

drop policy if exists "Participants can create request reports"
  on public.message_request_reports;
create policy "Participants can create request reports"
  on public.message_request_reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1
      from public.message_requests request
      where request.id = request_id
        and (request.sender_id = auth.uid() or request.recipient_id = auth.uid())
    )
  );

drop policy if exists "Reporters can read their request reports"
  on public.message_request_reports;
create policy "Reporters can read their request reports"
  on public.message_request_reports for select to authenticated
  using (reporter_id = auth.uid());

-- Block is part of access authorization, not only a send-time check. This
-- keeps REST history/inbox and realtime fanout consistent after a block.
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
  select exists (
    select 1
    from public.conversation_members member
    where member.conversation_id = target_conversation_id
      and member.user_id = target_user_id
      and member.left_at is null
  )
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
  )
  and not exists (
    select 1
    from public.conversation_members other_member
    join public.user_blocks block
      on (
        block.blocker_id = target_user_id
        and block.blocked_id = other_member.user_id
      )
      or (
        block.blocker_id = other_member.user_id
        and block.blocked_id = target_user_id
      )
    where other_member.conversation_id = target_conversation_id
      and other_member.user_id <> target_user_id
      and other_member.left_at is null
  );
$$;

-- A deletion is only meaningful for a message the current user can read.
drop policy if exists "Users can locally delete messages"
  on public.message_deletions;
create policy "Users can locally delete messages"
  on public.message_deletions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.messages message
      where message.id = message_id
        and public.can_access_conversation(message.conversation_id)
    )
  );

drop policy if exists "Users can update their local deletions"
  on public.message_deletions;
create policy "Users can update their local deletions"
  on public.message_deletions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow a recipient to report a request without granting them arbitrary
-- writes to the request row itself.
revoke all on public.message_request_reports from authenticated;
grant select, insert on public.message_request_reports to authenticated;

-- Explicitly keep the stable history index and deletion lookup cheap.
create index if not exists message_deletions_user_message_idx
  on public.message_deletions (user_id, message_id);

commit;
