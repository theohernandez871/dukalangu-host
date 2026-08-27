import { supabase } from '@/lib/supabase';

export type CustomerStatus = 'active' | 'inactive' | 'suspended';

export interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: CustomerStatus;
  balance: number;
  lastLogin: string | null;
  createdAt: string;
}

export interface CustomerInput {
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: CustomerStatus;
}

interface Row {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: CustomerStatus;
  balance: number;
  last_login: string | null;
  created_at: string;
}

function map(r: Row): Customer {
  return {
    id: r.id,
    fullName: r.full_name,
    phone: r.phone,
    email: r.email,
    address: r.address,
    status: r.status,
    balance: Number(r.balance),
    lastLogin: r.last_login,
    createdAt: r.created_at,
  };
}

async function companyId(): Promise<string> {
  const { data, error } = await supabase.rpc('current_company_id');
  if (error) throw error;
  return data as string;
}

export const customerService = {
  async list(search?: string): Promise<Customer[]> {
    let q = supabase
      .from('customers')
      .select('id, full_name, phone, email, address, status, balance, last_login, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (search && search.trim()) {
      q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as Row[]).map(map);
  },

  async create(input: CustomerInput): Promise<void> {
    const { error } = await supabase.from('customers').insert({
      company_id: await companyId(),
      full_name: input.fullName.trim(),
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      status: input.status ?? 'active',
    });
    if (error) throw error;
  },

  async update(id: string, input: Partial<CustomerInput>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.email !== undefined) patch.email = input.email;
    if (input.address !== undefined) patch.address = input.address;
    if (input.status !== undefined) patch.status = input.status;
    const { error } = await supabase.from('customers').update(patch).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },
};
