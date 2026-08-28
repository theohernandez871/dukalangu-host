-- =============================================================================
-- Hotspot packages + vouchers (Phase 5).
-- Packages define speed/validity/price. Vouchers are generated in batches and
-- move through a lifecycle: unused -> active -> used/expired/cancelled.
-- =============================================================================

create table if not exists public.hotspot_packages (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  name            text not null,
  price           numeric(12,2) not null default 0,
  duration_minutes integer,                    -- session/validity length
  validity_days   integer,                     -- days before voucher expires
  download_kbps   integer,
  upload_kbps     integer,
  data_limit_mb   integer,                     -- null = unlimited
  session_timeout_minutes integer,
  idle_timeout_minutes integer,
  shared_users    integer not null default 1,  -- simultaneous devices
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_packages_company on public.hotspot_packages(company_id);

-- Batch groups vouchers generated together (for printing + tracking).
create table if not exists public.voucher_batches (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  package_id      uuid references public.hotspot_packages(id) on delete set null,
  prefix          text,
  quantity        integer not null default 0,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_batches_company on public.voucher_batches(company_id);

create table if not exists public.vouchers (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  batch_id        uuid references public.voucher_batches(id) on delete set null,
  package_id      uuid references public.hotspot_packages(id) on delete set null,
  code            text not null,
  password        text,                        -- optional separate password
  price           numeric(12,2) not null default 0,
  status          text not null default 'unused'
                    check (status in ('unused','active','used','expired','cancelled')),
  customer_id     uuid,
  router_id       uuid references public.routers(id) on delete set null,
  activated_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  unique (company_id, code)
);
create index if not exists idx_vouchers_company_status on public.vouchers(company_id, status);
create index if not exists idx_vouchers_batch on public.vouchers(batch_id);

-- ---- RLS --------------------------------------------------------------------
alter table public.hotspot_packages enable row level security;
alter table public.voucher_batches  enable row level security;
alter table public.vouchers         enable row level security;

-- Packages: members read; managers write.
drop policy if exists pkg_select on public.hotspot_packages;
create policy pkg_select on public.hotspot_packages
  for select using (company_id = public.current_company_id());
drop policy if exists pkg_write on public.hotspot_packages;
create policy pkg_write on public.hotspot_packages
  for all using (company_id = public.current_company_id() and public.has_permission('package:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('package:manage'));

-- Batches: members read; voucher managers create.
drop policy if exists batch_select on public.voucher_batches;
create policy batch_select on public.voucher_batches
  for select using (company_id = public.current_company_id());
drop policy if exists batch_write on public.voucher_batches;
create policy batch_write on public.voucher_batches
  for all using (company_id = public.current_company_id() and public.has_permission('voucher:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('voucher:manage'));

-- Vouchers: members read; voucher managers write.
drop policy if exists vouchers_select on public.vouchers;
create policy vouchers_select on public.vouchers
  for select using (company_id = public.current_company_id());
drop policy if exists vouchers_write on public.vouchers;
create policy vouchers_write on public.vouchers
  for all using (company_id = public.current_company_id() and public.has_permission('voucher:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('voucher:manage'));
