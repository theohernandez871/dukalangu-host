import { config as loadEnv } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Load .env from the agent install dir (not cwd) so it works under a service too.
loadEnv({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

import { loadConfig, isConfigured } from './config/config.js';
import { Orchestrator } from './core/orchestrator.js';

async function main(): Promise<void> {
  if (!isConfigured()) {
    console.error(
      '\n[agent] Agent haijasanidiwa. Weka SUPABASE_URL, SUPABASE_ANON_KEY, AGENT_TOKEN ' +
        '(kupitia setup au .env), kisha anzisha tena.\n',
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
