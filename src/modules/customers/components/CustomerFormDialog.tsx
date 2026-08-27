import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCustomerMutations } from '../hooks/useCustomers';
import type { Customer, CustomerStatus } from '../services/customer.service';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Customer | null;
}

export function CustomerFormDialog({ open, onClose, editing }: Props) {
  const { create, update } = useCustomerMutations();
  const [fullName, setFullName] = useState(editing?.fullName ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [address, setAddress] = useState(editing?.address ?? '');
  const [status, setStatus] = useState<CustomerStatus>(editing?.status ?? 'active');
  const [error, setError] = useState<string | null>(null);

  const busy = create.isPending || update.isPending;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const input = { fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), address: address.trim(), status };
      if (editing) await update.mutateAsync({ id: editing.id, input });
      else await create.mutateAsync(input);
      onClose();
    } catch (err) {
      setError(String((err as Error).message ?? 'Imeshindwa.'));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Hariri mteja' : 'Ongeza mteja'}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} disabled={busy}>{busy ? 'Inahifadhi...' : 'Hifadhi'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <Input label="Jina kamili" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Simu" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712..." />
          <Input label="Barua pepe" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Input label="Anwani" value={address} onChange={(e) => setAddress(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Hali</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomerStatus)}
            className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="active">Hai</option>
            <option value="inactive">Si hai</option>
            <option value="suspended">Imesimamishwa</option>
          </select>
        </div>
      </form>
    </Dialog>
  );
}
