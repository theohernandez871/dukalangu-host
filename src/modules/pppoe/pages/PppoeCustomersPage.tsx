import { useState, type FormEvent } from 'react';
import { Plus, UserCog, Trash2, Pause, Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { usePppoeCustomers, usePppoePlans, usePppoeMutations } from '../hooks/usePppoe';
import type { PppoeCustomerStatus } from '../services/pppoe.service';

const TONE: Record<PppoeCustomerStatus, 'green' | 'amber' | 'red'> = {
  active: 'green', suspended: 'amber', expired: 'red',
};

export function PppoeCustomersPage() {
  const { data: customers, isLoading } = usePppoeCustomers();
  const { data: plans } = usePppoePlans();
  const { createCustomer, setStatus, removeCustomer } = usePppoeMutations();
  const [dialog, setDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [packageId, setPackageId] = useState('');
  const [expiry, setExpiry] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!packageId) { setError('Chagua mpango.'); return; }
    try {
      await createCustomer.mutateAsync({
        username: username.trim(),
        packageId,
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: expiry || null,
      });
      setUsername(''); setPackageId(''); setExpiry('');
      setDialog(false);
    } catch (err) {
      setError(String((err as Error).message ?? 'Imeshindwa.'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PPPoE Customers</h1>
          <p className="text-sm text-slate-500">Wateja wa PPPoE</p>
        </div>
        <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Ongeza mteja</Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Inapakia...</div>
        ) : !customers || customers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <UserCog className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">Hakuna mteja wa PPPoE bado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Mpango</th>
                  <th className="px-4 py-3">Mwisho</th>
                  <th className="px-4 py-3">Hali</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.username}</td>
                    <td className="px-4 py-3 text-slate-600">{c.planName ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.expiryDate ?? '—'}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[c.status]}>{c.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {c.status === 'active' ? (
                          <button onClick={() => setStatus.mutate({ id: c.id, status: 'suspended' })} className="text-slate-400 hover:text-amber-500" title="Simamisha"><Pause className="h-4 w-4" /></button>
                        ) : (
                          <button onClick={() => setStatus.mutate({ id: c.id, status: 'active' })} className="text-slate-400 hover:text-green-500" title="Amsha"><Play className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => { if (confirm(`Futa ${c.username}?`)) removeCustomer.mutate(c.id); }} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
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
        title="Ongeza mteja wa PPPoE"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setDialog(false)}>Ghairi</Button>
            <Button onClick={submit} disabled={createCustomer.isPending}>{createCustomer.isPending ? 'Inahifadhi...' : 'Hifadhi'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Mpango</label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">— Chagua —</option>
              {(plans ?? []).filter((p) => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>{p.name} — TZS {p.price.toLocaleString()}</option>
              ))}
            </select>
          </div>
          <Input label="Tarehe ya mwisho (hiari)" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </form>
      </Dialog>
    </div>
  );
}
