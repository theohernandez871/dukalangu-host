import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouterMutations } from '../hooks/useRouters';
import type { Router } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Router | null;
}

export function RouterFormDialog({ open, onClose, editing }: Props) {
  const { create, update } = useRouterMutations();
  const [name, setName] = useState(editing?.name ?? '');
  const [host, setHost] = useState(editing?.host ?? '192.168.88.1');
  const [apiPort, setApiPort] = useState(String(editing?.apiPort ?? 8728));
  const [username, setUsername] = useState(editing?.username ?? 'admin');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState(editing?.location ?? '');
  const [error, setError] = useState<string | null>(null);

  const busy = create.isPending || update.isPending;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!editing && !password) {
      setError('Weka nywila ya RouterOS.');
      return;
    }
    try {
      const input = {
        name: name.trim(),
        host: host.trim(),
        apiPort: Number(apiPort),
        username: username.trim(),
        password,
        location: location.trim(),
      };
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: password ? input : { ...input, password: undefined } });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setError(String((err as Error).message ?? 'Imeshindwa kuhifadhi.'));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Hariri router' : 'Ongeza router'}
      description="Taarifa za MikroTik. Nywila huhifadhiwa kwa usalama (Vault)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button">Ghairi</Button>
          <Button onClick={submit} disabled={busy}>{busy ? 'Inahifadhi...' : 'Hifadhi'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <Input label="Jina la router" value={name} onChange={(e) => setName(e.target.value)} placeholder="Router ya Ofisi" required />
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Input label="MikroTik IP" value={host} onChange={(e) => setHost(e.target.value)} required />
          </div>
          <Input label="API Port" value={apiPort} onChange={(e) => setApiPort(e.target.value)} />
        </div>
        <Input label="Jina la mtumiaji (RouterOS)" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Input
          label={editing ? 'Nywila mpya (acha wazi kubaki ile ile)' : 'Nywila ya RouterOS'}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input label="Eneo (hiari)" value={location} onChange={(e) => setLocation(e.target.value)} />
      </form>
    </Dialog>
  );
}
