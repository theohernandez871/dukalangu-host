import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostname } from 'node:os';

// -----------------------------------------------------------------------------
// Config storage — deliberately avoids the two bugs that broke the old build:
//   1. Path anchored to the INSTALL directory (dist/../), never process.cwd().
//      A Windows Service runs with cwd = C:\Windows\System32, so a cwd-relative
//      path would write/read the wrong place and the service would fail to start.
//   2. Encryption key bound to hostname + an optional secret — NOT the OS
//      username. The old build keyed on username, so config written by the
//      interactive user (THEO) could not be decrypted by the service (SYSTEM).
// -----------------------------------------------------------------------------

const MODULE_DIR = dirname(fileURLToPath(import.meta.url)); // dist/config
const APP_ROOT = join(MODULE_DIR, '..', '..'); // agent root
const DATA_DIR = process.env.AGENT_DATA_DIR ?? join(APP_ROOT, '.agent-data');
const CONFIG_FILE = join(DATA_DIR, 'config.enc');
const ALGO = 'aes-256-gcm';

export interface AgentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  agentToken: string;
  configured: boolean;
}

function key(): Buffer {
  const material = `hotspot-agent::${hostname()}::${process.env.AGENT_SECRET ?? 'default'}`;
  return scryptSync(material, 'hotspot-agent-salt', 32);
}

/** Clean a Supabase URL: trim, drop trailing slashes, strip any pasted path. */
export function normalizeUrl(raw: string): string {
  let u = (raw ?? '').trim().replace(/^["']|["']$/g, '');
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  u = u.replace(/^http:\/\//i, 'https://').replace(/\/functions\/v1.*$/i, '');
  try {
    const parsed = new URL(u);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return u.replace(/\/+$/, '');
  }
}

// Read an env var by its canonical (backend) name, but also accept the VITE_
// prefixed name as a fallback. VITE_ vars belong to the frontend, not a Node
// agent — but people often copy a frontend .env by mistake, so we tolerate both
// to avoid a confusing "not configured" error. The canonical name wins.
function readEnv(name: string): string | undefined {
  return process.env[name] ?? process.env[`VITE_${name}`];
}

export function loadConfig(): AgentConfig {
  const empty: AgentConfig = { supabaseUrl: '', supabaseAnonKey: '', agentToken: '', configured: false };
  if (!existsSync(CONFIG_FILE)) {
    // Fall back to env (dev / first run) if present.
    const url = readEnv('SUPABASE_URL');
    const token = readEnv('AGENT_TOKEN');
    if (url && token) {
      return {
        supabaseUrl: normalizeUrl(url),
        supabaseAnonKey: readEnv('SUPABASE_ANON_KEY') ?? '',
        agentToken: token,
        configured: true,
      };
    }
    return empty;
  }
  try {
    const buf = readFileSync(CONFIG_FILE);
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv(ALGO, key(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    const cfg = JSON.parse(json) as AgentConfig;
    return { ...cfg, supabaseUrl: normalizeUrl(cfg.supabaseUrl) };
  } catch {
    return empty;
  }
}

export function saveConfig(cfg: AgentConfig): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const clean: AgentConfig = { ...cfg, supabaseUrl: normalizeUrl(cfg.supabaseUrl), configured: true };
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(clean), 'utf8'), cipher.final()]);
  writeFileSync(CONFIG_FILE, Buffer.concat([iv, cipher.getAuthTag(), enc]));
}

export function isConfigured(): boolean {
  const c = loadConfig();
  return Boolean(c.configured && c.supabaseUrl && c.agentToken);
}
