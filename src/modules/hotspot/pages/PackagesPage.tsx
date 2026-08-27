import { useState } from 'react';
import { Plus, Package as PackageIcon, Pencil, Copy, Trash2, Power } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PackageFormDialog } from '../components/PackageFormDialog';
import { usePackages, usePackageMutations } from '../hooks/usePackages';
import type { Package } from '../services/package.service';

function speed(kbps: number | null): string {
  if (!kbps) return '—';
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(0)} Mbps` : `${kbps} Kbps`;
}

export function PackagesPage() {
  const { data: packages, isLoading } = usePackages();
  const { setActive, duplicate, remove } = usePackageMutations();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);

  const openAdd = () => { setEditing(null); setDialog(true); };
  const openEdit = (p: Package) => { setEditing(p); setDialog(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Packages</h1>
          <p className="text-sm text-slate-500">Vifurushi vya hotspot</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Ongeza kifurushi</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-44 animate-pulse" />)}
        </div>
      ) : !packages || packages.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <PackageIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="font-medium text-slate-900">Hakuna kifurushi bado</p>
            <p className="text-sm text-slate-500">Tengeneza kifurushi chako cha kwanza.</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Ongeza kifurushi</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-lg font-bold text-brand-600">TZS {p.price.toLocaleString()}</p>
                </div>
                <Badge tone={p.isActive ? 'green' : 'slate'}>{p.isActive ? 'Hai' : 'Imezimwa'}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-500">
                <p>Kasi: {speed(p.downloadKbps)} / {speed(p.uploadKbps)}</p>
                <p>Muda: {p.durationMinutes ? `dakika ${p.durationMinutes}` : '—'} · Uhalali: {p.validityDays ? `siku ${p.validityDays}` : '—'}</p>
                <p>Watumiaji: {p.sharedUsers} · Data: {p.dataLimitMb ? `${p.dataLimitMb} MB` : 'Bila kikomo'}</p>
              </div>
              <div className="mt-4 flex gap-1 border-t border-surface-border pt-3">
                <button onClick={() => openEdit(p)} className="btn-ghost flex-1 text-sm"><Pencil className="h-4 w-4" /> Hariri</button>
                <button onClick={() => duplicate.mutate(p)} className="btn-ghost text-sm" title="Nakili"><Copy className="h-4 w-4" /></button>
                <button onClick={() => setActive.mutate({ id: p.id, active: !p.isActive })} className="btn-ghost text-sm" title="Washa/Zima"><Power className="h-4 w-4" /></button>
                <button onClick={() => { if (confirm(`Futa ${p.name}?`)) remove.mutate(p.id); }} className="btn-ghost text-sm text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PackageFormDialog open={dialog} onClose={() => setDialog(false)} editing={editing} />
    </div>
  );
}
