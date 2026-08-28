# Hotspot Billing System (New Build)

Professional hotspot billing platform. Fresh architecture, modern stack.

## Stack
- Frontend: React 18 + Vite + TypeScript + Tailwind (modular by feature)
- Backend: Supabase (PostgreSQL + RLS + Edge Functions)
- MikroTik: dedicated agent (LAN bridge, RouterOS 7.x)

## Structure
- `frontend/` — React app (modules: dashboard, routers, hotspot, vouchers, ...)
- `supabase/migrations/` — database schema (multi-tenant, RLS, RBAC)
- `mikrotik-agent/` — MikroTik integration layer (Phase 3)

## Phase 1 (done)
- Project architecture + design system (brand: indigo/violet)
- Database foundation: companies, profiles, roles, permissions, audit + RLS
- RBAC seed (6 roles, server-enforced permissions)
- App shell: grouped collapsible sidebar, mobile drawer, topbar
- Dashboard layout with summary cards

## Verify
```
cd frontend
npm install
npm run typecheck   # 0 errors
npm run build       # clean
```

Database: run supabase/migrations/*.sql in order.

## Phase 2 (done)
- Authentication: login + register (email/password, Supabase Auth)
- bootstrap_company RPC: new signup creates company + admin profile
- AuthProvider: session, profile, permissions loaded + cached
- RequireAuth guard on all app routes
- Permission-filtered sidebar (server-side RLS still enforces)
- Topbar: user avatar + sign out

## Phase 3 (in progress)
- Database: routers, router_health, router_agents, router_commands (RLS)
- Secure credentials: set_router_password() stores in Vault + TRIMS password
  (fixes the classic "works in Winbox, fails on API" whitespace bug)
- MikroTik layer: connection, commands, standalone auth probe (test:auth)
- Routers UI: list with status, add/edit/delete, secure password handling

## Phase 4 (done)
- Agent config: encrypted, anchored to install dir (NOT cwd), machine-bound key
  WITHOUT username — fixes both old service-startup bugs at the source
- URL normalizer baked in (trailing slash / pasted path / http -> https)
- agent-gateway Edge Function: single endpoint, actions poll/heartbeat/sync/ack
- Agent RPCs: agent_routers (Vault password), claim_pending_commands
  (atomic claim -> never double-dispatched)
- GatewayClient + Orchestrator: poll -> execute -> sync -> heartbeat, resilient
- MikroTik command dispatch: identity, resource, interfaces, hotspot_active

## Phase 5 (done)
- DB: hotspot_packages, voucher_batches, vouchers (RLS + lifecycle statuses)
- generate_vouchers RPC: atomic bulk generation, unique codes (no 0/O/1/I/L)
- Packages: grid + create/edit/duplicate/enable/disable/delete
- Voucher History: status-filtered table, generate (single/bulk), cancel
- Voucher Printing: small/thermal/A4 templates + print preview
- Active Users: live table (polls every 15s), reads agent-synced sessions

## Phase 6 (done)
- DB: customers, pppoe_packages, pppoe_customers, active_sessions (RLS)
- Customers: search, table, create/edit/delete, status badges
- PPPoE Plans: grid + add/delete
- PPPoE Customers: table + add + suspend/activate/delete
- active_sessions table now backs the Active Users page (Phase 5)

## Phase 7 (done)
- DB: payments (idempotent via unique reference), withdrawals, revenue_summary()
- Webhook idempotency: unique(company_id, reference) — no double-credit
- Sales page: revenue cards (today/month/total/remaining) + transactions table
- Record payment: cash/M-Pesa/Airtel/Yas/HaloPesa/card
- Withdrawals: record + log; dashboard now shows real revenue

## Phase 8 (done)
- DB: sms_templates, sms_messages, sms_balance, agents, agent_commissions, announcements (RLS)
- Announcements: create (audience: all/hotspot/pppoe/agents) + list + delete
- Buy SMS: balance card, bundle options, SMS history
- Agents: table + add/edit, commission %, activate/deactivate, delete

## Phase 9 (done)
- DB: subscription_plans (seeded), subscriptions, system_settings (RLS) + report_summary()
- Reports: date presets (today/week/month), summary cards, CSV export
- Subscription: plans grid + current subscription status
- Settings: business profile (name/phone/email/address/currency) editing

## Agent registration (connector)
- register_agent RPC: generates token, stores only sha256 hash, returns token once
- list_agents RPC: agent list (no tokens) with last_seen
- Agent Connector page: register + one-time token display + online/offline status
- Agent reads .env (dotenv added) for SUPABASE_URL, SUPABASE_ANON_KEY, AGENT_TOKEN
