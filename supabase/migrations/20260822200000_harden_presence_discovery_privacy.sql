begin;

-- RT-H: online discovery is opt-in. Existing rows were created by the old
-- default and therefore cannot be treated as an explicit consent signal.
alter table public.user_discovery_settings
  alter column show_online set default false;

update public.user_discovery_settings
set show_online = false
where show_online = true;

commit;
