import { supabase } from '@/lib/supabase';

export type VoucherStatus = 'unused' | 'active' | 'used' | 'expired' | 'cancelled';

export interface Voucher {
  id: string;
  code: string;
  packageName: string | null;
  price: number;
  status: VoucherStatus;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
}

export interface GenerateInput {
  packageId: string;
  quantity: number;
  prefix?: string;
  price?: number | null;
}

interface Row {
  id: string;
  code: string;
  price: number;
  status: VoucherStatus;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  hotspot_packages: { name: string } | null;
}

function map(r: Row): Voucher {
  return {
    id: r.id,
    code: r.code,
    packageName: r.hotspot_packages?.name ?? null,
    price: Number(r.price),
    status: r.status,
    createdAt: r.created_at,
    activatedAt: r.activated_at,
    expiresAt: r.expires_at,
  };
}

export const voucherService = {
  async list(status?: VoucherStatus): Promise<Voucher[]> {
    let q = supabase
      .from('vouchers')
      .select('id, code, price, status, created_at, activated_at, expires_at, hotspot_packages(name)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as unknown as Row[]).map(map);
  },

  async generate(input: GenerateInput): Promise<string> {
    const { data, error } = await supabase.rpc('generate_vouchers', {
      p_package_id: input.packageId,
      p_quantity: input.quantity,
      p_prefix: input.prefix ?? '',
      p_price: input.price ?? null,
    });
    if (error) throw error;
    return data as string; // batch id
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase.from('vouchers').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
  },

  async listByBatch(batchId: string): Promise<Voucher[]> {
    const { data, error } = await supabase
      .from('vouchers')
      .select('id, code, price, status, created_at, activated_at, expires_at, hotspot_packages(name)')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as Row[]).map(map);
  },
};
