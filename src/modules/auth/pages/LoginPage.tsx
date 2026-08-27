import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wifi } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '../services/auth.service';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authService.signIn(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError('Barua pepe au nywila si sahihi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Wifi className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Karibu tena</h1>
          <p className="text-sm text-slate-500">Ingia kwenye akaunti yako</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <Input label="Barua pepe" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Nywila" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Inaingia...' : 'Ingia'}
          </Button>
          <p className="text-center text-sm text-slate-500">
            Huna akaunti?{' '}
            <Link to="/register" className="font-semibold text-brand-600">Jisajili</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
