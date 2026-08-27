import { useState, type FormEvent } from 'react';
import { Plus, UserCheck, Pencil, Trash2, Power } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useAgents, useAgentMutations } from '../hooks/useAgents';
import type { Agent } from '../services/agent.service';

export function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const { create, update, setActive, remove } = useAgentMutations();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [commission, setCommission] = useState('10');
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditing(null); setFullName(''); setPhone(''); setCommission('10'); setDialog(true);
  }
  function openEdit(a: Agent) {
    setEditing(a); setFullName(a.fullName); setPhone(a.phone ?? ''); setCommission(String(a.commissionPct)); setDialog(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const input = { fullName: fullName.trim(), phone: phone.trim(), commissionPct: Number(commission) };
      if (editing) await update.mutateAsync({ id: editing.id, input });
      else await create.mutateAsync(input);
      setDialog(false);
    } catch (err) {
      setError(String((err as Error).message ?? 'Imeshindwa.'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
          <p className="text-sm text-slate-500">Mawakala wa mauzo</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Ongeza wakala</Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Inapakia...</div>
        ) : !agents || agents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <UserCheck className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">Hakuna wakala bado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Jina</th>
                  <th className="px-4 py-3">Simu</th>
                  <th className="px-4 py-3">Komisheni</th>
                  <th className="px-4 py-3">Salio</th>
                  <th className="px-4 py-3">Hali</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {agents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{a.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{a.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{a.commissionPct}%</td>
                    <td className="px-4 py-3 text-slate-600">TZS {a.balance.toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge tone={a.isActive ? 'green' : 'slate'}>{a.isActive ? 'Hai' : 'Imezimwa'}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(a)} className="text-slate-400 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setActive.mutate({ id: a.id, active: !a.isActive })} className="text-slate-400 hover:text-amber-500"><Power className="h-4 w-4" /></button>
                        <button onClick={() => { if (confirm(`Futa ${a.fullName}?`)) remove.mutate(a.id); }} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title={editing ? 'Hariri wakala' : 'Ongeza wakala'}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setDialog(false)}>Ghairi</Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>Hifadhi</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <Input label="Jina kamili" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Simu" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712..." />
          <Input label="Komisheni (%)" type="number" value={commission} onChange={(e) => setCommission(e.target.value)} />
        </form>
      </Dialog>
    </div>
  );
}
