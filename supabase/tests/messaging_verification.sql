-- Read-only checks for the exact messaging SQL supplied for Zenith.

-- 1. Every table created by the supplied SQL must have RLS enabled.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'conversations',
    'conversation_members',
    'messages',
    'message_lifecycle_audit',
    'message_deletions',
    'message_requests',
    'message_request_reports',
    'user_blocks',
    'user_discovery_settings'
  )
order by tablename;

-- 2. Confirm the public UUID, internal identity, and current column names.
select
  table_name,
  column_name,
  data_type,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'conversations',
    'conversation_members',
    'message_requests',
    'messages'
  )
  and column_name in (
    'id',
    'public_id',
    'direct_key',
    'conversation_id',
    'user_id',
    'sender_id',
    'recipient_id',
    'reply_to_message_id',
    'message_type',
    'content',
    'client_message_id',
    'version',
    'left_at',
    'last_read_at',
    'last_read_message_id'
  )
order by table_name, ordinal_position;

-- 3. Review the policies installed by the supplied SQL.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in (
    'conversations',
    'conversation_members',
    'messages',
    'message_lifecycle_audit',
    'message_deletions',
    'message_requests',
    'message_request_reports',
    'user_blocks',
    'user_discovery_settings'
  )
order by tablename, policyname;

-- 4. Confirm the direct conversation uniqueness and message constraints.
select
  conrelid::regclass as table_name,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in (
  'public.conversations'::regclass,
  'public.conversation_members'::regclass,
  'public.messages'::regclass,
  'public.message_requests'::regclass
)
order by table_name, conname;

-- 5. Confirm the membership, send authorization and idempotent insert RPCs.
select
  routine_schema,
  routine_name,
  routine_type,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'is_conversation_member',
    'can_access_conversation',
    'can_send_message',
    'insert_message_idempotent'
  )
order by routine_name;

-- 6. Manual two-account checks after creating test accounts A, B, and C:
--    - A creates a direct request to B.
--    - B accepts; A and B can read and send messages.
--    - C cannot select A/B conversation or messages through the API.
--    - A can edit/recall a message before 15 minutes; after that the API returns 403.
--    - DELETE only inserts message_deletions for the requesting user.
--    - A block is stored in user_blocks and prevents a new request in the API.

-- 7. Confirm the RT-F/RT-I hardening objects are installed.
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'message_request_reports'
order by ordinal_position;

select
  conrelid::regclass as table_name,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.message_requests'::regclass
  and conname = 'message_requests_status_check';

-- 9. RT-F lifecycle audit is internal and driven by the messages update
-- trigger; authenticated clients must not be able to read it directly.
select
  tgname,
  tgrelid::regclass as table_name
from pg_trigger
where tgrelid = 'public.messages'::regclass
  and tgname = 'audit_messages_lifecycle'
  and not tgenabled = 'D';

select
  has_table_privilege(
    'authenticated',
    'public.message_lifecycle_audit',
    'select'
  ) as authenticated_can_read_lifecycle_audit;

-- 10. RT-H privacy defaults: online and nearby discovery are opt-in. Nearby
-- coordinates are intentionally not represented in the database schema;
-- the realtime server keeps only an approximate, short-lived memory entry.
select
  column_name,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'user_discovery_settings'
  and column_name in ('show_online', 'show_nearby')
order by column_name;

-- 11. RT-B executable fixture checks (transactional and rolled back):
--    Run supabase/tests/messaging_rt_b.sql in staging. It verifies pending
--    request/block insert denial, client key deduplication, server-owned
--    sender/timestamp/version fields and user-scoped read cursor updates.
