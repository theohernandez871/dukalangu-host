import { MessageCircle, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSmsBalance, useSmsHistory } from '../hooks/useSms';

const BUNDLES = [
  { sms: 100, price: 3000 },
  { sms: 500, price: 12500 },
  { sms: 1000, price: 22000 },
  { sms: 5000, price: 95000 },
];

export function BuySmsPage() {
  const { data: balance } = useSmsBalance();
  const { data: history, isLoading } = useSmsHistory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Buy SMS</h1>
        <p className="text-sm text-slate-500">Salio la SMS na vifurushi</p>
      </div>

      {/* Balance */}
      <Card className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-slate-500">Salio lako la SMS</p>
            <p className="text-2xl font-bold text-slate-900">{(balance ?? 0).toLocaleString()} SMS</p>
          </div>
        </div>
      </Card>

      {/* Bundles */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Nunua vifurushi</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUNDLES.map((b) => (
            <Card key={b.sms} className="flex flex-col items-center p-5 text-center">
              <p className="text-2xl font-bold text-brand-600">{b.sms.toLocaleString()}</p>
              <p className="text-xs text-slate-400">SMS</p>
              <p className="mt-2 font-semibold text-slate-900">TZS {b.price.toLocaleString()}</p>
              <Button className="mt-3 w-full" variant="outline">Nunua</Button>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Malipo ya SMS yataunganishwa na lango la malipo (M-Pesa/Airtel) katika hatua ya integration.
        </p>
      </div>

      {/* History */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Historia ya SMS</h2>
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Inapakia...</div>
          ) : !history || history.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">Hakuna SMS zilizotumwa bado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-surface-border bg-slate-50 text-left text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Mpokeaji</th>
                    <th className="px-4 py-3">Ujumbe</th>
                    <th className="px-4 py-3">Hali</th>
                    <th className="px-4 py-3">Tarehe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {history.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{m.recipient}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-600">{m.body}</td>
                      <td className="px-4 py-3">
                        <Badge tone={m.status === 'delivered' || m.status === 'sent' ? 'green' : m.status === 'failed' ? 'red' : 'amber'}>
                          {m.status === 'delivered' && <Check className="mr-1 h-3 w-3" />}{m.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
