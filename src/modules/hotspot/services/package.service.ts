import { supabase } from '@/lib/supabase';

export interface Package {
  id: string;
  name: string;
  price: number;
  durationMinutes: number | null;
  validityDays: number | null;
  downloadKbps: number | null;
  uploadKbps: number | null;
  dataLimitMb: number | null;
  sharedUsers: number;
  isActive: boolean;
}

export interface PackageInput {
  name: string;
  price: number;
  durationMinutes?: number | null;
  validityDays?: number | null;
  downloadKbps?: number | null;
  uploadKbps?: number | null;
  dataLimitMb?: number | null;
  sharedUsers?: number;
}

interface Row {
  id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
  validity_days: number | null;
  download_kbps: number | null;
  upload_kbps: number | null;
  data_limit_mb: number | null;
  shared_users: number;
  is_active: boolean;
}

function map(r: Row): Package {
  return {
    id: r.id,
    name: r.name,
    price: Number(r.price),
    durationMinutes: r.duration_minutes,
    validityDays: r.validity_days,
    downloadKbps: r.download_kbps,
    uploadKbps: r.upload_kbps,
    dataLimitMb: r.data_limit_mb,
    sharedUsers: r.shared_users,
    isActive: r.is_active,
  };
}

async function companyId(): Promise<string> {
  const { data, error } = await supabase.rpc('current_company_id');
  if (error) throw error;
  return data as string;
}

export const packageService = {
  async list(): Promise<Package[]> {
    const { data, error } = await supabase
      .from('hotspot_packages')
      .select('id, name, price, duration_minutes, validity_days, download_kbps, upload_kbps, data_limit_mb, shared_users, is_active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Row[]).map(map);
  },

  async create(input: PackageInput): Promise<void> {
    const { error } = await supabase.from('hotspot_packages').insert({
      company_id: await companyId(),
      name: input.name,
      price: input.price,
      duration_minutes: input.durationMinutes ?? null,
      validity_days: input.validityDays ?? null,
      download_kbps: input.downloadKbps ?? null,
      upload_kbps: input.uploadKbps ?? null,
      data_limit_mb: input.dataLimitMb ?? null,
      shared_users: input.sharedUsers ?? 1,
    });
    if (error) throw error;
  },

  async update(id: string, input: Partial<PackageInput>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.price !== undefined) patch.price = input.price;
    if (input.durationMinutes !== undefined) patch.duration_minutes = input.durationMinutes;
    if (input.validityDays !== undefined) patch.validity_days = input.validityDays;
    if (input.downloadKbps !== undefined) patch.download_kbps = input.downloadKbps;
    if (input.uploadKbps !== undefined) patch.upload_kbps = input.uploadKbps;
    if (input.dataLimitMb !== undefined) patch.data_limit_mb = input.dataLimitMb;
    if (input.sharedUsers !== undefined) patch.shared_users = input.sharedUsers;
    const { error } = await supabase.from('hotspot_packages').update(patch).eq('id', id);
    if (error) throw error;
  },

  async setActive(id: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('hotspot_packages').update({ is_active: active }).eq('id', id);
    if (error) throw error;
  },

  async duplicate(pkg: Package): Promise<void> {
    await this.create({
      name: `${pkg.name} (nakala)`,
      price: pkg.price,
      durationMinutes: pkg.durationMinutes,
      validityDays: pkg.validityDays,
      downloadKbps: pkg.downloadKbps,
      uploadKbps: pkg.uploadKbps,
      dataLimitMb: pkg.dataLimitMb,
      sharedUsers: pkg.sharedUsers,
    });
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('hotspot_packages').delete().eq('id', id);
    if (error) throw error;
  },
};
