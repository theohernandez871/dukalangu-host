import { supabase } from '@/lib/supabase';

export interface PppoePlan {
  id: string;
  name: string;
  price: number;
  downloadKbps: number | null;
  uploadKbps: number | null;
  validityDays: number | null;
  isActive: boolean;
}

export interface PppoePlanInput {
  name: string;
  price: number;
  downloadKbps?: number | null;
  uploadKbps?: number | null;
  validityDays?: number | null;
}

export type PppoeCustomerStatus = 'active' | 'suspended' | 'expired';

export interface PppoeCustomer {
  id: string;
  username: string;
  planName: string | null;
  status: PppoeCustomerStatus;
  startDate: string | null;
  expiryDate: string | null;
  createdAt: string;
}

export interface PppoeCustomerInput {
  username: string;
  packageId: string;
  startDate?: string | null;
  expiryDate?: string | null;
  status?: PppoeCustomerStatus;
}

async function companyId(): Promise<string> {
  const { data, error } = await supabase.rpc('current_company_id');
  if (error) throw error;
  return data as string;
}

export const pppoeService = {
  // ---- Plans ----
  async listPlans(): Promise<PppoePlan[]> {
    const { data, error } = await supabase
      .from('pppoe_packages')
      .select('id, name, price, download_kbps, upload_kbps, validity_days, is_active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      price: Number(r.price),
      downloadKbps: (r.download_kbps as number) ?? null,
      uploadKbps: (r.upload_kbps as number) ?? null,
      validityDays: (r.validity_days as number) ?? null,
      isActive: r.is_active as boolean,
    }));
  },

  async createPlan(input: PppoePlanInput): Promise<void> {
    const { error } = await supabase.from('pppoe_packages').insert({
      company_id: await companyId(),
      name: input.name.trim(),
      price: input.price,
      download_kbps: input.downloadKbps ?? null,
      upload_kbps: input.uploadKbps ?? null,
      validity_days: input.validityDays ?? null,
    });
    if (error) throw error;
  },

  async removePlan(id: string): Promise<void> {
    const { error } = await supabase.from('pppoe_packages').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- Customers ----
  async listCustomers(): Promise<PppoeCustomer[]> {
    const { data, error } = await supabase
      .from('pppoe_customers')
      .select('id, username, status, start_date, expiry_date, created_at, pppoe_packages(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      username: r.username as string,
      planName: (r.pppoe_packages as { name: string } | null)?.name ?? null,
      status: r.status as PppoeCustomerStatus,
      startDate: (r.start_date as string) ?? null,
      expiryDate: (r.expiry_date as string) ?? null,
      createdAt: r.created_at as string,
    }));
  },

  async createCustomer(input: PppoeCustomerInput): Promise<void> {
    const { error } = await supabase.from('pppoe_customers').insert({
      company_id: await companyId(),
      username: input.username.trim(),
      package_id: input.packageId,
      start_date: input.startDate ?? null,
      expiry_date: input.expiryDate ?? null,
      status: input.status ?? 'active',
    });
    if (error) throw error;
  },

  async setCustomerStatus(id: string, status: PppoeCustomerStatus): Promise<void> {
    const { error } = await supabase.from('pppoe_customers').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async removeCustomer(id: string): Promise<void> {
    const { error } = await supabase.from('pppoe_customers').delete().eq('id', id);
    if (error) throw error;
  },
};
