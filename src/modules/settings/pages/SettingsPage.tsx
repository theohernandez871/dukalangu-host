import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

interface Company {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  timezone: string;
}

async function fetchCompany(): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, phone, email, address, currency, timezone')
    .maybeSingle();
  if (error || !data) return null;
  return data as Company;
}

export function SettingsPage() {
  const qc = useQueryClient();
  const { data: company } = useQuery({ queryKey: ['company'], queryFn: fetchCompany });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name ?? '');
      setPhone(company.phone ?? '');
      setEmail(company.email ?? '');
      setAddress(company.address ?? '');
      setCurrency(company.currency ?? 'TZS');
    }
  }, [company]);

  const save = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error('Kampuni haipatikani');
      const { error: err } = await supabase
        .from('companies')
        .update({ name: name.trim(), phone: phone.trim(), email: email.trim(), address: address.trim(), currency })
        .eq('id', company.id);
      if (err) throw err;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try { await save.mutateAsync(); } catch (err) { setError(String((err as Error).message ?? 'Imeshindwa.')); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Mipangilio ya biashara</p>
      </div>

      <Card className="max-w-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Building2 className="h-5 w-5" />
          </span>
          <h2 className="font-semibold text-slate-900">Wasifu wa biashara</h2>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          {saved && <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-600">Imehifadhiwa!</div>}
          <Input label="Jina la biashara" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Simu" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Barua pepe" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Input label="Anwani" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Sarafu</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="TZS">TZS - Shilingi ya Tanzania</option>
              <option value="KES">KES - Shilingi ya Kenya</option>
              <option value="UGX">UGX - Shilingi ya Uganda</option>
              <option value="USD">USD - Dola ya Marekani</option>
            </select>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={save.isPending}><Save className="h-4 w-4" /> {save.isPending ? 'Inahifadhi...' : 'Hifadhi'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
