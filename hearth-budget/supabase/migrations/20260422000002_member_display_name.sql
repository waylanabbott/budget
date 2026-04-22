-- Add display_name to household_members for partner identification
alter table household_members add column display_name text;

-- Backfill existing owner rows that were created by the Phase 2 add_household_owner()
-- trigger before this column existed. Extract username from auth.users email.
update household_members hm
set display_name = split_part(u.email, '@', 1)
from auth.users u
where hm.user_id = u.id
  and hm.display_name is null;
