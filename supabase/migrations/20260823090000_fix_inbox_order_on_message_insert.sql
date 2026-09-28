begin;

-- RT-FIX-01: the inbox order is driven by the conversation row, so every
-- canonical message insert must advance that row in the same transaction.
-- An idempotent retry does not insert a message and therefore does not fire
-- this trigger or change the conversation order.
create or replace function public.touch_conversation_on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations as conversation
  set updated_at = new.created_at
  where conversation.id = new.conversation_id
    and conversation.deleted_at is null
    and conversation.updated_at < new.created_at;

  return new;
end;
$$;

revoke all on function public.touch_conversation_on_message_insert() from public;

drop trigger if exists touch_conversation_on_message_insert
  on public.messages;
create trigger touch_conversation_on_message_insert
after insert on public.messages
for each row execute function public.touch_conversation_on_message_insert();

-- Preserve an explicit, newer conversation timestamp supplied by the trigger
-- above. Ordinary conversation/message/settings updates still receive a
-- server timestamp, while the backfill below keeps the existing inbox order
-- canonical instead of assigning one migration-time timestamp to every row.
create or replace function public.set_messaging_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'conversations'
    and tg_op = 'UPDATE'
    and new.updated_at is distinct from old.updated_at
    and new.updated_at > old.updated_at then
    return new;
  end if;

  new.updated_at = clock_timestamp();
  return new;
end;
$$;

-- Repair conversations created before RT-FIX-01 was deployed.
with latest_message as (
  select
    message.conversation_id,
    max(message.created_at) as latest_created_at
  from public.messages as message
  where message.deleted_at is null
  group by message.conversation_id
)
update public.conversations as conversation
set updated_at = latest_message.latest_created_at
from latest_message
where conversation.id = latest_message.conversation_id
  and conversation.deleted_at is null
  and conversation.updated_at < latest_message.latest_created_at;

create index if not exists conversations_inbox_order_idx
  on public.conversations (updated_at desc, id desc)
  where deleted_at is null;

commit;
