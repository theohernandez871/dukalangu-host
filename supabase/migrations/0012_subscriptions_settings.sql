-- =============================================================================
-- Subscriptions + Settings (Phase 9).
-- =============================================================================

-- ---- Subscription plans (catalogue) ----------------------------------------
create table if not exists public.subscription_plans (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  price          numeric(12,2) not null default 0,
  duration_days  integer not null default 30,
  max_routers    integer,
  max_customers  integer,
  max_agents     integer,
  sms_limit      integer,
  features       jsonb not null default '[]'::jsonb,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---- Company subscription (current state) -----------------------------------
create table if not exists public.subscriptions (
  company_id     uuid primary key references public.companies(id) on delete cascade,
  plan_id        uuid references public.subscription_plans(id) on delete set null,
  status         text not null default 'active'
                   check (status in ('active','expired','suspended','trial')),
  started_at     timestamptz not null default now(),
  expires_at     timestamptz,
  updated_at     timestamptz not null default now()
);

-- ---- System settings (per company, key/value) -------------------------------
create table if not exists public.system_settings (
  company_id     uuid not null references public.companies(id) on delete cascade,
  key            text not null,
  value          jsonb,
  updated_at     timestamptz not null default now(),
  primary key (company_id, key)
);

-- ---- RLS --------------------------------------------------------------------
alter table public.subscription_plans enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.system_settings    enable row level security;

-- Plans catalogue: readable by any authenticated user.
drop policy if exists subplan_select on public.subscription_plans;
create policy subplan_select on public.subscription_plans
  for select using (auth.role() = 'authenticated');

drop policy if exists sub_select on public.subscriptions;
create policy sub_select on public.subscriptions
  for select using (company_id = public.current_company_id());
drop policy if exists sub_write on public.subscriptions;
create policy sub_write on public.subscriptions
  for all using (company_id = public.current_company_id() and public.has_permission('subscription:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('subscription:manage'));

drop policy if exists settings_select on public.system_settings;
create policy settings_select on public.system_settings
  for select using (company_id = public.current_company_id());
drop policy if exists settings_write on public.system_settings;
create policy settings_write on public.system_settings
  for all using (company_id = public.current_company_id() and public.has_permission('settings:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('settings:manage'));

-- ---- Seed default subscription plans ---------------------------------------
insert into public.subscription_plans (name, price, duration_days, max_routers, max_customers, max_agents, sms_limit, features)
values
  ('Bure (Trial)', 0, 14, 1, 50, 1, 50, '["Router 1","Wateja 50","SMS 50"]'::jsonb),
  ('Msingi', 20000, 30, 3, 500, 5, 1000, '["Router 3","Wateja 500","SMS 1000","Ripoti"]'::jsonb),
  ('Biashara', 50000, 30, 10, 5000, 20, 5000, '["Router 10","Wateja 5000","SMS 5000","Ripoti kamili","Msaada wa haraka"]'::jsonb)
on conflict do nothing;

-- ---- Reports summary RPC ----------------------------------------------------
-- Aggregate counts for the reports dashboard within a date range.
create or replace function public.report_summary(p_from date, p_to date)
returns table (
  total_sales numeric, payment_count bigint, voucher_count bigint,
  customer_count bigint, active_routers bigint
)
language sql stable security definer set search_path = public as $rpt$
  select
    coalesce((select sum(amount) from public.payments
      where company_id = public.current_company_id() and status = 'successful'
        and created_at::date between p_from and p_to), 0),
    (select count(*) from public.payments
      where company_id = public.current_company_id() and status = 'successful'
        and created_at::date between p_from and p_to),
    (select count(*) from public.vouchers
      where company_id = public.current_company_id()
        and created_at::date between p_from and p_to),
    (select count(*) from public.customers
      where company_id = public.current_company_id()),
    (select count(*) from public.routers
      where company_id = public.current_company_id() and status = 'online');
$rpt$;
