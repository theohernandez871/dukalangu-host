import { NavLink } from 'react-router-dom';
import { Wifi } from 'lucide-react';
import { NAV_GROUPS } from './navigation';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { cn } from '@/utils/cn';

interface Props {
  onNavigate?: () => void;
}

/** Grouped, icon-led navigation. Items are filtered by the user's permissions
 *  (server-side RLS still enforces access; this only hides what they can't use). */
export function Sidebar({ onNavigate }: Props) {
  const { hasPermission } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col border-r border-surface-border bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Wifi className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-slate-900">Hotspot Billing</p>
          <p className="text-[11px] text-slate-400">Management Platform</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.permission || hasPermission(i.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.heading}>
              <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400">{group.heading}</p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
