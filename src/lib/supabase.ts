
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please connect your project to Supabase.');
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export type Tables = Database['public']['Tables'];
export type UserProfile = Tables['user_profiles']['Row'];
export type Happening = Tables['happenings']['Row'];
export type ScrapeLog = Tables['scrape_logs']['Row'];
export type CustomInstruction = Tables['custom_instructions']['Row'];
export type UserAttendance = Tables['user_attendance']['Row'];
