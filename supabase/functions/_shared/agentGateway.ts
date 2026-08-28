// =============================================================================
// Agent gateway — the SINGLE endpoint the agent talks to. Actions are routed by
// a JSON "action" field. Learned from the old build: one gateway avoids the
// "which endpoint?" confusion and 404s. Never returns 404 for a valid action.
//
// Auth: agent sends x-agent-token; we hash it and match router_agents.token_hash.
// =============================================================================
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export interface GatewayResult {
  status: number;
  body: unknown;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Resolve the agent by its token hash. Returns null if invalid. */
async function authenticate(admin: SupabaseClient, token: string) {
  if (!token) return null;
  const hash = await sha256Hex(token);
  const { data } = await admin
    .from('router_agents')
    .select('id, company_id, router_id')
    .eq('token_hash', hash)
    .maybeSingle();
  return data ?? null;
}

export async function handleGateway(req: Request): Promise<GatewayResult> {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const token = req.headers.get('x-agent-token') ?? '';
  const agent = await authenticate(admin, token);
  if (!agent) return { status: 401, body: { error: 'Token si sahihi' } };

  let payload: { action?: string; [k: string]: unknown };
  try {
    payload = await req.json();
  } catch {
    return { status: 400, body: { error: 'JSON si sahihi' } };
  }

  const now = new Date().toISOString();
  // Touch last_seen on every authenticated call (heartbeat-of-record).
  await admin.from('router_agents').update({ last_seen: now }).eq('id', agent.id);

  switch (payload.action) {
    case 'poll':
      return handlePoll(admin, agent);
    case 'heartbeat':
      return handleHeartbeat(admin, agent, payload);
    case 'sync':
      return handleSync(admin, agent, payload);
    case 'ack':
      return handleAck(admin, agent, payload);
    default:
      return { status: 400, body: { error: `action haijulikani: ${payload.action}` } };
  }
}

// Return the routers this agent manages + any pending commands (marked running).
async function handlePoll(admin: SupabaseClient, agent: { id: string; company_id: string }): Promise<GatewayResult> {
  const { data: routers } = await admin.rpc('agent_routers', { p_company: agent.company_id });
  const { data: commands } = await admin.rpc('claim_pending_commands', { p_company: agent.company_id });
  return { status: 200, body: { status: 'online', routers: routers ?? [], commands: commands ?? [] } };
}

async function handleHeartbeat(
  admin: SupabaseClient,
  agent: { company_id: string },
  payload: Record<string, unknown>,
): Promise<GatewayResult> {
  const routerId = payload.routerId as string | undefined;
  if (routerId) {
    await admin.from('routers').update({ status: 'online' }).eq('id', routerId).eq('company_id', agent.company_id);
  }
  return { status: 200, body: { ok: true } };
}

async function handleSync(
  admin: SupabaseClient,
  agent: { company_id: string },
  payload: Record<string, unknown>,
): Promise<GatewayResult> {
  const routerId = payload.routerId as string | undefined;
  const health = payload.health as Record<string, unknown> | undefined;
  if (routerId && health) {
    await admin.from('router_health').upsert({
      router_id: routerId,
      ros_version: health.version ?? null,
      uptime: health.uptime ?? null,
      cpu_load: health.cpuLoad ?? null,
      free_memory: health.freeMemory ?? null,
      total_memory: health.totalMemory ?? null,
      active_users: health.activeUsers ?? null,
      api_ok: true,
      last_sync: new Date().toISOString(),
    });
  }
  return { status: 200, body: { ok: true } };
}

async function handleAck(
  admin: SupabaseClient,
  agent: { company_id: string },
  payload: Record<string, unknown>,
): Promise<GatewayResult> {
  const commandId = payload.commandId as string | undefined;
  const ok = payload.ok as boolean;
  const result = payload.result ?? null;
  const error = (payload.error as string) ?? null;
  if (commandId) {
    await admin
      .from('router_commands')
      .update({
        status: ok ? 'done' : 'failed',
        result,
        error,
        executed_at: new Date().toISOString(),
      })
      .eq('id', commandId)
      .eq('company_id', agent.company_id);
  }
  return { status: 200, body: { ok: true } };
}
