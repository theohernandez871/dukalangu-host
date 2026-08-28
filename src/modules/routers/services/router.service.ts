import { supabase } from '@/lib/supabase';
import type { Router, RouterHealth, RouterInput, RouterStatus } from '../types';

interface RouterRow {
  id: string;
  name: string;
  host: string;
  api_port: number;
  api_ssl_port: number | null;
  username: string;
  location: string | null;
  status: RouterStatus;
  created_at: string;
}

function mapRouter(r: RouterRow): Router {
  return {
    id: r.id,
    name: r.name,
    host: r.host,
    apiPort: r.api_port,
    apiSslPort: r.api_ssl_port,
    username: r.username,
    location: r.location,
    status: r.status,
    createdAt: r.created_at,
  };
}

export const routerService = {
  async list(): Promise<Router[]> {
    const { data, error } = await supabase
      .from('routers')
      .select('id, name, host, api_port, api_ssl_port, username, location, status, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as RouterRow[]).map(mapRouter);
  },

  async create(input: RouterInput): Promise<string> {
    // Insert the row (without password), then store the password in Vault via RPC.
    const companyId = await currentCompanyId();
    const { data, error } = await supabase
      .from('routers')
      .insert({
        company_id: companyId,
        name: input.name,
        host: input.host.trim(),
        api_port: input.apiPort,
        api_ssl_port: input.apiSslPort ?? null,
        username: input.username.trim(),
        location: input.location ?? null,
      })
      .select('id')
      .single();
    if (error) throw error;
    const routerId = (data as { id: string }).id;
    await this.setPassword(routerId, input.password);
    return routerId;
  },

  async update(id: string, input: Partial<RouterInput>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.host !== undefined) patch.host = input.host.trim();
    if (input.apiPort !== undefined) patch.api_port = input.apiPort;
    if (input.apiSslPort !== undefined) patch.api_ssl_port = input.apiSslPort;
    if (input.username !== undefined) patch.username = input.username.trim();
    if (input.location !== undefined) patch.location = input.location;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('routers').update(patch).eq('id', id);
      if (error) throw error;
    }
    if (input.password) await this.setPassword(id, input.password);
  },

  async setPassword(routerId: string, password: string): Promise<void> {
    // RPC trims + stores in Vault; never round-trips the plaintext to the client.
    const { error } = await supabase.rpc('set_router_password', {
      p_router_id: routerId,
      p_password: password,
    });
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('routers').delete().eq('id', id);
    if (error) throw error;
  },

  async health(routerId: string): Promise<RouterHealth | null> {
    const { data, error } = await supabase
      .from('router_health')
      .select('*')
      .eq('router_id', routerId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const r = data as Record<string, unknown>;
    return {
      routerId,
      rosVersion: (r.ros_version as string) ?? null,
      uptime: (r.uptime as string) ?? null,
      cpuLoad: (r.cpu_load as number) ?? null,
      freeMemory: (r.free_memory as number) ?? null,
      totalMemory: (r.total_memory as number) ?? null,
      activeUsers: (r.active_users as number) ?? null,
      apiOk: (r.api_ok as boolean) ?? null,
      lastSync: (r.last_sync as string) ?? null,
      lastError: (r.last_error as string) ?? null,
    };
  },

  // Queue a real 'identity' command for the agent and poll until it completes.
  // This is a genuine end-to-end test: dashboard -> gateway -> agent -> MikroTik.
  // Requires the agent to be running on the router's LAN.
  async testConnection(routerId: string): Promise<{ ok: boolean; identity?: string; error?: string }> {
    const companyId = await currentCompanyId();
    const { data, error } = await supabase
      .from('router_commands')
      .insert({ company_id: companyId, router_id: routerId, command: 'identity' })
      .select('id')
      .single();
    if (error) throw error;
    const commandId = (data as { id: string }).id;

    // Poll up to ~20s for the agent to pick it up and report back.
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const { data: row } = await supabase
        .from('router_commands')
        .select('status, result, error')
        .eq('id', commandId)
        .maybeSingle();
      const cmd = row as { status: string; result: unknown; error: string | null } | null;
      if (!cmd) continue;
      if (cmd.status === 'done') {
        const name = (cmd.result as { name?: string } | null)?.name;
        return { ok: true, identity: name };
      }
      if (cmd.status === 'failed' || cmd.status === 'timeout') {
        return { ok: false, error: cmd.error ?? 'Imeshindwa' };
      }
    }
    return { ok: false, error: 'Muda umeisha — je Agent inaendesha kwenye LAN?' };
  },
};

async function currentCompanyId(): Promise<string> {
  const { data, error } = await supabase.rpc('current_company_id');
  if (error) throw error;
  return data as string;
}
