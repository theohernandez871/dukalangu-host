import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useVoucherMutations } from '../hooks/useVouchers';
import { usePackages } from '@/modules/hotspot/hooks/usePackages';

interface Props {
  open: boolean;
  onClose: () => void;
  onGenerated?: (batchId: string) => void;
}

export function GenerateVoucherDialog({ open, onClose, onGenerated }: Props) {
  const { data: packages } = usePackages();
  const { generate } = useVoucherMutations();
  const [packageId, setPackageId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [prefix, setPrefix] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!packageId) { setError('Chagua kifurushi.'); return; }
    try {
      const batchId = await generate.mutateAsync({
        packageId,
        quantity: Number(quantity),
        prefix: prefix.trim().toUpperCase(),
      });
      onGenerated?.(batchId);
      onClose();
    } catch (err) {
      setError(String((err as Error).message ?? 'Imeshindwa kutengeneza.'));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tengeneza vocha"
      description="Vocha moja au nyingi kwa pamoja"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} disabled={generate.isPending}>
            {generate.isPending ? 'Inatengeneza...' : 'Tengeneza'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Kifurushi</label>
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">— Chagua —</option>
            {(packages ?? []).filter((p) => p.isActive).map((p) => (
              <option key={p.id} value={p.id}>{p.name} — TZS {p.price.toLocaleString()}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Idadi" type="number" min={1} max={1000} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <Input label="Kianzio (hiari)" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="WIFI" />
        </div>
        <p className="text-xs text-slate-400">Kianzio huongezwa mbele ya kila code, mfano WIFI-XXXXXXXX.</p>
      </form>
    </Dialog>
  );
}
