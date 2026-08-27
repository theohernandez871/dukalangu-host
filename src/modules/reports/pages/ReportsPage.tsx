import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, DollarSign, Receipt, Ticket, Users, Router } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { reportService, exportCsv, type DateRange } from '../services/report.service';

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function preset(kind: 'today' | 'week' | 'month'): DateRange {
  const now = new Date();
  const to = iso(now);
  if (kind === 'today') return { from: to, to };
  if (kind === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: iso(d), to };
  }
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to };
}

const PRESETS: { key: 'today' | 'week' | 'month'; label: string }[] = [
  { key: 'today', label: 'Leo' },
  { key: 'week', label: 'Wiki hii' },
  { key: 'month', label: 'Mwezi huu' },
];

export function ReportsPage() {
  const [active, setActive] = useState<'today' | 'week' | 'month'>('month');
  const range = preset(active);
  const { data: summary, isLoading } = useQuery({
    queryKey: ['report-summary', range.from, range.to],
    queryFn: () => reportService.summary(range),
  });

  async function downloadCsv() {
    const rows = await reportService.paymentsInRange(range);
    if (rows.length === 0) { alert('Hakuna data ya kupakua kwa kipindi hiki.'); return; }
    exportCsv(`ripoti-mauzo-${range.from}-${range.to}.csv`, rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Ripoti za biashara</p>
        </div>
        <Button variant="outline" onClick={downloadCsv}><Download className="h-4 w-4" /> Pakua CSV</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setActive(p.key)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
              active === p.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="ml-2 flex items-center text-xs text-slate-400">{range.from} → {range.to}</span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => <Card key={i} className="h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Mauzo (jumla)" value={`TZS ${(summary?.totalSales ?? 0).toLocaleString()}`} icon={DollarSign} tone="brand" />
          <StatCard label="Malipo" value={String(summary?.paymentCount ?? 0)} icon={Receipt} tone="green" />
          <StatCard label="Vocha" value={String(summary?.voucherCount ?? 0)} icon={Ticket} tone="amber" />
          <StatCard label="Wateja (jumla)" value={String(summary?.customerCount ?? 0)} icon={Users} tone="slate" />
          <StatCard label="Router online" value={String(summary?.activeRouters ?? 0)} icon={Router} tone="brand" />
        </div>
      )}

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900">Aina za ripoti</h2>
        <p className="mt-1 text-sm text-slate-500">
          Bonyeza "Pakua CSV" kupata ripoti ya mauzo kwa kipindi ulichochagua. Ripoti zaidi
          (PDF, Excel) zinaweza kuongezwa kadri ya mahitaji.
        </p>
      </Card>
    </div>
  );
}
