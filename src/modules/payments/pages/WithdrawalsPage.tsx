import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

interface Withdrawal {
  id: string;
  amount: number;
  method: string | null;
  note: string | null;
  createdAt: string;
}

async function listWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('id, amount, method, note, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    amount: Number(r.amount),
    method: (r.method as string) ?? null,
    note: (r.note as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

export function WithdrawalsPage() {
  const qc = useQueryClient();
  const { data: withdrawals, isLoading } = useQuery({ queryKey: ['withdrawals'], queryFn: listWithdrawals });
  const [dialog, setDialog] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const record = useMutation({
    mutationFn: async () => {
      const { data: companyId } = await supabase.rpc('current_company_id');
      const { error: err } = await supabase.from('withdrawals').insert({
        company_id: companyId,
        amount: Number(amount),
        method: method.trim() || null,
        note: note.trim() || null,
      });
      if (err) throw err;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      qc.invalidateQueries({ queryKey: ['revenue-summary'] });
      setAmount(''); setMethod(''); setNote(''); setDialog(false);
    },
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || Number(amount) <= 0) { setError('Weka kiasi sahihi.'); return; }
    try { await record.mutateAsync(); } catch (err) { setError(String((err as Error).message ?? 'Imeshindwa.')); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
          <p className="text-sm text-slate-500">Fedha zilizotolewa</p>
        </div>
        <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Rekodi utoaji</Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Inapakia...</div>
        ) : !withdrawals || withdrawals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Wallet className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">Hakuna utoaji bado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kiasi</th>
                  <th className="px-4 py-3">Njia</th>
                  <th className="px-4 py-3">Maelezo</th>
                  <th className="px-4 py-3">Tarehe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">TZS {w.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">{w.method ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{w.note ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(w.createdAt).toLocaleDateString()}</td>
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
        title="Rekodi utoaji wa fedha"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setDialog(false)}>Ghairi</Button>
            <Button onClick={submit} disabled={record.isPending}>{record.isPending ? 'Inahifadhi...' : 'Hifadhi'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <Input label="Kiasi (TZS)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Input label="Njia (hiari)" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="M-Pesa, Benki..." />
          <Input label="Maelezo (hiari)" value={note} onChange={(e) => setNote(e.target.value)} />
        </form>
      </Dialog>
    </div>
  );
}
