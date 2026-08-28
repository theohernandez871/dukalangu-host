import { RouterOSAPI } from 'node-routeros';

export interface MikrotikCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
  timeout?: number; // seconds
}

/** Distinct failure kinds so callers (and the UI) can show an accurate reason
 *  instead of a raw library exception. This directly addresses the old system's
 *  "Username or password is invalid" ambiguity. */
export type MikrotikErrorKind =
  | 'AUTH'          // wrong username/password, or user lacks the 'api' policy
  | 'UNREACHABLE'   // host/port not reachable on the LAN
  | 'TIMEOUT'       // connected but no response in time
  | 'API_DISABLED'  // API service off / refused
  | 'UNKNOWN';

export class MikrotikError extends Error {
  constructor(public kind: MikrotikErrorKind, message: string) {
    super(message);
    this.name = 'MikrotikError';
  }
}

function classify(raw: string): MikrotikErrorKind {
  if (/invalid user|invalid password|cannot log|not allowed|CANTLOGIN/i.test(raw)) return 'AUTH';
  if (/ECONNREFUSED/i.test(raw)) return 'API_DISABLED';
  if (/ETIMEDOUT|timed out|timeout/i.test(raw)) return 'TIMEOUT';
  if (/EHOSTUNREACH|ENETUNREACH|ENOTFOUND|EAI_AGAIN/i.test(raw)) return 'UNREACHABLE';
  return 'UNKNOWN';
}

function humanMessage(kind: MikrotikErrorKind, creds: MikrotikCredentials): string {
  switch (kind) {
    case 'AUTH':
      return `Login imekataliwa (user="${creds.user}"). Angalia: (a) username/nywila sahihi, ` +
        `(b) user ana ruhusa ya "api" kwenye RouterOS (System -> Users -> Groups), ` +
        `(c) hakuna nafasi kwenye nywila.`;
    case 'UNREACHABLE':
      return `MikroTik haifikiki (${creds.host}:${creds.port}). Angalia kifaa kiko LAN moja na router.`;
    case 'API_DISABLED':
      return `Muunganisho umekataliwa. Huduma ya API imezimwa? Washa: /ip service enable api`;
    case 'TIMEOUT':
      return `MikroTik imechelewa kujibu (${creds.host}:${creds.port}). Angalia mtandao.`;
    default:
      return `Hitilafu ya MikroTik (${creds.host}:${creds.port}).`;
  }
}

/**
 * A single MikroTik API connection. Thin wrapper over node-routeros that
 * normalises errors and guarantees the socket is closed on failure.
 */
export class MikrotikConnection {
  private api: RouterOSAPI | null = null;

  constructor(private readonly creds: MikrotikCredentials) {}

  async connect(): Promise<void> {
    const api = new RouterOSAPI({
      host: this.creds.host,
      port: this.creds.port,
      user: this.creds.user,
      password: this.creds.password,
      timeout: this.creds.timeout ?? 8,
      keepalive: true,
    });
    try {
      await api.connect();
      this.api = api;
    } catch (e) {
      const raw = String((e as Error)?.message ?? e);
      const kind = classify(raw);
      try { await api.close(); } catch { /* ignore */ }
      throw new MikrotikError(kind, humanMessage(kind, this.creds));
    }
  }

  /** Run a command path with optional params. Throws MikrotikError on failure. */
  async run(path: string, params: string[] = []): Promise<Record<string, string>[]> {
    if (!this.api) throw new MikrotikError('UNKNOWN', 'Haijaunganishwa');
    try {
      return (await this.api.write(path, params)) as Record<string, string>[];
    } catch (e) {
      const raw = String((e as Error)?.message ?? e);
      throw new MikrotikError(classify(raw), raw);
    }
  }

  async close(): Promise<void> {
    try { await this.api?.close(); } catch { /* ignore */ }
    this.api = null;
  }
}
