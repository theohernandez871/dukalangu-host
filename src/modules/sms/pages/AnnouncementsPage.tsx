import { useState, type FormEvent } from 'react';
import { Plus, Megaphone, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useAnnouncements, useAnnouncementMutations } from '../hooks/useSms';
import type { Audience } from '../services/sms.service';

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: 'Wote', hotspot: 'Hotspot', pppoe: 'PPPoE', agents: 'Mawakala',
};

export function AnnouncementsPage() {
  const { data: announcements, isLoading } = useAnnouncements();
  const { create, remove } = useAnnouncementMutations();
  const [dialog, setDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({ title: title.trim(), body: body.trim(), audience });
      setTitle(''); setBody(''); setAudience('all'); setDialog(false);
    } catch (err) {
      setError(String((err as Error).message ?? 'Imeshindwa.'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500">Matangazo kwa wateja</p>
        </div>
        <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Tangazo jipya</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-24 animate-pulse" />)}</div>
      ) : !announcements || announcements.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Megaphone className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">Hakuna tangazo bado.</p>
          <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Tangazo jipya</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <Badge tone="brand">{AUDIENCE_LABEL[a.audience]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => { if (confirm('Futa tangazo?')) remove.mutate(a.id); }} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Tangazo jipya"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setDialog(false)}>Ghairi</Button>
            <Button onClick={submit} disabled={create.isPending}>{create.isPending ? 'Inatuma...' : 'Tuma'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <Input label="Kichwa" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Ujumbe</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
              className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Walengwa</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
              className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="all">Wote</option>
              <option value="hotspot">Hotspot</option>
              <option value="pppoe">PPPoE</option>
              <option value="agents">Mawakala</option>
            </select>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
