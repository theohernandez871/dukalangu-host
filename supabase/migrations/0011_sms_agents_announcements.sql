-- =============================================================================
-- SMS + Agents + Announcements (Phase 8).
-- =============================================================================

-- ---- SMS templates ----------------------------------------------------------
create table if not exists public.sms_templates (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  name           text not null,
  category       text not null default 'other'
                   check (category in ('welcome','voucher','payment','expiry','renewal','announcement','other')),
  body           text not null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_sms_templates_company on public.sms_templates(company_id);

-- ---- SMS messages (history) -------------------------------------------------
create table if not exists public.sms_messages (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  recipient      text not null,
  body           text not null,
  status         text not null default 'queued'
                   check (status in ('queued','sent','delivered','failed')),
  segments       integer not null default 1,
  error          text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_sms_messages_company_time on public.sms_messages(company_id, created_at desc);

-- ---- SMS balance (per company) ----------------------------------------------
create table if not exists public.sms_balance (
  company_id     uuid primary key references public.companies(id) on delete cascade,
  balance        integer not null default 0,
  updated_at     timestamptz not null default now()
);

-- ---- Agents -----------------------------------------------------------------
create table if not exists public.agents (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  full_name      text not null,
  phone          text,
  commission_pct numeric(5,2) not null default 0,   -- percentage per sale
  balance        numeric(12,2) not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists idx_agents_company on public.agents(company_id);

-- ---- Agent commissions (log) ------------------------------------------------
create table if not exists public.agent_commissions (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  agent_id       uuid not null references public.agents(id) on delete cascade,
  amount         numeric(12,2) not null,
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_agent_comm_company on public.agent_commissions(company_id, created_at desc);

-- ---- Announcements ----------------------------------------------------------
create table if not exists public.announcements (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  title          text not null,
  body           text not null,
  audience       text not null default 'all'
                   check (audience in ('all','hotspot','pppoe','agents')),
  sent_at        timestamptz,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_announcements_company on public.announcements(company_id, created_at desc);

-- ---- RLS --------------------------------------------------------------------
alter table public.sms_templates     enable row level security;
alter table public.sms_messages      enable row level security;
alter table public.sms_balance       enable row level security;
alter table public.agents            enable row level security;
alter table public.agent_commissions enable row level security;
alter table public.announcements     enable row level security;

drop policy if exists smstpl_select on public.sms_templates;
create policy smstpl_select on public.sms_templates
  for select using (company_id = public.current_company_id() and public.has_permission('sms:view'));
drop policy if exists smstpl_write on public.sms_templates;
create policy smstpl_write on public.sms_templates
  for all using (company_id = public.current_company_id() and public.has_permission('sms:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('sms:manage'));

drop policy if exists smsmsg_select on public.sms_messages;
create policy smsmsg_select on public.sms_messages
  for select using (company_id = public.current_company_id() and public.has_permission('sms:view'));
drop policy if exists smsmsg_write on public.sms_messages;
create policy smsmsg_write on public.sms_messages
  for all using (company_id = public.current_company_id() and public.has_permission('sms:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('sms:manage'));

drop policy if exists smsbal_select on public.sms_balance;
create policy smsbal_select on public.sms_balance
  for select using (company_id = public.current_company_id());

drop policy if exists agents_select on public.agents;
create policy agents_select on public.agents
  for select using (company_id = public.current_company_id() and public.has_permission('agent:view'));
drop policy if exists agents_write on public.agents;
create policy agents_write on public.agents
  for all using (company_id = public.current_company_id() and public.has_permission('agent:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('agent:manage'));

drop policy if exists agentcomm_select on public.agent_commissions;
create policy agentcomm_select on public.agent_commissions
  for select using (company_id = public.current_company_id() and public.has_permission('agent:view'));
drop policy if exists agentcomm_write on public.agent_commissions;
create policy agentcomm_write on public.agent_commissions
  for all using (company_id = public.current_company_id() and public.has_permission('agent:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('agent:manage'));

drop policy if exists ann_select on public.announcements;
create policy ann_select on public.announcements
  for select using (company_id = public.current_company_id() and public.has_permission('sms:view'));
drop policy if exists ann_write on public.announcements;
create policy ann_write on public.announcements
  for all using (company_id = public.current_company_id() and public.has_permission('sms:manage'))
  with check (company_id = public.current_company_id() and public.has_permission('sms:manage'));
