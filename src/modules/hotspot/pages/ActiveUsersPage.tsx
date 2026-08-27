import { Wifi } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface ActiveUser {
  id: string;
  username: string;
  routerName: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  uptime: string | null;
  bytesIn: number;
  bytesOut: number;
}

interface Row {
  id: string;
  username: string;
  ip_address: string | null;
  mac_address: string | null;
  uptime: string | null;
  bytes_in: number | null;
  bytes_out: number | null;
  routers: { name: string } | null;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Reads the active_sessions snapshot the agent syncs. Polls every 15s so the
// list stays fresh without hammering the database.
async function fetchActive(): Promise<ActiveUser[]> {
  const { data, error } = await supabase
    .from('active_sessions')
    .select('id, username, ip_address, mac_address, uptime, bytes_in, bytes_out, routers(name)')
    .order('username');
  if (error) {
    // Table arrives with the sessions phase; until then, show an empty list.
    return [];
  }
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    username: r.username,
    routerName: r.routers?.name ?? null,
    ipAddress: r.ip_address,
    macAddress: r.mac_address,
    uptime: r.uptime,
    bytesIn: Number(r.bytes_in ?? 0),
    bytesOut: Number(r.bytes_out ?? 0),
  }));
}

export function ActiveUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['active-users'],
    queryFn: fetchActive,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Active Users</h1>
        <p className="text-sm text-slate-500">Watumiaji walio online sasa</p>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Inapakia...</div>
        ) : !users || users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Wifi className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">Hakuna watumiaji online sasa.</p>
            <p className="text-xs text-slate-400">Orodha itajaa mara Agent itakapounganisha MikroTik.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mtumiaji</th>
                  <th className="px-4 py-3">Router</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Muda</th>
                  <th className="px-4 py-3">Down / Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.username}</td>
                    <td className="px-4 py-3 text-slate-600">{u.routerName ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{u.ipAddress ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{u.uptime ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtBytes(u.bytesIn)} / {fmtBytes(u.bytesOut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
