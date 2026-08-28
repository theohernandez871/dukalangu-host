import { GatewayClient, type PollRouter, type PollCommand } from './gateway-client.js';
import { MikrotikConnection, MikrotikError } from '../mikrotik/connection.js';
import { mikrotikCommands } from '../mikrotik/commands.js';
import type { AgentConfig } from '../config/config.js';

const POLL_MS = 3000;
const HEARTBEAT_MS = 30_000;
const SYNC_MS = 60_000;

const log = (msg: string) => console.log(`${new Date().toISOString()} ${msg}`);

/**
 * Runs the agent: polls the gateway for routers + commands, executes commands
 * against MikroTik, and periodically syncs health. Resilient — a failed cycle
 * is logged and retried; the process never exits on a transient error.
 */
export class Orchestrator {
  private client: GatewayClient;
  private running = false;
  private lastHeartbeat = 0;
  private lastSync = 0;

  constructor(cfg: AgentConfig) {
    this.client = new GatewayClient(cfg);
  }

  async start(): Promise<void> {
    this.running = true;
    log('[agent] Inaanza — inaunganisha gateway...');
    while (this.running) {
      try {
        await this.cycle();
      } catch (e) {
        log(`[agent] Mzunguko umeshindwa: ${String((e as Error).message ?? e)}`);
      }
      await sleep(POLL_MS);
    }
  }

  stop(): void {
    this.running = false;
  }

  private async cycle(): Promise<void> {
    const { routers, commands } = await this.client.poll();

    // Execute any claimed commands.
    for (const cmd of commands) {
      const router = routers.find((r) => r.id === cmd.router_id);
      if (router) await this.execute(router, cmd);
    }

    const now = Date.now();
    // Health sync + heartbeat on their own cadences.
    if (now - this.lastSync >= SYNC_MS) {
      for (const r of routers) await this.syncHealth(r);
      this.lastSync = now;
    }
    if (now - this.lastHeartbeat >= HEARTBEAT_MS) {
      for (const r of routers) await this.client.heartbeat(r.id).catch(() => undefined);
      this.lastHeartbeat = now;
    }
  }

  private async execute(router: PollRouter, cmd: PollCommand): Promise<void> {
    const conn = new MikrotikConnection({
      host: router.host, port: router.api_port, user: router.username, password: router.password, timeout: 8,
    });
    try {
      await conn.connect();
      const result = await this.dispatch(conn, cmd);
      await this.client.ack(cmd.id, true, result, null);
      log(`[cmd] ${cmd.command} ✓`);
    } catch (e) {
      const msg = e instanceof MikrotikError ? `${e.kind}: ${e.message}` : String(e);
      await this.client.ack(cmd.id, false, null, msg).catch(() => undefined);
      log(`[cmd] ${cmd.command} ✗ ${msg}`);
    } finally {
      await conn.close();
    }
  }

  private async dispatch(conn: MikrotikConnection, cmd: PollCommand): Promise<unknown> {
    switch (cmd.command) {
      case 'identity': return { name: await mikrotikCommands.identity(conn) };
      case 'resource': return await mikrotikCommands.resource(conn);
      case 'interfaces': return await mikrotikCommands.interfaces(conn);
      case 'hotspot_active': return await mikrotikCommands.hotspotActive(conn);
      case 'run_raw': {
        const path = (cmd.params.path as string) ?? '';
        const params = (cmd.params.params as string[]) ?? [];
        return await conn.run(path, params);
      }
      default:
        throw new Error(`command haijulikani: ${cmd.command}`);
    }
  }

  private async syncHealth(router: PollRouter): Promise<void> {
    const conn = new MikrotikConnection({
      host: router.host, port: router.api_port, user: router.username, password: router.password, timeout: 8,
    });
    try {
      await conn.connect();
      const res = await mikrotikCommands.resource(conn);
      const active = await mikrotikCommands.hotspotActive(conn).catch(() => []);
      await this.client.sync(router.id, { ...res, activeUsers: active.length });
    } catch (e) {
      const msg = e instanceof MikrotikError ? e.message : String(e);
      log(`[sync] ${router.host}: ${msg}`);
    } finally {
      await conn.close();
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
