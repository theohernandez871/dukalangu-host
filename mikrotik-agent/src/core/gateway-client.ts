import type { AgentConfig } from '../config/config.js';

export interface PollRouter {
  id: string;
  host: string;
  api_port: number;
  username: string;
  password: string;
}

export interface PollCommand {
  id: string;
  router_id: string;
  command: string;
  params: Record<string, unknown>;
}

export interface PollResult {
  status: string;
  routers: PollRouter[];
  commands: PollCommand[];
}

/** Thin client for the agent-gateway Edge Function. All actions go through the
 *  single /functions/v1/agent-gateway endpoint (learned: one endpoint, no 404s).
 *  The base URL is already normalized by loadConfig(). */
export class GatewayClient {
  constructor(private readonly cfg: AgentConfig) {}

  private url(): string {
    return `${this.cfg.supabaseUrl}/functions/v1/agent-gateway`;
  }

  private async call<T>(body: Record<string, unknown>): Promise<T> {
    const res = await fetch(this.url(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agent-token': this.cfg.agentToken,
        apikey: this.cfg.supabaseAnonKey,
        Authorization: `Bearer ${this.cfg.supabaseAnonKey}`,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) throw new Error('Token si sahihi (401)');
    if (res.status === 404) {
      throw new Error('agent-gateway haipatikani (404). Angalia System URL au deploy gateway.');
    }
    if (!res.ok) throw new Error(`Gateway HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  poll(): Promise<PollResult> {
    return this.call<PollResult>({ action: 'poll' });
  }

  heartbeat(routerId: string): Promise<{ ok: boolean }> {
    return this.call({ action: 'heartbeat', routerId });
  }

  sync(routerId: string, health: Record<string, unknown>): Promise<{ ok: boolean }> {
    return this.call({ action: 'sync', routerId, health });
  }

  ack(commandId: string, ok: boolean, result: unknown, error: string | null): Promise<{ ok: boolean }> {
    return this.call({ action: 'ack', commandId, ok, result, error });
  }
}
