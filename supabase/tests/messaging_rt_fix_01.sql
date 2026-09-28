-- RT-FIX-01 verification.
-- Run after the messaging migrations on a staging Supabase database with at
-- least two profile rows. The transaction is rolled back at the end.

begin;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.messages'::regclass
      and tgname = 'touch_conversation_on_message_insert'
  ) then
    raise exception 'RT-FIX-01 message insert trigger is missing';
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'conversations'
      and indexname = 'conversations_inbox_order_idx'
  ) then
    raise exception 'RT-FIX-01 inbox ordering index is missing';
  end if;
end;
$$;

create temporary table rt_fix_users (
  user_a uuid not null,
  user_b uuid not null
) on commit drop;

insert into rt_fix_users (user_a, user_b)
select
  max(profile_id::text) filter (where profile_number = 1)::uuid,
  max(profile_id::text) filter (where profile_number = 2)::uuid
from (
  select
    id as profile_id,
    row_number() over (order by id) as profile_number
  from public.profiles
  limit 2
) profiles_for_test;

do $$
begin
  if not exists (
    select 1
    from rt_fix_users
    where user_a is not null
      and user_b is not null
  ) then
    raise exception 'RT-FIX-01 needs at least two profiles';
  end if;
end;
$$;

create temporary table rt_fix_conversation (
  id bigint not null,
  public_id uuid not null
) on commit drop;

set local role service_role;

with created as (
  insert into public.conversations (
    kind,
    direct_key,
    created_by
  )
  select
    'direct',
    'rt-fix-01:' || gen_random_uuid()::text,
    user_a
  from rt_fix_users
  returning id, public_id
)
insert into rt_fix_conversation (id, public_id)
select id, public_id
from created;

insert into public.conversation_members (
  conversation_id,
  user_id,
  role
)
select conversation.id, users.user_id, users.role
from rt_fix_conversation conversation
cross join lateral (
  values
    ((select user_a from rt_fix_users), 'owner'::varchar(16)),
    ((select user_b from rt_fix_users), 'member'::varchar(16))
) as users(user_id, role);

create temporary table rt_fix_times (
  before_insert timestamptz,
  after_insert timestamptz,
  after_retry timestamptz
) on commit drop;

insert into rt_fix_times (before_insert)
select updated_at
from public.conversations
where id = (select id from rt_fix_conversation);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  (select user_a::text from rt_fix_users),
  true
);

create temporary table rt_fix_first_message as
select *
from public.insert_message_idempotent(
  (select id from rt_fix_conversation),
  '20000000-0000-0000-0000-000000000001'::uuid,
  'first canonical message',
  'text',
  null
);

update rt_fix_times
set after_insert = (
  select updated_at
  from public.conversations
  where id = (select id from rt_fix_conversation)
);

create temporary table rt_fix_retry as
select *
from public.insert_message_idempotent(
  (select id from rt_fix_conversation),
  '20000000-0000-0000-0000-000000000001'::uuid,
  'first canonical message',
  'text',
  null
);

update rt_fix_times
set after_retry = (
  select updated_at
  from public.conversations
  where id = (select id from rt_fix_conversation)
);

do $$
declare
  timestamps record;
  first_count integer;
begin
  select * into timestamps from rt_fix_times;

  if timestamps.after_insert <= timestamps.before_insert then
    raise exception 'RT-FIX-01 did not advance conversations.updated_at';
  end if;

  if timestamps.after_retry is distinct from timestamps.after_insert then
    raise exception 'RT-FIX-01 idempotent retry changed inbox order timestamp';
  end if;

  if (select deduplicated from rt_fix_retry) is distinct from true then
    raise exception 'RT-FIX-01 retry did not return the canonical row';
  end if;

  select count(*)
  into first_count
  from public.messages
  where sender_id = (select user_a from rt_fix_users)
    and client_message_id = '20000000-0000-0000-0000-000000000001'::uuid;

  if first_count <> 1 then
    raise exception 'RT-FIX-01 retry created a duplicate message';
  end if;
end;
$$;

rollback;
