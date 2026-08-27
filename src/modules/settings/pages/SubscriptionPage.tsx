import { useQuery } from '@tanstack/react-query';
import { Check, Crown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  features: string[];
}

interface CurrentSub {
  status: string;
  expiresAt: string | null;
  planName: string | null;
}

async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id, name, price, duration_days, features')
    .eq('is_active', true)
    .order('price');
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    price: Number(r.price),
    durationDays: Number(r.duration_days),
    features: (r.features as string[]) ?? [],
  }));
}

async function fetchCurrent(): Promise<CurrentSub | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, expires_at, subscription_plans(name)')
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Record<string, unknown>;
  return {
    status: r.status as string,
    expiresAt: (r.expires_at as string) ?? null,
    planName: (r.subscription_plans as { name: string } | null)?.name ?? null,
  };
}

export function SubscriptionPage() {
  const { data: plans, isLoading } = useQuery({ queryKey: ['sub-plans'], queryFn: fetchPlans });
  const { data: current } = useQuery({ queryKey: ['sub-current'], queryFn: fetchCurrent });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
        <p className="text-sm text-slate-500">Mpango wako wa huduma</p>
      </div>

      {current && (
        <Card className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Mpango wa sasa</p>
              <p className="font-bold text-slate-900">{current.planName ?? 'Bure (Trial)'}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge tone={current.status === 'active' ? 'green' : current.status === 'trial' ? 'brand' : 'red'}>{current.status}</Badge>
            {current.expiresAt && <p className="mt-1 text-xs text-slate-400">Inaisha: {new Date(current.expiresAt).toLocaleDateString()}</p>}
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-64 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(plans ?? []).map((p) => (
            <Card key={p.id} className="flex flex-col p-6">
              <p className="font-semibold text-slate-900">{p.name}</p>
              <p className="mt-2 text-3xl font-bold text-brand-600">
                TZS {p.price.toLocaleString()}
                <span className="text-sm font-normal text-slate-400">/{p.durationDays} siku</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-4 w-full" variant={p.price === 0 ? 'outline' : 'primary'}>
                {p.price === 0 ? 'Mpango wa sasa' : 'Chagua'}
              </Button>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400">
        Malipo ya mpango yataunganishwa na lango la malipo katika hatua ya integration.
      </p>
    </div>
  );
}
