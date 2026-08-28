import { supabase } from '@/lib/supabase';

export interface AgentRow {
  id: string;
  name: string;
  lastSeen: string | null;
  createdAt: string;
}

export const agentRegService = {
  async list(): Promise<AgentRow[]> {
    const { data, error } = await supabase.rpc('list_agents');
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      lastSeen: (r.last_seen as string) ?? null,
      createdAt: r.created_at as string,
    }));
  },

  // Returns the plaintext token ONCE. Caller must show it immediately.
  async register(name: string): Promise<string> {
    const { data, error } = await supabase.rpc('register_agent', { p_name: name });
    if (error) throw error;
    return data as string;
  },
};
