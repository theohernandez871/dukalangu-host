-- =============================================================================
-- HOTSPOT BILLING — Foundation schema (Phase 1)
-- Multi-tenant core: companies, profiles, roles, permissions, audit.
-- All app tables carry company_id and are protected by RLS.
-- =============================================================================

-- ---- Companies (tenants) ----------------------------------------------------
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text,
  email         text,
  address       text,
  currency      text not null default 'TZS',
  timezone      text not null default 'Africa/Dar_es_Salaam',
  logo_url      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---- Profiles (1:1 with auth.users) ----------------------------------------
-- Role is an enum-like text checked against a fixed set. RBAC detail lives in
-- role_permissions so permissions are enforced in the database, not the client.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  company_id    uuid references public.companies(id) on delete set null,
  full_name     text,
  phone         text,
  role          text not null default 'operator'
                  check (role in ('super_admin','admin','operator','accountant','support','agent')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---- Permissions catalogue --------------------------------------------------
create table if not exists public.permissions (
  key           text primary key,          -- e.g. 'router:manage'
  description   text
);

create table if not exists public.role_permissions (
  role          text not null,
  permission    text not null references public.permissions(key) on delete cascade,
  primary key (role, permission)
);

-- ---- Audit log --------------------------------------------------------------
create table if not exists public.audit_logs (
  id            bigint generated always as identity primary key,
  company_id    uuid references public.companies(id) on delete cascade,
  actor         uuid references auth.users(id) on delete set null,
  action        text not null,
  entity        text,
  entity_id     text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists idx_audit_company_time on public.audit_logs(company_id, created_at desc);

-- ---- Helper functions (SECURITY DEFINER) -----------------------------------
-- Current user's company. Used by every RLS policy.
create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $ccid$
  select company_id from public.profiles where id = auth.uid();
$ccid$;

-- Does the current user hold a permission (via their role)?
create or replace function public.has_permission(p_key text)
returns boolean language sql stable security definer set search_path = public as $hp$
  select exists (
    select 1
      from public.profiles pr
      join public.role_permissions rp on rp.role = pr.role
     where pr.id = auth.uid() and rp.permission = p_key
  );
$hp$;

-- Is the current user an admin (admin or super_admin)?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $ia$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role in ('admin','super_admin')
  );
$ia$;

-- ---- Auto-provision profile on signup --------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $hnu$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'admin')
  on conflict (id) do nothing;
  return new;
end;
$hnu$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Enable RLS -------------------------------------------------------------
alter table public.companies       enable row level security;
alter table public.profiles        enable row level security;
alter table public.permissions     enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_logs      enable row level security;

-- Companies: members see + admins update their own company.
drop policy if exists company_select on public.companies;
create policy company_select on public.companies
  for select using (id = public.current_company_id());
drop policy if exists company_update on public.companies;
create policy company_update on public.companies
  for update using (id = public.current_company_id() and public.is_admin());

-- Profiles: see co-workers in the same company; update self or by admin.
drop policy if exists profile_select on public.profiles;
create policy profile_select on public.profiles
  for select using (company_id = public.current_company_id() or id = auth.uid());
drop policy if exists profile_update on public.profiles;
create policy profile_update on public.profiles
  for update using (id = auth.uid() or (company_id = public.current_company_id() and public.is_admin()));

-- Permissions catalogue: readable by any authenticated user.
drop policy if exists perm_select on public.permissions;
create policy perm_select on public.permissions for select using (auth.role() = 'authenticated');
drop policy if exists rperm_select on public.role_permissions;
create policy rperm_select on public.role_permissions for select using (auth.role() = 'authenticated');

-- Audit: readable within company by admins; inserts via definer functions only.
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs
  for select using (company_id = public.current_company_id() and public.is_admin());
