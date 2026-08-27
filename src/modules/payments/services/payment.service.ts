import { supabase } from '@/lib/supabase';

export type PaymentMethod = 'cash' | 'mpesa' | 'airtel' | 'tigo' | 'halopesa' | 'card' | 'other';
export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'cancelled' | 'refunded';

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  status: PaymentStatus;
  description: string | null;
  createdAt: string;
}

export interface PaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  description?: string;
  customerId?: string | null;
  status?: PaymentStatus;
}

export interface RevenueSummary {
  today: number;
  thisMonth: number;
  total: number;
  withdrawn: number;
  remaining: number;
}

interface Row {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  status: PaymentStatus;
  description: string | null;
  created_at: string;
}

function map(r: Row): Payment {
  return {
    id: r.id,
    amount: Number(r.amount),
    method: r.method,
    reference: r.reference,
    status: r.status,
    description: r.description,
    createdAt: r.created_at,
  };
}

async function companyId(): Promise<string> {
  const { data, error } = await supabase.rpc('current_company_id');
  if (error) throw error;
  return data as string;
}

export const paymentService = {
  async list(status?: PaymentStatus): Promise<Payment[]> {
    let q = supabase
      .from('payments')
      .select('id, amount, method, reference, status, description, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as Row[]).map(map);
  },

  async record(input: PaymentInput): Promise<void> {
    const { error } = await supabase.from('payments').insert({
      company_id: await companyId(),
      customer_id: input.customerId ?? null,
      amount: input.amount,
      method: input.method,
      reference: input.reference ?? null,
      description: input.description ?? null,
      status: input.status ?? 'successful',
    });
    if (error) throw error;
  },

  async setStatus(id: string, status: PaymentStatus): Promise<void> {
    const { error } = await supabase.from('payments').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async summary(): Promise<RevenueSummary> {
    const { data, error } = await supabase.rpc('revenue_summary');
    if (error) throw error;
    const r = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
    return {
      today: Number(r?.today ?? 0),
      thisMonth: Number(r?.this_month ?? 0),
      total: Number(r?.total ?? 0),
      withdrawn: Number(r?.withdrawn ?? 0),
      remaining: Number(r?.remaining ?? 0),
    };
  },
};
