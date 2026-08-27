import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePaymentMutations } from '../hooks/usePayments';
import type { PaymentMethod } from '../services/payment.service';

interface Props {
  open: boolean;
  onClose: () => void;
}

const METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: 'Fedha taslimu' },
  { key: 'mpesa', label: 'M-Pesa' },
  { key: 'airtel', label: 'Airtel Money' },
  { key: 'tigo', label: 'Mixx by Yas (Tigo)' },
  { key: 'halopesa', label: 'HaloPesa' },
  { key: 'card', label: 'Kadi' },
  { key: 'other', label: 'Nyingine' },
];

export function RecordPaymentDialog({ open, onClose }: Props) {
  const { record } = usePaymentMutations();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || Number(amount) <= 0) { setError('Weka kiasi sahihi.'); return; }
    try {
      await record.mutateAsync({
        amount: Number(amount),
        method,
        reference: reference.trim() || undefined,
        description: description.trim() || undefined,
      });
      setAmount(''); setReference(''); setDescription(''); setMethod('cash');
      onClose();
    } catch (err) {
      setError(String((err as Error).message ?? 'Imeshindwa.'));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Rekodi malipo"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} disabled={record.isPending}>{record.isPending ? 'Inahifadhi...' : 'Hifadhi'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <Input label="Kiasi (TZS)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Njia ya malipo</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            {METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
        <Input label="Kumbukumbu / Reference (hiari)" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN123..." />
        <Input label="Maelezo (hiari)" value={description} onChange={(e) => setDescription(e.target.value)} />
      </form>
    </Dialog>
  );
}
