import { useState } from 'react';
import { Plus, Users, Search, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CustomerFormDialog } from '../components/CustomerFormDialog';
import { useCustomers, useCustomerMutations } from '../hooks/useCustomers';
import type { Customer, CustomerStatus } from '../services/customer.service';

const TONE: Record<CustomerStatus, 'green' | 'slate' | 'red'> = {
  active: 'green', inactive: 'slate', suspended: 'red',
};
const LABEL: Record<CustomerStatus, string> = {
  active: 'Hai', inactive: 'Si hai', suspended: 'Imesimamishwa',
};

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const { data: customers, isLoading } = useCustomers(search);
  const { remove } = useCustomerMutations();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const openAdd = () => { setEditing(null); setDialog(true); };
  const openEdit = (c: Customer) => { setEditing(c); setDialog(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">Wateja wako</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Ongeza mteja</Button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 max-w-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tafuta kwa jina au simu..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Inapakia...</div>
        ) : !customers || customers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">{search ? 'Hakuna mteja aliyepatikana.' : 'Hakuna mteja bado.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Jina</th>
                  <th className="px-4 py-3">Simu</th>
                  <th className="px-4 py-3">Salio</th>
                  <th className="px-4 py-3">Hali</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">TZS {c.balance.toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[c.status]}>{LABEL[c.status]}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => { if (confirm(`Futa ${c.fullName}?`)) remove.mutate(c.id); }} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CustomerFormDialog open={dialog} onClose={() => setDialog(false)} editing={editing} />
    </div>
  );
}
