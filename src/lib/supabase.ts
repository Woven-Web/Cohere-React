
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Use the values from the automatically generated client
import { supabase as generatedClient } from '@/integrations/supabase/client';

// Export the pre-configured client from the integrations folder
export const supabase = generatedClient;

// Re-export the types for convenience
export type Tables = Database['public']['Tables'];
export type UserProfile = Tables['user_profiles']['Row'];
export type Happening = Tables['happenings']['Row'];
export type ScrapeLog = Tables['scrape_logs']['Row'];
export type CustomInstruction = Tables['custom_instructions']['Row'];
export type UserAttendance = Tables['user_attendance']['Row'];
