import { useState, type FormEvent } from 'react';
import { Plus, Network, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { usePppoePlans, usePppoeMutations } from '../hooks/usePppoe';

function speed(kbps: number | null): string {
  if (!kbps) return '—';
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(0)} Mbps` : `${kbps} Kbps`;
}

export function PppoePlansPage() {
  const { data: plans, isLoading } = usePppoePlans();
  const { createPlan, removePlan } = usePppoeMutations();
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [dl, setDl] = useState('');
  const [ul, setUl] = useState('');
  const [validity, setValidity] = useState('30');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createPlan.mutateAsync({
        name: name.trim(),
        price: Number(price),
        downloadKbps: dl ? Number(dl) : null,
        uploadKbps: ul ? Number(ul) : null,
        validityDays: validity ? Number(validity) : null,
      });
      setName(''); setPrice(''); setDl(''); setUl(''); setValidity('30');
      setDialog(false);
    } catch (err) {
      setError(String((err as Error).message ?? 'Imeshindwa.'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PPPoE Plans</h1>
          <p className="text-sm text-slate-500">Mipango ya PPPoE</p>
        </div>
        <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Ongeza mpango</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-32 animate-pulse" />)}
        </div>
      ) : !plans || plans.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Network className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">Hakuna mpango bado.</p>
          <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Ongeza mpango</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-lg font-bold text-brand-600">TZS {p.price.toLocaleString()}</p>
                </div>
                <Badge tone={p.isActive ? 'green' : 'slate'}>{p.isActive ? 'Hai' : 'Imezimwa'}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-500">
                <p>Kasi: {speed(p.downloadKbps)} / {speed(p.uploadKbps)}</p>
                <p>Uhalali: {p.validityDays ? `siku ${p.validityDays}` : '—'}</p>
              </div>
              <div className="mt-4 border-t border-surface-border pt-3">
                <button onClick={() => { if (confirm(`Futa ${p.name}?`)) removePlan.mutate(p.id); }} className="btn-ghost text-sm text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Futa</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Ongeza mpango wa PPPoE"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setDialog(false)}>Ghairi</Button>
            <Button onClick={submit} disabled={createPlan.isPending}>{createPlan.isPending ? 'Inahifadhi...' : 'Hifadhi'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <Input label="Jina la mpango" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Bei (TZS)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <Input label="Uhalali (siku)" type="number" value={validity} onChange={(e) => setValidity(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Download (Kbps)" type="number" value={dl} onChange={(e) => setDl(e.target.value)} />
            <Input label="Upload (Kbps)" type="number" value={ul} onChange={(e) => setUl(e.target.value)} />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
