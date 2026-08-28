import { useState } from 'react';
import { Plus, Router as RouterIcon, Pencil, Trash2, Wifi, WifiOff, Zap, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RouterFormDialog } from '../components/RouterFormDialog';
import { useRouters, useRouterMutations } from '../hooks/useRouters';
import { routerService } from '../services/router.service';
import type { Router, RouterStatus } from '../types';

interface TestState { testing: boolean; result?: { ok: boolean; identity?: string; error?: string }; }

const STATUS: Record<RouterStatus, { label: string; tone: 'green' | 'red' | 'amber' | 'slate' }> = {
  online: { label: 'Online', tone: 'green' },
  offline: { label: 'Offline', tone: 'red' },
  error: { label: 'Hitilafu', tone: 'amber' },
  unknown: { label: 'Haijulikani', tone: 'slate' },
};

export function RoutersPage() {
  const { data: routers, isLoading } = useRouters();
  const { remove } = useRouterMutations();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Router | null>(null);
  const [tests, setTests] = useState<Record<string, TestState>>({});

  const openAdd = () => { setEditing(null); setDialog(true); };
  const openEdit = (r: Router) => { setEditing(r); setDialog(true); };

  async function testConnection(id: string) {
    setTests((t) => ({ ...t, [id]: { testing: true } }));
    try {
      const result = await routerService.testConnection(id);
      setTests((t) => ({ ...t, [id]: { testing: false, result } }));
    } catch (e) {
      setTests((t) => ({ ...t, [id]: { testing: false, result: { ok: false, error: String((e as Error).message) } } }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Routers</h1>
          <p className="text-sm text-slate-500">Simamia router zako za MikroTik</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Ongeza router</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-40 animate-pulse" />)}
        </div>
      ) : !routers || routers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <RouterIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="font-medium text-slate-900">Hakuna router bado</p>
            <p className="text-sm text-slate-500">Ongeza router yako ya kwanza ya MikroTik.</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Ongeza router</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routers.map((r) => {
            const s = STATUS[r.status];
            return (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      {r.status === 'online' ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.host}:{r.apiPort}</p>
                    </div>
                  </div>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <span>User: {r.username}</span>
                  {r.location && <span>· {r.location}</span>}
                </div>

                {/* Test connection result */}
                {tests[r.id]?.result && (
                  <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${tests[r.id].result!.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {tests[r.id].result!.ok
                      ? `✓ Imeunganishwa${tests[r.id].result!.identity ? ` — ${tests[r.id].result!.identity}` : ''}`
                      : `✗ ${tests[r.id].result!.error}`}
                  </div>
                )}

                <button
                  onClick={() => testConnection(r.id)}
                  disabled={tests[r.id]?.testing}
                  className="btn-ghost mt-3 w-full justify-center border border-brand-200 text-sm text-brand-600 hover:bg-brand-50"
                >
                  {tests[r.id]?.testing ? <><Loader2 className="h-4 w-4 animate-spin" /> Inajaribu...</> : <><Zap className="h-4 w-4" /> Test Connection</>}
                </button>

                <div className="mt-2 flex gap-2 border-t border-surface-border pt-3">
                  <button onClick={() => openEdit(r)} className="btn-ghost flex-1 text-sm"><Pencil className="h-4 w-4" /> Hariri</button>
                  <button
                    onClick={() => { if (confirm(`Futa ${r.name}?`)) remove.mutate(r.id); }}
                    className="btn-ghost text-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RouterFormDialog open={dialog} onClose={() => setDialog(false)} editing={editing} />
    </div>
  );
}
