import { useState } from 'react';
import { Plus, DollarSign, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { RecordPaymentDialog } from '../components/RecordPaymentDialog';
import { usePayments, useRevenueSummary } from '../hooks/usePayments';
import type { PaymentStatus } from '../services/payment.service';

const TONE: Record<PaymentStatus, 'green' | 'amber' | 'red' | 'slate' | 'brand'> = {
  successful: 'green', pending: 'amber', failed: 'red', cancelled: 'slate', refunded: 'brand',
};

const METHOD_LABEL: Record<string, string> = {
  cash: 'Taslimu', mpesa: 'M-Pesa', airtel: 'Airtel', tigo: 'Yas', halopesa: 'HaloPesa', card: 'Kadi', other: 'Nyingine',
};

export function SalesPage() {
  const { data: summary } = useRevenueSummary();
  const { data: payments, isLoading } = usePayments();
  const [dialog, setDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
          <p className="text-sm text-slate-500">Mauzo na malipo</p>
        </div>
        <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Rekodi malipo</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leo" value={`TZS ${(summary?.today ?? 0).toLocaleString()}`} icon={DollarSign} tone="brand" />
        <StatCard label="Mwezi huu" value={`TZS ${(summary?.thisMonth ?? 0).toLocaleString()}`} icon={TrendingUp} tone="green" />
        <StatCard label="Jumla" value={`TZS ${(summary?.total ?? 0).toLocaleString()}`} icon={Wallet} tone="amber" />
        <StatCard label="Salio lililobaki" value={`TZS ${(summary?.remaining ?? 0).toLocaleString()}`} icon={CreditCard} tone="slate" hint={`Imetolewa: TZS ${(summary?.withdrawn ?? 0).toLocaleString()}`} />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-surface-border px-5 py-3">
          <h2 className="font-semibold text-slate-900">Miamala ya hivi karibuni</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Inapakia...</div>
        ) : !payments || payments.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">Hakuna malipo bado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kiasi</th>
                  <th className="px-4 py-3">Njia</th>
                  <th className="px-4 py-3">Kumbukumbu</th>
                  <th className="px-4 py-3">Hali</th>
                  <th className="px-4 py-3">Tarehe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">TZS {p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">{METHOD_LABEL[p.method] ?? p.method}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.reference ?? '—'}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[p.status]}>{p.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RecordPaymentDialog open={dialog} onClose={() => setDialog(false)} />
    </div>
  );
}
