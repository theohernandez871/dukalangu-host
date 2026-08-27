import { supabase } from '@/lib/supabase';

export type Audience = 'all' | 'hotspot' | 'pppoe' | 'agents';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  sentAt: string | null;
  createdAt: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  audience: Audience;
}

export interface SmsMessage {
  id: string;
  recipient: string;
  body: string;
  status: string;
  createdAt: string;
}

async function companyId(): Promise<string> {
  const { data, error } = await supabase.rpc('current_company_id');
  if (error) throw error;
  return data as string;
}

export const smsService = {
  async listAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, audience, sent_at, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      body: r.body as string,
      audience: r.audience as Audience,
      sentAt: (r.sent_at as string) ?? null,
      createdAt: r.created_at as string,
    }));
  },

  async createAnnouncement(input: AnnouncementInput): Promise<void> {
    const { error } = await supabase.from('announcements').insert({
      company_id: await companyId(),
      title: input.title.trim(),
      body: input.body.trim(),
      audience: input.audience,
      sent_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  async removeAnnouncement(id: string): Promise<void> {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
  },

  async history(): Promise<SmsMessage[]> {
    const { data, error } = await supabase
      .from('sms_messages')
      .select('id, recipient, body, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      recipient: r.recipient as string,
      body: r.body as string,
      status: r.status as string,
      createdAt: r.created_at as string,
    }));
  },

  async balance(): Promise<number> {
    const { data, error } = await supabase.from('sms_balance').select('balance').maybeSingle();
    if (error) return 0;
    return Number((data as { balance: number } | null)?.balance ?? 0);
  },
};
