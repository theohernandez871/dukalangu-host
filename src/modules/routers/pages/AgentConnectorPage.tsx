import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Radio, Copy, Check, Circle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { agentRegService } from '../agent/agent.service';

// An agent is considered online if it was seen in the last 60 seconds.
function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 60_000;
}

export function AgentConnectorPage() {
  const qc = useQueryClient();
  const { data: agents, isLoading } = useQuery({
    queryKey: ['reg-agents'],
    queryFn: () => agentRegService.list(),
    refetchInterval: 20_000,
  });
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useMutation({
    mutationFn: () => agentRegService.register(name.trim()),
    onSuccess: (tok) => {
      setToken(tok);
      qc.invalidateQueries({ queryKey: ['reg-agents'] });
    },
    onError: (e) => setError(String((e as Error).message ?? 'Imeshindwa.')),
  });

  function closeDialog() {
    setDialog(false); setName(''); setToken(null); setCopied(false); setError(null);
  }

  function copyToken() {
    if (token) { navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agents (Connector)</h1>
          <p className="text-sm text-slate-500">Programu inayounganisha MikroTik na mfumo</p>
        </div>
        <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Sajili agent</Button>
      </div>

      {/* How it works */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Radio className="h-5 w-5" />
          </span>
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-900">Agent ni nini?</p>
            <p className="mt-1">
              Agent ni programu ndogo inayoendesha kwenye kompyuta iliyo kwenye LAN moja na MikroTik.
              Inaunganisha router (192.168.88.1) na mfumo wa mtandaoni kwa usalama. Sajili agent hapa
              kupata token, kisha iweke kwenye faili la <code className="rounded bg-slate-100 px-1">.env</code> la agent.
            </p>
          </div>
        </div>
      </Card>

      {/* Agent list */}
      {isLoading ? (
        <Card className="h-32 animate-pulse" />
      ) : !agents || agents.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Radio className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">Hakuna agent iliyosajiliwa bado.</p>
          <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Sajili agent</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => {
            const online = isOnline(a.lastSeen);
            return (
              <Card key={a.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-400">
                      {a.lastSeen ? `Mwisho: ${new Date(a.lastSeen).toLocaleString()}` : 'Bado haijaonekana'}
                    </p>
                  </div>
                  <Badge tone={online ? 'green' : 'slate'}>
                    <Circle className={`mr-1 h-2 w-2 ${online ? 'fill-emerald-500 text-emerald-500' : 'fill-slate-400 text-slate-400'}`} />
                    {online ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Register dialog */}
      <Dialog
        open={dialog}
        onClose={closeDialog}
        title={token ? 'Token ya agent' : 'Sajili agent mpya'}
        footer={
          token ? (
            <Button onClick={closeDialog}>Nimehifadhi token</Button>
          ) : (
            <>
              <Button variant="ghost" type="button" onClick={closeDialog}>Ghairi</Button>
              <Button onClick={() => register.mutate()} disabled={register.isPending || !name.trim()}>
                {register.isPending ? 'Inasajili...' : 'Sajili'}
              </Button>
            </>
          )
        }
      >
        {token ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Nakili token hii SASA. Haitaonyeshwa tena baada ya kufunga.</p>
            </div>
            <div className="rounded-xl border border-surface-border bg-slate-50 p-3">
              <p className="break-all font-mono text-xs text-slate-700">{token}</p>
            </div>
            <button onClick={copyToken} className="btn-ghost w-full justify-center border border-brand-200 text-brand-600 hover:bg-brand-50">
              {copied ? <><Check className="h-4 w-4" /> Imenakiliwa!</> : <><Copy className="h-4 w-4" /> Nakili token</>}
            </button>
            <p className="text-xs text-slate-500">
              Weka token hii kwenye faili <code className="rounded bg-slate-100 px-1">.env</code> la agent:
              <br /><code className="mt-1 block rounded bg-slate-100 px-2 py-1">AGENT_TOKEN={token.slice(0, 12)}...</code>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            <Input label="Jina la agent" value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent ya Ofisi" required />
            <p className="text-xs text-slate-400">Mfano: "Agent ya HQ" au jina la kompyuta itakayoendesha agent.</p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
