import { supabase } from '@/lib/supabase';
import type { Profile, Role } from '@/types';

interface ProfileRow {
  id: string;
  company_id: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
}

function mapProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    companyId: r.company_id,
    fullName: r.full_name,
    phone: r.phone,
    role: r.role,
    isActive: r.is_active,
  };
}

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string, companyName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    // Create the company + link the profile once the user exists.
    if (data.user) {
      await supabase.rpc('bootstrap_company', { p_name: companyName });
    }
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getProfile(): Promise<Profile | null> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, company_id, full_name, phone, role, is_active')
      .eq('id', auth.user.id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProfile(data as ProfileRow) : null;
  },

  async getPermissions(role: Role): Promise<string[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission')
      .eq('role', role);
    if (error) throw error;
    return (data ?? []).map((r) => (r as { permission: string }).permission);
  },
};
