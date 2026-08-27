import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { RequireAuth } from './modules/auth/components/RequireAuth';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { RoutersPage } from './modules/routers/pages/RoutersPage';
import { PackagesPage } from './modules/hotspot/pages/PackagesPage';
import { VoucherHistoryPage } from './modules/vouchers/pages/VoucherHistoryPage';
import { VoucherPrintingPage } from './modules/vouchers/pages/VoucherPrintingPage';
import { ActiveUsersPage } from './modules/hotspot/pages/ActiveUsersPage';
import { CustomersPage } from './modules/customers/pages/CustomersPage';
import { PppoePlansPage } from './modules/pppoe/pages/PppoePlansPage';
import { PppoeCustomersPage } from './modules/pppoe/pages/PppoeCustomersPage';
import { SalesPage } from './modules/payments/pages/SalesPage';
import { WithdrawalsPage } from './modules/payments/pages/WithdrawalsPage';
import { AnnouncementsPage } from './modules/sms/pages/AnnouncementsPage';
import { BuySmsPage } from './modules/sms/pages/BuySmsPage';
import { AgentsPage } from './modules/agents/pages/AgentsPage';
import { ReportsPage } from './modules/reports/pages/ReportsPage';
import { SubscriptionPage } from './modules/settings/pages/SubscriptionPage';
import { SettingsPage } from './modules/settings/pages/SettingsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/vouchers" element={<VoucherHistoryPage />} />
        <Route path="/vouchers/send" element={<PlaceholderPage title="Send Voucher" />} />
        <Route path="/vouchers/print" element={<VoucherPrintingPage />} />
        <Route path="/portal" element={<PlaceholderPage title="Portal" />} />
        <Route path="/chats" element={<PlaceholderPage title="Chats" />} />
        <Route path="/routers" element={<RoutersPage />} />
        <Route path="/active-users" element={<ActiveUsersPage />} />
        <Route path="/pppoe/plans" element={<PppoePlansPage />} />
        <Route path="/pppoe/customers" element={<PppoeCustomersPage />} />
        <Route path="/sms/announcements" element={<AnnouncementsPage />} />
        <Route path="/sms/buy" element={<BuySmsPage />} />
        <Route path="/withdrawals" element={<WithdrawalsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
      </Route>
    </Routes>
  );
}
