create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  role text default 'admin',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users enable row level security;

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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table retailers enable row level security;

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  brand_id text unique,
  brand_name text not null,
  category text,
  status text default 'Active',
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
  effective_month text not null,
  status text default 'Active',
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
  total_cases numeric(12,2) default 0,
  category text,
  remarks text,
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
  remarks text,
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
  remarks text,
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
  total_cases numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table spot_promotion_entries enable row level security;

create table if not exists retail_visit_entries (
  id uuid primary key default gen_random_uuid(),
  visit_date date not null,
  visit_month text,
  retail_name text not null,
  executive_name text,
  area text,
  visit_purpose text,
  notes text,
  photo_url text,
  photo_path text,
  next_follow_up_date date,
  status text default 'Open',
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
  visit_status text default 'Planned',
  remarks text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table pjp_entries enable row level security;

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

insert into storage.buckets (id, name, public)
values ('retail-visit-photos', 'retail-visit-photos', true)
on conflict (id) do nothing;

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
    'pjp_entries'
  ]
  loop
    execute format('drop policy if exists "Authenticated users can read %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Authenticated users can insert %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Authenticated users can update %1$s" on %1$I', tbl);
    execute format('drop policy if exists "Authenticated users can delete %1$s" on %1$I', tbl);

    execute format('create policy "Authenticated users can read %1$s" on %1$I for select to authenticated using (true)', tbl);
    execute format('create policy "Authenticated users can insert %1$s" on %1$I for insert to authenticated with check (true)', tbl);
    execute format('create policy "Authenticated users can update %1$s" on %1$I for update to authenticated using (true) with check (true)', tbl);
    execute format('create policy "Authenticated users can delete %1$s" on %1$I for delete to authenticated using (true)', tbl);
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
