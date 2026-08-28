-- =============================================================================
-- Routers (Phase 3) — router records, credentials (Vault), health, agents.
-- Password is stored in Supabase Vault, never in a readable column.
-- =============================================================================

-- ---- Routers ----------------------------------------------------------------
create table if not exists public.routers (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  name          text not null,
  host          text not null,                 -- LAN IP, e.g. 192.168.88.1
  api_port      integer not null default 8728,
  api_ssl_port  integer,
  username      text not null,
  vault_secret_id uuid,                         -- FK into vault.secrets (password)
  location      text,
  status        text not null default 'unknown'
                  check (status in ('unknown','online','offline','error')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_routers_company on public.routers(company_id);

-- ---- Router health (latest snapshot per router) -----------------------------
create table if not exists public.router_health (
  router_id     uuid primary key references public.routers(id) on delete cascade,
  ros_version   text,
  uptime        text,
  cpu_load      integer,
  free_memory   bigint,
  total_memory  bigint,
  active_users  integer,
  api_ok        boolean,
  last_sync     timestamptz,
  last_error    text,
  updated_at    timestamptz not null default now()
);

-- ---- Agents (LAN bridge devices) --------------------------------------------
create table if not exists public.router_agents (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  router_id     uuid references public.routers(id) on delete set null,
  name          text not null,
  token_hash    text not null,                 -- sha256 of the agent token
  last_seen     timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_agents_company on public.router_agents(company_id);

-- ---- Router commands (dashboard -> agent -> MikroTik) -----------------------
create table if not exists public.router_commands (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  router_id     uuid not null references public.routers(id) on delete cascade,
  command       text not null,
  params        jsonb not null default '{}'::jsonb,
  status        text not null default 'pending'
                  check (status in ('pending','running','done','failed','timeout')),
  result        jsonb,
  error         text,
  created_at    timestamptz not null default now(),
  executed_at   timestamptz,
  finished_at   timestamptz
);
create index if not exists idx_commands_router_status on public.router_commands(router_id, status);
create index if not exists idx_commands_pending on public.router_commands(status) where status = 'pending';

-- ---- RLS --------------------------------------------------------------------
alter table public.routers         enable row level security;
alter table public.router_health   enable row level security;
alter table public.router_agents   enable row level security;
alter table public.router_commands enable row level security;

-- Routers: full CRUD within company, gated by router permissions.
drop policy if exists routers_select on public.routers;
create policy routers_select on public.routers
  for select using (company_id = public.current_company_id());
drop policy if exists routers_insert on public.routers;
create policy routers_insert on public.routers
  for insert with check (company_id = public.current_company_id() and public.has_permission('router:manage'));
drop policy if exists routers_update on public.routers;
create policy routers_update on public.routers
  for update using (company_id = public.current_company_id() and public.has_permission('router:manage'));
drop policy if exists routers_delete on public.routers;
create policy routers_delete on public.routers
  for delete using (company_id = public.current_company_id() and public.has_permission('router:manage'));

-- Health: readable within company (writes happen via definer functions).
drop policy if exists health_select on public.router_health;
create policy health_select on public.router_health
  for select using (
    exists (select 1 from public.routers r where r.id = router_id and r.company_id = public.current_company_id())
  );

-- Agents: manage within company.
drop policy if exists agents_all on public.router_agents;
create policy agents_all on public.router_agents
  for all using (company_id = public.current_company_id() and public.has_permission('router:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('router:manage'));

-- Commands: readable within company; created by permitted users.
drop policy if exists commands_select on public.router_commands;
create policy commands_select on public.router_commands
  for select using (company_id = public.current_company_id());
drop policy if exists commands_insert on public.router_commands;
create policy commands_insert on public.router_commands
  for insert with check (company_id = public.current_company_id() and public.has_permission('router:view'));
