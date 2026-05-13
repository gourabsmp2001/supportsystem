create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  admin_id uuid references users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text default 'admin',
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users
add column if not exists auth_user_id uuid unique;

alter table users
add column if not exists admin_id uuid references users(id) on delete cascade;

alter table users
add column if not exists status text default 'Active';

alter table users
drop constraint if exists users_role_check;

alter table users
add constraint users_role_check check (role in ('admin', 'user'));

alter table users
drop constraint if exists users_status_check;

alter table users
add constraint users_status_check check (status in ('Active', 'Inactive'));

alter table users enable row level security;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

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

create or replace function enforce_five_users_per_admin()
returns trigger as $$
declare
  active_user_count integer;
begin
  if new.role = 'user' then
    if new.admin_id is null then
      raise exception 'A regular user must be linked to an admin account.';
    end if;

    select count(*)
    into active_user_count
    from users
    where admin_id = new.admin_id
      and role = 'user'
      and status = 'Active'
      and id <> coalesce(new.id, gen_random_uuid());

    if coalesce(new.status, 'Active') = 'Active' and active_user_count >= 5 then
      raise exception 'Only 5 active users are allowed under one admin account.';
    end if;
  end if;

  if new.role = 'admin' then
    new.admin_id = null;
  end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_enforce_five_users_per_admin on users;

create trigger trg_enforce_five_users_per_admin
before insert or update on users
for each row execute function enforce_five_users_per_admin();

