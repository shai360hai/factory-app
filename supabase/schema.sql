-- Factory club manager schema
-- Run this in the Supabase SQL editor on a new/existing project

create extension if not exists "uuid-ossp";

-- Entry ticket price tiers (מחירי כניסה)
create table if not exists entry_tiers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric not null default 0,
  created_at timestamptz default now()
);

-- Revenue categories (קטגוריות הכנסה) e.g. bar, entry, vip tables
create table if not exists revenue_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Expense templates (תבניות הוצאות) e.g. DJ, security, cleaning
create table if not exists expense_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  default_amount numeric default 0,
  created_at timestamptz default now()
);

-- Products / merchandise (מוצרים - סחורה)
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cost_price numeric not null default 0,
  sale_price numeric not null default 0,
  created_at timestamptz default now()
);

-- Parties / events (מסיבות)
create table if not exists parties (
  id uuid primary key default uuid_generate_v4(),
  name text,
  event_date date not null,
  po_number text,
  status text not null default 'open' check (status in ('open','closed')),
  archived boolean not null default false,
  created_at timestamptz default now()
);

-- Revenue line items per party (free-form + category, and ticket entries)
create table if not exists party_revenues (
  id uuid primary key default uuid_generate_v4(),
  party_id uuid references parties(id) on delete cascade,
  category_id uuid references revenue_categories(id),
  description text,
  amount numeric not null default 0,
  created_at timestamptz default now()
);

-- Ticket sales per party per tier
create table if not exists party_entries (
  id uuid primary key default uuid_generate_v4(),
  party_id uuid references parties(id) on delete cascade,
  tier_id uuid references entry_tiers(id),
  count integer not null default 0,
  created_at timestamptz default now()
);

-- Expense line items per party
create table if not exists party_expenses (
  id uuid primary key default uuid_generate_v4(),
  party_id uuid references parties(id) on delete cascade,
  template_id uuid references expense_templates(id),
  name text,
  amount numeric not null default 0,
  created_at timestamptz default now()
);

-- Merchandise/stock sold per party (סחורה)
create table if not exists party_stock (
  id uuid primary key default uuid_generate_v4(),
  party_id uuid references parties(id) on delete cascade,
  product_id uuid references products(id),
  quantity_sold integer not null default 0,
  revenue numeric not null default 0,
  cost numeric not null default 0,
  created_at timestamptz default now()
);

-- Row Level Security: enable and allow authenticated users full access.
-- Adjust to match your auth model (e.g. restrict deletes to an admin email,
-- as done in the ERUIT project).
alter table entry_tiers enable row level security;
alter table revenue_categories enable row level security;
alter table expense_templates enable row level security;
alter table products enable row level security;
alter table parties enable row level security;
alter table party_revenues enable row level security;
alter table party_entries enable row level security;
alter table party_expenses enable row level security;
alter table party_stock enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'entry_tiers','revenue_categories','expense_templates','products',
    'parties','party_revenues','party_entries','party_expenses','party_stock'
  ])
  loop
    execute format('
      create policy "authenticated_all_%1$s" on %1$s
      for all using (auth.role() = ''authenticated'')
      with check (auth.role() = ''authenticated'');
    ', t);
  end loop;
end $$;
