-- =============================================================================
-- Customers + PPPoE + Sessions (Phase 6).
-- =============================================================================

create table if not exists public.customers (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  full_name      text not null,
  phone          text,
  email          text,
  address        text,
  status         text not null default 'active'
                   check (status in ('active','inactive','suspended')),
  router_id      uuid references public.routers(id) on delete set null,
  balance        numeric(12,2) not null default 0,
  last_login     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_customers_company on public.customers(company_id);
create index if not exists idx_customers_phone on public.customers(company_id, phone);

-- ---- PPPoE plans ------------------------------------------------------------
create table if not exists public.pppoe_packages (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  name           text not null,
  price          numeric(12,2) not null default 0,
  download_kbps  integer,
  upload_kbps    integer,
  data_limit_mb  integer,
  validity_days  integer,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists idx_pppoe_pkg_company on public.pppoe_packages(company_id);

-- ---- PPPoE customers (secrets) ---------------------------------------------
create table if not exists public.pppoe_customers (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  customer_id    uuid references public.customers(id) on delete set null,
  package_id     uuid references public.pppoe_packages(id) on delete set null,
  router_id      uuid references public.routers(id) on delete set null,
  username       text not null,
  status         text not null default 'active'
                   check (status in ('active','suspended','expired')),
  start_date     date,
  expiry_date    date,
  last_login     timestamptz,
  created_at     timestamptz not null default now(),
  unique (company_id, username)
);
create index if not exists idx_pppoe_cust_company on public.pppoe_customers(company_id);

-- ---- Active sessions (live snapshot synced by the agent) --------------------
create table if not exists public.active_sessions (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  router_id      uuid references public.routers(id) on delete cascade,
  username       text not null,
  ip_address     text,
  mac_address    text,
  uptime         text,
  bytes_in       bigint default 0,
  bytes_out      bigint default 0,
  kind           text not null default 'hotspot' check (kind in ('hotspot','pppoe')),
  updated_at     timestamptz not null default now(),
  unique (router_id, username, kind)
);
create index if not exists idx_sessions_company on public.active_sessions(company_id);

-- ---- RLS --------------------------------------------------------------------
alter table public.customers        enable row level security;
alter table public.pppoe_packages   enable row level security;
alter table public.pppoe_customers  enable row level security;
alter table public.active_sessions  enable row level security;

drop policy if exists cust_select on public.customers;
create policy cust_select on public.customers
  for select using (company_id = public.current_company_id());
drop policy if exists cust_write on public.customers;
create policy cust_write on public.customers
  for all using (company_id = public.current_company_id() and public.has_permission('customer:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('customer:manage'));

drop policy if exists ppkg_select on public.pppoe_packages;
create policy ppkg_select on public.pppoe_packages
  for select using (company_id = public.current_company_id());
drop policy if exists ppkg_write on public.pppoe_packages;
create policy ppkg_write on public.pppoe_packages
  for all using (company_id = public.current_company_id() and public.has_permission('pppoe:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('pppoe:manage'));

drop policy if exists pcust_select on public.pppoe_customers;
create policy pcust_select on public.pppoe_customers
  for select using (company_id = public.current_company_id());
drop policy if exists pcust_write on public.pppoe_customers;
create policy pcust_write on public.pppoe_customers
  for all using (company_id = public.current_company_id() and public.has_permission('pppoe:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('pppoe:manage'));

drop policy if exists sess_select on public.active_sessions;
create policy sess_select on public.active_sessions
  for select using (company_id = public.current_company_id());