create table if not exists retailers (
  id uuid primary key default gen_random_uuid(),
  retail_id text unique,
  retail_name text not null,
  license_code text,
  shop_type text,
  area text,
  contact_person text,
  phone text,
  status text default 'Active',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table retailers enable row level security;

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  brand_id text unique,
  brand_name text not null,
  report_code text,
  category text,
  status text default 'Active',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table brands enable row level security;

create table if not exists brand_mrp (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  category text,
  bottle_size text,
  mrp numeric(12,2) default 0,
  mrp_750ml numeric(12,2) default 0,
  mrp_500ml numeric(12,2) default 0,
  mrp_375ml numeric(12,2) default 0,
  mrp_180ml numeric(12,2) default 0,
  mrp_90ml numeric(12,2) default 0,
  effective_month text not null,
  status text default 'Active',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table brand_mrp enable row level security;

create table if not exists sss_sales_entries (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  executive_name text,
  area text,
  retail_name text not null,
  brand_name text not null,
  bottle_size text,
  quantity_sold numeric(12,2) default 0,
  qty_750ml numeric(12,2) default 0,
  qty_500ml numeric(12,2) default 0,
  qty_375ml numeric(12,2) default 0,
  qty_180ml numeric(12,2) default 0,
  qty_90ml numeric(12,2) default 0,
  total_bottles numeric(12,2) default 0,
  total_cases numeric(12,2) default 0,
  sales_data jsonb default '{}'::jsonb,
  market_share_data jsonb default '{}'::jsonb,
  rum_market_share numeric(8,2) default 0,
  category text,
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table sss_sales_entries enable row level security;

create table if not exists availability_entries (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  retail_name text not null,
  executive_name text,
  category text,
  depot text,
  status text default 'Active',
  brand_name text not null,
  availability_status text default 'Not Asked',
  availability_data jsonb default '{}'::jsonb,
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table availability_entries enable row level security;

create table if not exists scheme_projections (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  retail_name text not null,
  brand_name text not null,
  scheme_name text,
  target_quantity numeric(12,2) default 0,
  expected_sale numeric(12,2) default 0,
  actual_sale numeric(12,2) default 0,
  difference numeric(12,2) default 0,
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table scheme_projections enable row level security;

create table if not exists opening_stock_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  month text not null,
  retail_name text not null,
  brand_name text not null,
  bottle_size text,
  opening_stock_quantity numeric(12,2) default 0,
  opening_stock_cases numeric(12,2) default 0,
  stock_750ml numeric(12,2) default 0,
  stock_500ml numeric(12,2) default 0,
  stock_375ml numeric(12,2) default 0,
  stock_180ml numeric(12,2) default 0,
  stock_90ml numeric(12,2) default 0,
  total_stock_bottles numeric(12,2) default 0,
  total_stock_cases numeric(12,2) default 0,
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table opening_stock_entries enable row level security;

create table if not exists secondary_market_share_entries (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  retail_name text not null,
  own_brand_name text not null,
  own_brand_sale numeric(12,2) default 0,
  competitor_brand_name text,
  competitor_sale numeric(12,2) default 0,
  total_market_sale numeric(12,2) default 0,
  market_share_percentage numeric(8,2) default 0,
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table secondary_market_share_entries enable row level security;

create table if not exists spot_promotion_entries (
  id uuid primary key default gen_random_uuid(),
  promoter_name text not null,
  bank_name text,
  branch text,
  account_number text,
  ifsc text,
  pan text,
  month text not null,
  total_month_days numeric(5,2) default 0,
  leave_days numeric(5,2) default 0,
  actual_working_days numeric(5,2) default 0,
  daily_rate numeric(12,2) default 0,
  total_payable_amount numeric(12,2) default 0,
  date date,
  retail_name text not null,
  brand_name text not null,
  bottle_size text,
  quantity_sold numeric(12,2) default 0,
  qty_750ml numeric(12,2) default 0,
  qty_500ml numeric(12,2) default 0,
  qty_375ml numeric(12,2) default 0,
  qty_180ml numeric(12,2) default 0,
  qty_90ml numeric(12,2) default 0,
  total_bottles numeric(12,2) default 0,
  total_cases numeric(12,2) default 0,
  promotion_data jsonb default '{}'::jsonb,
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table spot_promotion_entries enable row level security;

create table if not exists retail_visit_entries (
  id uuid primary key default gen_random_uuid(),
  visit_date date not null,
  visit_month text,
  retail_name text not null,
  brand_name text,
  executive_name text,
  area text,
  visit_purpose text,
  notes text,
  photo_url text,
  photo_path text,
  next_follow_up_date date,
  status text default 'Open',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table retail_visit_entries enable row level security;

create table if not exists pjp_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  month text not null,
  executive_name text,
  area text,
  planned_retail_name text not null,
  brand_name text,
  visit_status text default 'Planned',
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table pjp_entries enable row level security;

alter table retail_visit_entries
add column if not exists brand_name text;

alter table pjp_entries
add column if not exists brand_name text;

alter table brands add column if not exists report_code text;

alter table profiles add column if not exists email text;

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

alter table brand_mrp add column if not exists mrp_750ml numeric(12,2) default 0;
alter table brand_mrp add column if not exists mrp_500ml numeric(12,2) default 0;
alter table brand_mrp add column if not exists mrp_375ml numeric(12,2) default 0;
alter table brand_mrp add column if not exists mrp_180ml numeric(12,2) default 0;
alter table brand_mrp add column if not exists mrp_90ml numeric(12,2) default 0;

alter table sss_sales_entries add column if not exists qty_750ml numeric(12,2) default 0;
alter table sss_sales_entries add column if not exists qty_500ml numeric(12,2) default 0;
alter table sss_sales_entries add column if not exists qty_375ml numeric(12,2) default 0;
alter table sss_sales_entries add column if not exists qty_180ml numeric(12,2) default 0;
alter table sss_sales_entries add column if not exists qty_90ml numeric(12,2) default 0;
alter table sss_sales_entries add column if not exists total_bottles numeric(12,2) default 0;
alter table sss_sales_entries add column if not exists total_cases numeric(12,2) default 0;
alter table sss_sales_entries add column if not exists sales_data jsonb default '{}'::jsonb;
alter table sss_sales_entries add column if not exists market_share_data jsonb default '{}'::jsonb;
alter table sss_sales_entries add column if not exists rum_market_share numeric(8,2) default 0;

alter table availability_entries add column if not exists availability_data jsonb default '{}'::jsonb;

alter table opening_stock_entries add column if not exists stock_750ml numeric(12,2) default 0;
alter table opening_stock_entries add column if not exists stock_500ml numeric(12,2) default 0;
alter table opening_stock_entries add column if not exists stock_375ml numeric(12,2) default 0;
alter table opening_stock_entries add column if not exists stock_180ml numeric(12,2) default 0;
alter table opening_stock_entries add column if not exists stock_90ml numeric(12,2) default 0;
alter table opening_stock_entries add column if not exists total_stock_bottles numeric(12,2) default 0;
alter table opening_stock_entries add column if not exists total_stock_cases numeric(12,2) default 0;

alter table spot_promotion_entries add column if not exists qty_750ml numeric(12,2) default 0;
alter table spot_promotion_entries add column if not exists qty_500ml numeric(12,2) default 0;
alter table spot_promotion_entries add column if not exists qty_375ml numeric(12,2) default 0;
alter table spot_promotion_entries add column if not exists qty_180ml numeric(12,2) default 0;
alter table spot_promotion_entries add column if not exists qty_90ml numeric(12,2) default 0;
alter table spot_promotion_entries add column if not exists total_bottles numeric(12,2) default 0;
alter table spot_promotion_entries add column if not exists total_cases numeric(12,2) default 0;
alter table spot_promotion_entries add column if not exists promotion_data jsonb default '{}'::jsonb;
alter table spot_promotion_entries add column if not exists remarks text;

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

create index if not exists idx_sss_month on sss_sales_entries(month);
create index if not exists idx_availability_month on availability_entries(month);
create index if not exists idx_scheme_month on scheme_projections(month);
create index if not exists idx_stock_month on opening_stock_entries(month);
create index if not exists idx_market_share_month on secondary_market_share_entries(month);
create index if not exists idx_spot_month on spot_promotion_entries(month);
create index if not exists idx_visit_month on retail_visit_entries(visit_month);
create index if not exists idx_pjp_month on pjp_entries(month);

insert into users (email, full_name, role)
values ('admin@supportsystem.local', 'Support System Admin', 'admin')
on conflict (email) do nothing;

do $$
declare
  owner_admin_id uuid;
begin
  select id into owner_admin_id
  from users
  where email = 'admin@supportsystem.local'
  limit 1;

  insert into users (email, full_name, role, admin_id)
  values
    ('user1@supportsystem.local', 'Support User 1', 'user', owner_admin_id),
    ('user2@supportsystem.local', 'Support User 2', 'user', owner_admin_id),
    ('user3@supportsystem.local', 'Support User 3', 'user', owner_admin_id),
    ('user4@supportsystem.local', 'Support User 4', 'user', owner_admin_id),
    ('user5@supportsystem.local', 'Support User 5', 'user', owner_admin_id)
  on conflict (email) do nothing;
end $$;

insert into storage.buckets (id, name, public)
values ('retail-visit-photos', 'retail-visit-photos', true)
on conflict (id) do nothing;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'users',
    'profiles',
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
    execute format('drop policy if exists "Authenticated users can read %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Authenticated users can insert %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Authenticated users can update %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Authenticated users can delete %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Admin can manage %1$s" on %1$I', tbl);
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

drop policy if exists "Authenticated users can upload retail visit photos" on storage.objects;
drop policy if exists "Public can read retail visit photos" on storage.objects;
drop policy if exists "Authenticated users can update retail visit photos" on storage.objects;
drop policy if exists "Authenticated users can delete retail visit photos" on storage.objects;

create policy "Authenticated users can upload retail visit photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'retail-visit-photos');

create policy "Public can read retail visit photos"
on storage.objects for select to public
using (bucket_id = 'retail-visit-photos');

create policy "Authenticated users can update retail visit photos"
on storage.objects for update to authenticated
using (bucket_id = 'retail-visit-photos')
with check (bucket_id = 'retail-visit-photos');

create policy "Authenticated users can delete retail visit photos"
on storage.objects for delete to authenticated
using (bucket_id = 'retail-visit-photos');
