
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Use the values from the automatically generated client
const SUPABASE_URL = "https://zdngnhaxibiplkdyfoiy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbmduaGF4aWJpcGxrZHlmb2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzc2MTksImV4cCI6MjA1OTYxMzYxOX0.Ei5H9FieonbikNYIs3QT91vhF5B5ABt0FQiNGXCg89o";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY
);

// Re-export the types for convenience
export type Tables = Database['public']['Tables'];
export type UserProfile = Tables['user_profiles']['Row'];
export type Happening = Tables['happenings']['Row'];
export type ScrapeLog = Tables['scrape_logs']['Row'];
export type CustomInstruction = Tables['custom_instructions']['Row'];
export type UserAttendance = Tables['user_attendance']['Row'];
export type EventFlag = Tables['event_flags']['Row'];

// Type for table insert operations
export type HappeningInsert = Tables['happenings']['Insert'];
export type UserAttendanceInsert = Tables['user_attendance']['Insert'];
export type ScrapeLogInsert = Tables['scrape_logs']['Insert'];
export type EventFlagInsert = Tables['event_flags']['Insert'];

// Type for table update operations
export type HappeningUpdate = Tables['happenings']['Update'];
export type UserAttendanceUpdate = Tables['user_attendance']['Update'];
export type ScrapeLogUpdate = Tables['scrape_logs']['Update'];
export type EventFlagUpdate = Tables['event_flags']['Update'];
