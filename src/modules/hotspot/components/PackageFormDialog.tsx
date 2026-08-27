import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePackageMutations } from '../hooks/usePackages';
import type { Package } from '../services/package.service';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Package | null;
}

const numOrNull = (v: string): number | null => (v.trim() === '' ? null : Number(v));

export function PackageFormDialog({ open, onClose, editing }: Props) {
  const { create, update } = usePackageMutations();
  const [name, setName] = useState(editing?.name ?? '');
  const [price, setPrice] = useState(String(editing?.price ?? ''));
  const [validityDays, setValidityDays] = useState(editing?.validityDays?.toString() ?? '');
  const [durationMinutes, setDurationMinutes] = useState(editing?.durationMinutes?.toString() ?? '');
  const [downloadKbps, setDownloadKbps] = useState(editing?.downloadKbps?.toString() ?? '');
  const [uploadKbps, setUploadKbps] = useState(editing?.uploadKbps?.toString() ?? '');
  const [dataLimitMb, setDataLimitMb] = useState(editing?.dataLimitMb?.toString() ?? '');
  const [sharedUsers, setSharedUsers] = useState(String(editing?.sharedUsers ?? 1));
  const [error, setError] = useState<string | null>(null);

  const busy = create.isPending || update.isPending;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const input = {
        name: name.trim(),
        price: Number(price),
        validityDays: numOrNull(validityDays),
        durationMinutes: numOrNull(durationMinutes),
        downloadKbps: numOrNull(downloadKbps),
        uploadKbps: numOrNull(uploadKbps),
        dataLimitMb: numOrNull(dataLimitMb),
        sharedUsers: Number(sharedUsers) || 1,
      };
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
      title={editing ? 'Hariri kifurushi' : 'Ongeza kifurushi'}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} disabled={busy}>{busy ? 'Inahifadhi...' : 'Hifadhi'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <Input label="Jina la kifurushi" value={name} onChange={(e) => setName(e.target.value)} placeholder="Saa 1" required />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Bei (TZS)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <Input label="Watumiaji (shared)" type="number" value={sharedUsers} onChange={(e) => setSharedUsers(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Muda (dakika)" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="60" />
          <Input label="Uhalali (siku)" type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} placeholder="1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Download (Kbps)" type="number" value={downloadKbps} onChange={(e) => setDownloadKbps(e.target.value)} />
          <Input label="Upload (Kbps)" type="number" value={uploadKbps} onChange={(e) => setUploadKbps(e.target.value)} />
        </div>
        <Input label="Kikomo cha data (MB, acha wazi = bila kikomo)" type="number" value={dataLimitMb} onChange={(e) => setDataLimitMb(e.target.value)} />
      </form>
    </Dialog>
  );
}
