import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!url || !anonKey) {
  console.error('[config] VITE_SUPABASE_URL au VITE_SUPABASE_ANON_KEY haipo.');
} else if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url)) {
  console.error(`[config] VITE_SUPABASE_URL haionekani sahihi: ${url}`);
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
});
