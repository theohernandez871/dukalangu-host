import { config as loadEnv } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Load .env from the agent install dir (not cwd) so it works under a service too.
loadEnv({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

import { loadConfig, isConfigured } from './config/config.js';
import { Orchestrator } from './core/orchestrator.js';

async function main(): Promise<void> {
  if (!isConfigured()) {
    const has = (n: string) => Boolean(process.env[n] ?? process.env[`VITE_${n}`]);
    console.error(
      '\n[agent] Agent haijasanidiwa. Faili .env inahitaji majina HAYA (bila VITE_):\n' +
        `  SUPABASE_URL       ${has('SUPABASE_URL') ? '✓' : '✗ haipo'}\n` +
        `  SUPABASE_ANON_KEY  ${has('SUPABASE_ANON_KEY') ? '✓' : '✗ haipo'}\n` +
        `  AGENT_TOKEN        ${has('AGENT_TOKEN') ? '✓' : '✗ haipo'}\n` +
        '\nKumbuka: VITE_ ni kwa frontend tu. Agent hutumia majina bila VITE_.\n' +
        '(Ukiweka VITE_SUPABASE_URL, agent itaikubali pia — lakini sahihi ni bila VITE_.)\n',
    );
    process.exit(1);
  }
  const cfg = loadConfig();
  const orch = new Orchestrator(cfg);

  const shutdown = () => {
    console.log('[agent] Inasimama...');
    orch.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await orch.start();
}

main().catch((e) => {
  console.error('[agent] Hitilafu kubwa:', String(e));
  process.exit(1);
});
