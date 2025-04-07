
-- Initial schema setup for Cohere Community Calendar
-- Created: 2025-04-07

-- user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'basic' CHECK (role IN ('basic', 'submitter', 'curator', 'admin')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- happenings table
CREATE TABLE IF NOT EXISTS public.happenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  location TEXT,
  source_url TEXT,
  submitter_user_id UUID NOT NULL,
  scrape_log_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create indexes on happenings
CREATE INDEX IF NOT EXISTS happenings_start_datetime_idx ON public.happenings(start_datetime);
CREATE INDEX IF NOT EXISTS happenings_status_idx ON public.happenings(status);
CREATE INDEX IF NOT EXISTS happenings_submitter_user_id_idx ON public.happenings(submitter_user_id);

-- scrape_logs table
CREATE TABLE IF NOT EXISTS public.scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_by_user_id UUID NOT NULL,
  url_scraped TEXT NOT NULL,
  custom_instruction_id_used UUID,
  playwright_flag_used BOOLEAN NOT NULL,
  raw_llm_response JSONB,
  parsed_event_data JSONB,
  is_reported_bad BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT
);

-- Create indexes on scrape_logs
CREATE INDEX IF NOT EXISTS scrape_logs_created_at_idx ON public.scrape_logs(created_at);
CREATE INDEX IF NOT EXISTS scrape_logs_requested_by_user_id_idx ON public.scrape_logs(requested_by_user_id);
CREATE INDEX IF NOT EXISTS scrape_logs_url_scraped_idx ON public.scrape_logs(url_scraped);
CREATE INDEX IF NOT EXISTS scrape_logs_is_reported_bad_idx ON public.scrape_logs(is_reported_bad);

-- custom_instructions table
CREATE TABLE IF NOT EXISTS public.custom_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  url_pattern TEXT NOT NULL UNIQUE,
  use_playwright BOOLEAN NOT NULL DEFAULT false,
  instructions_text TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes on custom_instructions
CREATE INDEX IF NOT EXISTS custom_instructions_url_pattern_idx ON public.custom_instructions(url_pattern);
CREATE INDEX IF NOT EXISTS custom_instructions_priority_idx ON public.custom_instructions(priority);
CREATE INDEX IF NOT EXISTS custom_instructions_is_active_idx ON public.custom_instructions(is_active);

-- user_attendance table
CREATE TABLE IF NOT EXISTS public.user_attendance (
  user_id UUID NOT NULL,
  happening_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, happening_id)
);

-- Create index on user_attendance
CREATE INDEX IF NOT EXISTS user_attendance_user_id_idx ON public.user_attendance(user_id);

-- event_flags table
CREATE TABLE IF NOT EXISTS public.event_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  happening_id UUID NOT NULL,
  flagger_user_id UUID NOT NULL,
  changes_requested TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_by_user_id UUID,
  resolved_at TIMESTAMPTZ
);

-- Create foreign key relationships
ALTER TABLE IF EXISTS public.happenings
  ADD CONSTRAINT happenings_scrape_log_id_fkey
  FOREIGN KEY (scrape_log_id) REFERENCES public.scrape_logs(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.scrape_logs
  ADD CONSTRAINT scrape_logs_custom_instruction_id_used_fkey
  FOREIGN KEY (custom_instruction_id_used) REFERENCES public.custom_instructions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.user_attendance
  ADD CONSTRAINT user_attendance_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT user_attendance_happening_id_fkey
  FOREIGN KEY (happening_id) REFERENCES public.happenings(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.event_flags
  ADD CONSTRAINT event_flags_happening_id_fkey
  FOREIGN KEY (happening_id) REFERENCES public.happenings(id) ON DELETE CASCADE;

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.happenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_flags ENABLE ROW LEVEL SECURITY;
