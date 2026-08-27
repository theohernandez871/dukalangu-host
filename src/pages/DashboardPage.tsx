import {
  DollarSign, TrendingUp, Calendar, Wallet, Wifi, Router,
  RouterIcon, Ticket, Clock, Users,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { useRevenueSummary } from '@/modules/payments/hooks/usePayments';
import { Card } from '@/components/ui/Card';

// Phase 1 dashboard: layout + cards wired to placeholder zeros. Live data is
// connected in Phase 2 once the metrics queries land. No fake numbers — zeros
// until real aggregates exist.
export function DashboardPage() {
  const { data: rev } = useRevenueSummary();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Muhtasari wa biashara yako</p>
      </div>

      {/* Sales summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales Today" value={`TZS ${(rev?.today ?? 0).toLocaleString()}`} icon={DollarSign} tone="brand" />
        <StatCard label="This Month" value={`TZS ${(rev?.thisMonth ?? 0).toLocaleString()}`} icon={Calendar} tone="slate" />
        <StatCard label="Total Sales" value={`TZS ${(rev?.total ?? 0).toLocaleString()}`} icon={TrendingUp} tone="green" />
        <StatCard label="Remaining" value={`TZS ${(rev?.remaining ?? 0).toLocaleString()}`} icon={Wallet} tone="amber" />
      </div>

      {/* Operational summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active Users" value="0" icon={Wifi} tone="brand" />
        <StatCard label="Online Routers" value="0" icon={Router} tone="green" />
        <StatCard label="Offline Routers" value="0" icon={RouterIcon} tone="red" />
        <StatCard label="Active Vouchers" value="0" icon={Ticket} tone="slate" />
        <StatCard label="Pending Payments" value="0" icon={Clock} tone="amber" />
        <StatCard label="Total Customers" value="0" icon={Users} tone="brand" />
      </div>

      {/* Placeholders for charts + tables (built in later phases) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Revenue Overview</h2>
          <div className="mt-4 flex h-56 items-center justify-center text-sm text-slate-400">
            Chart itaonekana hapa (Phase 2)
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Router Health</h2>
          <div className="mt-4 flex h-56 items-center justify-center text-sm text-slate-400">
            Hali ya routers (Phase 3)
          </div>
        </Card>
      </div>
    </div>
  );
}
