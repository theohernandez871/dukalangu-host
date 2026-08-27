import { useState } from 'react';
import { Plus, Ticket, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GenerateVoucherDialog } from '../components/GenerateVoucherDialog';
import { useVouchers, useVoucherMutations } from '../hooks/useVouchers';
import type { VoucherStatus } from '../services/voucher.service';

const STATUS_TABS: { key: VoucherStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Zote' },
  { key: 'unused', label: 'Hazijatumika' },
  { key: 'active', label: 'Hai' },
  { key: 'used', label: 'Zimetumika' },
  { key: 'expired', label: 'Zimeisha' },
  { key: 'cancelled', label: 'Zimeghairiwa' },
];

const TONE: Record<VoucherStatus, 'slate' | 'green' | 'brand' | 'amber' | 'red'> = {
  unused: 'slate', active: 'green', used: 'brand', expired: 'amber', cancelled: 'red',
};

export function VoucherHistoryPage() {
  const [tab, setTab] = useState<VoucherStatus | 'all'>('all');
  const { data: vouchers, isLoading } = useVouchers(tab === 'all' ? undefined : tab);
  const { cancel } = useVoucherMutations();
  const [dialog, setDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voucher History</h1>
          <p className="text-sm text-slate-500">Vocha zote zilizotengenezwa</p>
        </div>
        <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Tengeneza vocha</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Inapakia...</div>
        ) : !vouchers || vouchers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Ticket className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">Hakuna vocha.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Kifurushi</th>
                  <th className="px-4 py-3">Bei</th>
                  <th className="px-4 py-3">Hali</th>
                  <th className="px-4 py-3">Imeundwa</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{v.code}</td>
                    <td className="px-4 py-3 text-slate-600">{v.packageName ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">TZS {v.price.toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[v.status]}>{v.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {v.status === 'unused' && (
                        <button onClick={() => cancel.mutate(v.id)} className="text-slate-400 hover:text-red-500" title="Ghairi">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <GenerateVoucherDialog open={dialog} onClose={() => setDialog(false)} />
    </div>
  );
}
