# MWONGOZO — Jinsi Mfumo wa Hotspot Billing Unavyofanya Kazi

## 1. Architecture (mpangilio wa mfumo)

```
Internet
   │
   ▼
Vercel (Dashboard - frontend)         ← wewe + wafanyakazi mnafungua hapa
   │
   ▼
Supabase (Backend + Database)         ← data + agent-gateway (Edge Function)
   │  ▲
   │  │ (Agent inapoll kila sekunde 3)
   ▼  │
Agent (mikrotik-agent)                ← INAENDESHA kwenye kompyuta ya LAN yako
   │
   ▼
MikroTik 192.168.88.1:8728            ← router yako
```

**Kwa nini Agent?** Vercel (internet) HAIWEZI kufikia 192.168.88.1 (LAN yako binafsi).
Agent ndiyo daraja: inakaa ndani ya LAN yako, inapoll Supabase kwa amri, inazitekeleza
kwa MikroTik, na kurudisha majibu. Hii ndiyo architecture sahihi ya production.

## 2. Sehemu tatu za mfumo

| Sehemu | Inaendesha wapi | Kazi |
|--------|-----------------|------|
| **frontend/** | Vercel (internet) | Dashboard unayoiona |
| **supabase/** | Supabase (cloud) | Database + agent-gateway + Vault |
| **mikrotik-agent/** | Kompyuta yako ya LAN | Daraja kati ya Supabase na MikroTik |

## 3. Jinsi "Test Connection" inavyofanya kazi (halisi, si demo)

1. Unabonyeza **Test Connection** kwenye router card
2. Dashboard inaweka amri `identity` kwenye `router_commands` (Supabase)
3. Agent (kwenye LAN) inapoll, inaona amri, inaunganisha MikroTik
4. Agent inasoma identity ya router, inarudisha jibu Supabase
5. Dashboard inaonyesha: **✓ Imeunganishwa — [jina la router]**

Kama Agent haiendeshi → **✗ Muda umeisha — je Agent inaendesha kwenye LAN?**

## 4. Jinsi ya kuendesha (hatua kwa hatua)

### A. Database (mara moja)
1. Supabase → SQL Editor → New query
2. Nakili `all_migrations.sql` yote → Run
3. Hakikisha "Success"

### B. Frontend (Vercel)
Environment variables (Vercel → Settings → Environment Variables):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```
> USIWEKE service_role key wala MikroTik password hapa. VITE_* zinaonekana browser.

### C. agent-gateway (Edge Function) — mara moja
```
supabase functions deploy agent-gateway
```
Secrets (Supabase → Edge Functions → Secrets):
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>   ← hapa ni salama (server-side)
```

### D. Agent (kwenye kompyuta ya LAN yako)
```
cd mikrotik-agent
npm install
npm run build
# Weka config (.env au setup):
#   SUPABASE_URL=https://<project>.supabase.co
#   SUPABASE_ANON_KEY=<anon key>
#   AGENT_TOKEN=<token kutoka dashboard>
npm start
```
Agent itaanza kupoll. Acha iendeshe (au sakinisha kama Windows Service).

## 5. Jinsi ya kuunganisha MikroTik

1. Dashboard → **My Routers** → Ongeza router
   - Jina: HQ
   - IP: 192.168.88.1
   - Port: 8728
   - Username: admin
   - Password: [nywila ya RouterOS]
2. Hifadhi (password inaenda Vault — encrypted)
3. Bonyeza **Test Connection** → subiri
4. Ikiwa Agent inaendesha + credentials sahihi → **✓ Imeunganishwa**

## 6. Usalama (security)

| Kitu | Mahali | Salama? |
|------|--------|---------|
| MikroTik password | Supabase Vault (encrypted) | ✅ si frontend |
| Supabase anon key | VITE_ (frontend) | ✅ ni public kwa design |
| service_role key | Edge Function secrets tu | ✅ si frontend |
| Agent token | Agent config (encrypted) | ✅ hashed database |
| RLS | Tables zote | ✅ kila kampuni inaona yake |

## 7. Vercel deployment settings

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Framework Preset:** Vite

> Agent HAIENDESHI Vercel — inaendesha kwenye LAN yako (ndiyo kusudi lake).

## 8. Kizuizi kimoja (limitation)

Agent LAZIMA iendeshe kwenye kompyuta iliyo kwenye LAN moja na MikroTik.
Kompyuta hiyo lazima iwe na internet (kuwasiliana Supabase) NA ifikie 192.168.88.1.
Hii ndiyo njia pekee salama ya kufikia router iliyo kwenye private LAN.
