-- =============================================================================
-- Payments + Transactions (Phase 7).
-- Payment logic is kept separate from MikroTik. Webhooks are idempotent: a
-- provider reference can only be recorded once (unique constraint), so a repeated
-- callback never double-credits.
-- =============================================================================

create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  customer_id    uuid references public.customers(id) on delete set null,
  amount         numeric(12,2) not null,
  method         text not null default 'cash'
                   check (method in ('cash','mpesa','airtel','tigo','halopesa','card','other')),
  reference      text,                        -- provider reference (idempotency key)
  status         text not null default 'pending'
                   check (status in ('pending','successful','failed','cancelled','refunded')),
  description    text,
  voucher_id     uuid references public.vouchers(id) on delete set null,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_payments_company_time on public.payments(company_id, created_at desc);
create index if not exists idx_payments_status on public.payments(company_id, status);
-- Idempotency: a non-null provider reference is unique per company. A repeated
-- webhook with the same reference cannot insert a second row.
create unique index if not exists uq_payments_reference
  on public.payments(company_id, reference) where reference is not null;

-- Withdrawals / payouts log (money taken out by the owner).
create table if not exists public.withdrawals (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  amount         numeric(12,2) not null,
  method         text,
  note           text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_withdrawals_company on public.withdrawals(company_id, created_at desc);

-- ---- RLS --------------------------------------------------------------------
alter table public.payments    enable row level security;
alter table public.withdrawals enable row level security;

drop policy if exists pay_select on public.payments;
create policy pay_select on public.payments
  for select using (company_id = public.current_company_id() and public.has_permission('payment:view'));
drop policy if exists pay_write on public.payments;
create policy pay_write on public.payments
  for all using (company_id = public.current_company_id() and public.has_permission('payment:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('payment:manage'));

drop policy if exists wd_select on public.withdrawals;
create policy wd_select on public.withdrawals
  for select using (company_id = public.current_company_id() and public.has_permission('payment:view'));
drop policy if exists wd_write on public.withdrawals;
create policy wd_write on public.withdrawals
  for all using (company_id = public.current_company_id() and public.has_permission('payment:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('payment:manage'));

-- ---- Revenue summary (for dashboard + reports) ------------------------------
-- Returns today/month/total successful revenue and remaining balance.
create or replace function public.revenue_summary()
returns table (today numeric, this_month numeric, total numeric, withdrawn numeric, remaining numeric)
language sql stable security definer set search_path = public as $rs$
  with paid as (
    select amount, created_at from public.payments
     where company_id = public.current_company_id() and status = 'successful'
  ), wd as (
    select coalesce(sum(amount),0) as w from public.withdrawals
     where company_id = public.current_company_id()
  )
  select
    coalesce(sum(amount) filter (where created_at::date = current_date), 0),
    coalesce(sum(amount) filter (where date_trunc('month', created_at) = date_trunc('month', current_date)), 0),
    coalesce(sum(amount), 0),
    (select w from wd),
    coalesce(sum(amount), 0) - (select w from wd)
  from paid;
$rs$;
