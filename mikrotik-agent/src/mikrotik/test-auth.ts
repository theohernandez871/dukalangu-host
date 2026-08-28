// Standalone MikroTik auth probe. Run this ON the machine that has LAN access
// to the router to prove credentials work BEFORE building anything on top.
//
//   ROUTER_HOST=192.168.88.1 ROUTER_USER=admin ROUTER_PASSWORD=... npm run test:auth
//
// Prints the real result or a classified error. Never prints the full password.

import { MikrotikConnection, MikrotikError } from './connection.js';
import { mikrotikCommands } from './commands.js';

function shape(pw: string): string {
  const lead = /^\s/.test(pw) ? 'NAFASI-MWANZO ' : '';
  const trail = /\s$/.test(pw) ? 'NAFASI-MWISHO ' : '';
  const quotes = /^["']|["']$/.test(pw) ? 'QUOTES ' : '';
  return `urefu=${pw.length} ${lead}${trail}${quotes}`.trim();
}

const host = process.env.ROUTER_HOST ?? '192.168.88.1';
const port = Number(process.env.ROUTER_PORT ?? 8728);
const user = process.env.ROUTER_USER ?? 'admin';
const password = process.env.ROUTER_PASSWORD ?? '';

console.log('=== MIKROTIK AUTH PROBE ===');
console.log(`Host: ${host}:${port}`);
console.log(`User: ${user}`);
console.log(`Password: ${password ? shape(password) : '(tupu — weka ROUTER_PASSWORD)'}`);
console.log('---------------------------');

const conn = new MikrotikConnection({ host, port, user, password, timeout: 8 });

try {
  await conn.connect();
  console.log('\x1b[32m✓ LOGIN IMEFANIKIWA\x1b[0m');
  const id = await mikrotikCommands.identity(conn);
  const res = await mikrotikCommands.resource(conn);
  console.log(`  identity : ${id}`);
  console.log(`  RouterOS : ${res.version} | uptime ${res.uptime} | CPU ${res.cpuLoad}%`);
  const active = await mikrotikCommands.hotspotActive(conn).catch(() => []);
  console.log(`  hotspot active users: ${active.length}`);
  await conn.close();
  console.log('\n\x1b[32mHITIMISHO: MikroTik iko tayari.\x1b[0m');
} catch (e) {
  if (e instanceof MikrotikError) {
    console.log(`\x1b[31m✗ IMESHINDWA [${e.kind}]\x1b[0m`);
    console.log(`  ${e.message}`);
  } else {
    console.log('\x1b[31m✗ IMESHINDWA\x1b[0m', String(e));
  }
  process.exitCode = 1;
}
