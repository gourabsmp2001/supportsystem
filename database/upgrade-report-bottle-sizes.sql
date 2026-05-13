alter table brands add column if not exists report_code text;

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

update sss_sales_entries
set total_bottles = coalesce(total_bottles, 0) + coalesce(nullif(quantity_sold, 0), 0)
where coalesce(total_bottles, 0) = 0 and coalesce(quantity_sold, 0) <> 0;

update spot_promotion_entries
set total_bottles = coalesce(total_bottles, 0) + coalesce(nullif(quantity_sold, 0), 0)
where coalesce(total_bottles, 0) = 0 and coalesce(quantity_sold, 0) <> 0;

update opening_stock_entries
set total_stock_bottles = coalesce(total_stock_bottles, 0) + coalesce(nullif(opening_stock_quantity, 0), 0),
    total_stock_cases = coalesce(total_stock_cases, 0) + coalesce(nullif(opening_stock_cases, 0), 0)
where coalesce(total_stock_bottles, 0) = 0 and coalesce(opening_stock_quantity, 0) <> 0;
