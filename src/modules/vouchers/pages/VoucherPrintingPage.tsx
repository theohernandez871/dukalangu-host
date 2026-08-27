import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useVouchers } from '../hooks/useVouchers';

type Template = 'small' | 'thermal' | 'a4';

const TEMPLATES: { key: Template; label: string; cols: string }[] = [
  { key: 'small', label: 'Vocha ndogo', cols: 'grid-cols-2 sm:grid-cols-3' },
  { key: 'thermal', label: 'Printa ya thermal', cols: 'grid-cols-1' },
  { key: 'a4', label: 'A4 (nyingi)', cols: 'grid-cols-2 sm:grid-cols-4' },
];

export function VoucherPrintingPage() {
  const { data: vouchers } = useVouchers('unused');
  const [template, setTemplate] = useState<Template>('small');
  const cols = TEMPLATES.find((t) => t.key === template)!.cols;
  const toPrint = (vouchers ?? []).slice(0, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voucher Printing</h1>
          <p className="text-sm text-slate-500">Chapisha vocha zisizotumika ({toPrint.length})</p>
        </div>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Chapisha</Button>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTemplate(t.key)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
              template === t.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {toPrint.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center print:hidden">
          <Printer className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">Hakuna vocha zisizotumika za kuchapisha.</p>
        </Card>
      ) : (
        <div className={`grid gap-3 ${cols}`}>
          {toPrint.map((v) => (
            <div key={v.id} className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center">
              <p className="text-[11px] font-semibold text-brand-600">HOTSPOT BILLING</p>
              <p className="mt-1 text-[10px] text-slate-400">{v.packageName ?? 'Kifurushi'}</p>
              <p className="my-2 font-mono text-lg font-bold tracking-wider text-slate-900">{v.code}</p>
              <p className="text-xs font-semibold text-slate-700">TZS {v.price.toLocaleString()}</p>
              <p className="mt-1 text-[9px] text-slate-400">Ingia kwenye WiFi, weka code hii</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
