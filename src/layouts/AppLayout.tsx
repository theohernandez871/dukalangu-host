import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Bell, Search, X, LogOut } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/modules/auth/hooks/useAuth';

export function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  const { profile, signOut } = useAuth();
  const initial = (profile?.fullName ?? 'U').charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside className="hidden lg:block">
        <div className="fixed inset-y-0"><Sidebar /></div>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0">
            <div className="relative h-full">
              <button onClick={() => setDrawer(false)} className="absolute -right-10 top-4 text-white" aria-label="Funga">
                <X className="h-6 w-6" />
              </button>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-surface-border bg-white/80 px-4 backdrop-blur">
          <button className="lg:hidden" onClick={() => setDrawer(true)} aria-label="Menyu">
            <Menu className="h-6 w-6 text-slate-600" />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 max-w-md">
            <Search className="h-4 w-4 text-slate-400" />
            <input placeholder="Tafuta..." className="w-full bg-transparent text-sm outline-none" />
          </div>
          <button className="relative" aria-label="Arifa"><Bell className="h-5 w-5 text-slate-500" /></button>
          <div className="flex items-center gap-2 border-l border-surface-border pl-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {initial}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{profile?.fullName ?? 'Mtumiaji'}</span>
            <button onClick={signOut} className="text-slate-400 hover:text-red-500" aria-label="Toka">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
