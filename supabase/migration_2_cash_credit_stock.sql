-- Migration 2: cash/credit split for revenues, start/end quantity for stock,
-- and seed fixed revenue categories (כניסה, מלצריות, בר).
-- Run this in the Supabase SQL editor on top of schema.sql.

alter table party_revenues add column if not exists cash_amount numeric not null default 0;
alter table party_revenues add column if not exists credit_amount numeric not null default 0;

alter table party_stock add column if not exists start_qty numeric not null default 0;
alter table party_stock add column if not exists end_qty numeric not null default 0;
alter table party_stock add column if not exists price numeric not null default 0;

-- Seed the three fixed revenue categories if they don't already exist
insert into revenue_categories (name)
select v.name from (values ('כניסה'), ('מלצריות'), ('בר')) as v(name)
where not exists (select 1 from revenue_categories rc where rc.name = v.name);
