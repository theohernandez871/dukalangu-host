import { supabase } from '@/lib/supabase';

export interface ReportSummary {
  totalSales: number;
  paymentCount: number;
  voucherCount: number;
  customerCount: number;
  activeRouters: number;
}

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}

export const reportService = {
  async summary(range: DateRange): Promise<ReportSummary> {
    const { data, error } = await supabase.rpc('report_summary', { p_from: range.from, p_to: range.to });
    if (error) throw error;
    const r = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
    return {
      totalSales: Number(r?.total_sales ?? 0),
      paymentCount: Number(r?.payment_count ?? 0),
      voucherCount: Number(r?.voucher_count ?? 0),
      customerCount: Number(r?.customer_count ?? 0),
      activeRouters: Number(r?.active_routers ?? 0),
    };
  },

  async paymentsInRange(range: DateRange): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('created_at, amount, method, status, reference')
      .eq('status', 'successful')
      .gte('created_at', `${range.from}T00:00:00`)
      .lte('created_at', `${range.to}T23:59:59`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Record<string, unknown>[];
  },
};

/** Build a CSV string from rows + trigger a browser download. */
export function exportCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
