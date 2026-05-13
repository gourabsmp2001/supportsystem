-- Role-based access control upgrade for Support System.
-- Run this once in Supabase SQL Editor after deploying the frontend.
-- Employee auth users are still created manually from Supabase Dashboard > Authentication > Users.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists role text default 'employee';
alter table profiles add column if not exists status text default 'active';
alter table profiles add column if not exists created_at timestamptz default now();
alter table profiles add column if not exists updated_at timestamptz default now();

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'employee'));

alter table profiles drop constraint if exists profiles_status_check;
alter table profiles add constraint profiles_status_check check (status in ('active', 'inactive'));

create or replace function current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from profiles
  where id = auth.uid()
    and status = 'active'
  limit 1
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_user_role() = 'admin', false)
$$;

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function set_created_by()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then
    new.created_by = auth.uid();
  end if;
  return new;
end;
$$;

create or replace function create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'employee'),
    'active'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(profiles.full_name, excluded.full_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_create_profile_for_auth_user on auth.users;
create trigger trg_create_profile_for_auth_user
after insert on auth.users
for each row execute function create_profile_for_auth_user();

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function touch_updated_at();

alter table retailers add column if not exists created_by uuid references auth.users(id);
alter table brands add column if not exists created_by uuid references auth.users(id);
alter table brand_mrp add column if not exists created_by uuid references auth.users(id);

alter table sss_sales_entries add column if not exists created_by uuid references auth.users(id);
alter table availability_entries add column if not exists created_by uuid references auth.users(id);
alter table scheme_projections add column if not exists created_by uuid references auth.users(id);
alter table opening_stock_entries add column if not exists created_by uuid references auth.users(id);
alter table secondary_market_share_entries add column if not exists created_by uuid references auth.users(id);
alter table spot_promotion_entries add column if not exists created_by uuid references auth.users(id);
alter table retail_visit_entries add column if not exists created_by uuid references auth.users(id);
alter table pjp_entries add column if not exists created_by uuid references auth.users(id);

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'retailers',
    'brands',
    'brand_mrp',
    'sss_sales_entries',
    'availability_entries',
    'scheme_projections',
    'opening_stock_entries',
    'secondary_market_share_entries',
    'spot_promotion_entries',
    'retail_visit_entries',
    'pjp_entries'
  ]
  loop
    execute format('drop trigger if exists trg_set_created_by_%1$s on %1$I', tbl);
    execute format('create trigger trg_set_created_by_%1$s before insert on %1$I for each row execute function set_created_by()', tbl);
  end loop;
end $$;

alter table profiles enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'users',
    'retailers',
    'brands',
    'brand_mrp',
    'sss_sales_entries',
    'availability_entries',
    'scheme_projections',
    'opening_stock_entries',
    'secondary_market_share_entries',
    'spot_promotion_entries',
    'retail_visit_entries',
    'pjp_entries',
    'profiles'
  ]
  loop
    execute format('drop policy if exists "Authenticated users can read %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Authenticated users can insert %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Authenticated users can update %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Authenticated users can delete %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Admin can manage %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Admin can read %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Employee can read own %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Employee can insert own %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Employee can update own %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Employee can read lookup %1$s" on %1$I', tbl);
  end loop;
end $$;

drop policy if exists "Profiles can be read by owner or admin" on profiles;
drop policy if exists "Profiles can be managed by admin" on profiles;

create policy "Profiles can be read by owner or admin"
on profiles for select to authenticated
using (id = auth.uid() or is_admin());

create policy "Profiles can be managed by admin"
on profiles for all to authenticated
using (is_admin())
with check (is_admin());

create policy "Admin can manage users"
on users for all to authenticated
using (is_admin())
with check (is_admin());

create policy "Admin can manage retailers"
on retailers for all to authenticated
using (is_admin())
with check (is_admin());

create policy "Employee can read lookup retailers"
on retailers for select to authenticated
using (current_user_role() = 'employee' and coalesce(status, 'Active') = 'Active');

create policy "Admin can manage brands"
on brands for all to authenticated
using (is_admin())
with check (is_admin());

create policy "Employee can read lookup brands"
on brands for select to authenticated
using (current_user_role() = 'employee' and coalesce(status, 'Active') = 'Active');

create policy "Admin can manage brand_mrp"
on brand_mrp for all to authenticated
using (is_admin())
with check (is_admin());

create policy "Employee can read lookup brand_mrp"
on brand_mrp for select to authenticated
using (current_user_role() = 'employee' and coalesce(status, 'Active') = 'Active');

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'sss_sales_entries',
    'availability_entries',
    'scheme_projections',
    'opening_stock_entries',
    'secondary_market_share_entries',
    'spot_promotion_entries',
    'retail_visit_entries',
    'pjp_entries'
  ]
  loop
    execute format('create policy "Admin can manage %1$s" on %1$I for all to authenticated using (is_admin()) with check (is_admin())', tbl);
    execute format('create policy "Employee can read own %1$s" on %1$I for select to authenticated using (current_user_role() = ''employee'' and created_by = auth.uid())', tbl);
    execute format('create policy "Employee can insert own %1$s" on %1$I for insert to authenticated with check (current_user_role() = ''employee'' and created_by = auth.uid())', tbl);
    execute format('create policy "Employee can update own %1$s" on %1$I for update to authenticated using (current_user_role() = ''employee'' and created_by = auth.uid()) with check (current_user_role() = ''employee'' and created_by = auth.uid())', tbl);
  end loop;
end $$;

-- Optional bootstrap examples:
-- 1. Create the client/admin auth user in Supabase Authentication.
-- 2. Make that account admin:
--    insert into profiles (id, email, full_name, role, status)
--    values ('AUTH_USER_UUID', 'owner@example.com', 'Owner Name', 'admin', 'active')
--    on conflict (id) do update set role = 'admin', status = 'active';
-- 3. Create 5 employee auth users in Supabase Authentication.
-- 4. For each employee:
--    insert into profiles (id, email, full_name, role, status)
--    values ('EMPLOYEE_AUTH_USER_UUID', 'employee@example.com', 'Employee Name', 'employee', 'active')
--    on conflict (id) do update set role = 'employee', status = 'active';
