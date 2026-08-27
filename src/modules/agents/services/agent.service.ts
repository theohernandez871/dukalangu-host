import { supabase } from '@/lib/supabase';

export interface Agent {
  id: string;
  fullName: string;
  phone: string | null;
  commissionPct: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface AgentInput {
  fullName: string;
  phone?: string;
  commissionPct: number;
}

async function companyId(): Promise<string> {
  const { data, error } = await supabase.rpc('current_company_id');
  if (error) throw error;
  return data as string;
}

export const agentService = {
  async list(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('id, full_name, phone, commission_pct, balance, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      fullName: r.full_name as string,
      phone: (r.phone as string) ?? null,
      commissionPct: Number(r.commission_pct),
      balance: Number(r.balance),
      isActive: r.is_active as boolean,
      createdAt: r.created_at as string,
    }));
  },

  async create(input: AgentInput): Promise<void> {
    const { error } = await supabase.from('agents').insert({
      company_id: await companyId(),
      full_name: input.fullName.trim(),
      phone: input.phone ?? null,
      commission_pct: input.commissionPct,
    });
    if (error) throw error;
  },

  async update(id: string, input: Partial<AgentInput>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.commissionPct !== undefined) patch.commission_pct = input.commissionPct;
    const { error } = await supabase.from('agents').update(patch).eq('id', id);
    if (error) throw error;
  },

  async setActive(id: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('agents').update({ is_active: active }).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('agents').delete().eq('id', id);
    if (error) throw error;
  },
};
