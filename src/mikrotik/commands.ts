import { MikrotikConnection } from './connection.js';

/** High-level MikroTik read commands. Kept separate from connection so business
 *  logic never touches the raw API. */
export const mikrotikCommands = {
  async identity(conn: MikrotikConnection): Promise<string> {
    const r = await conn.run('/system/identity/print');
    return r[0]?.name ?? '';
  },

  async resource(conn: MikrotikConnection) {
    const r = await conn.run('/system/resource/print');
    const x = r[0] ?? {};
    return {
      version: x.version ?? '',
      uptime: x.uptime ?? '',
      cpuLoad: Number(x['cpu-load'] ?? 0),
      freeMemory: Number(x['free-memory'] ?? 0),
      totalMemory: Number(x['total-memory'] ?? 0),
      boardName: x['board-name'] ?? '',
    };
  },

  async interfaces(conn: MikrotikConnection) {
    const r = await conn.run('/interface/print');
    return r.map((i) => ({ name: i.name, type: i.type, running: i.running === 'true' }));
  },

  async hotspotActive(conn: MikrotikConnection) {
    const r = await conn.run('/ip/hotspot/active/print');
    return r.map((u) => ({
      user: u.user,
      address: u.address,
      macAddress: u['mac-address'],
      uptime: u.uptime,
      bytesIn: Number(u['bytes-in'] ?? 0),
      bytesOut: Number(u['bytes-out'] ?? 0),
    }));
  },
};
