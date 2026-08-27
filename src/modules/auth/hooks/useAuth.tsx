import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authService } from '../services/auth.service';
import type { Profile } from '@/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  permissions: Set<string>;
  loading: boolean;
  hasPermission: (key: string) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    const p = await authService.getProfile().catch(() => null);
    setProfile(p);
    if (p) {
      const perms = await authService.getPermissions(p.role).catch(() => []);
      setPermissions(new Set(perms));
    } else {
      setPermissions(new Set());
    }
  }

  useEffect(() => {
    // Initial session + subscribe to auth changes.
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile();
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s) await loadProfile();
      else {
        setProfile(null);
        setPermissions(new Set());
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    profile,
    permissions,
    loading,
    hasPermission: (key) => permissions.has(key),
    refresh: loadProfile,
    signOut: async () => {
      await authService.signOut();
      setProfile(null);
      setPermissions(new Set());
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth lazima itumike ndani ya AuthProvider');
  return ctx;
}
