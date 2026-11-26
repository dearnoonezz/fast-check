import { createClient } from '@supabase/supabase-js';
const url = import.meta.env['VITE_SUPABASE_URL'];
const key = import.meta.env['VITE_SUPABASE_ANON_KEY'];
export const cloud = url && key ? createClient(url, key) : null;
export type Profile = { user_id: string; first_name: string; last_name: string; rp_id: string; role: 'owner'|'manager'|'member'; active: boolean };
export const emailFor = (id: string) => `rp-${id.trim()}@craftfood.invalid`;
