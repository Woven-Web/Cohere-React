
-- Row Level Security (RLS) policies for all tables
-- Created: 2025-04-07

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile except role"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (
      OLD.role = NEW.role OR 
      public.is_admin_user(auth.uid())
    )
  );

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update any profile"
  ON public.user_profiles
  FOR UPDATE
  USING (public.is_admin_user(auth.uid()));

-- RLS policies for happenings
CREATE POLICY "Anyone can view approved happenings"
  ON public.happenings
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view happenings they submitted"
  ON public.happenings
  FOR SELECT
  USING (submitter_user_id = auth.uid());

CREATE POLICY "Curators and admins can view all happenings"
  ON public.happenings
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('curator', 'admin')
  );

CREATE POLICY "Submitters can create happenings with pending status"
  ON public.happenings
  FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('submitter', 'curator', 'admin') AND
    submitter_user_id = auth.uid()
  );

CREATE POLICY "Curators and admins can update happenings"
  ON public.happenings
  FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('curator', 'admin')
  );

CREATE POLICY "Submitters can update their own happenings if still pending"
  ON public.happenings
  FOR UPDATE
  USING (
    submitter_user_id = auth.uid() AND
    status = 'pending' AND
    public.get_user_role(auth.uid()) IN ('submitter', 'curator', 'admin')
  );

-- RLS policies for scrape_logs
CREATE POLICY "Users can view logs they requested"
  ON public.scrape_logs
  FOR SELECT
  USING (
    requested_by_user_id = auth.uid() AND
    public.get_user_role(auth.uid()) IN ('submitter', 'curator', 'admin')
  );

CREATE POLICY "Admins can view all logs"
  ON public.scrape_logs
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Users can report bad scrapes they requested"
  ON public.scrape_logs
  FOR UPDATE
  USING (
    requested_by_user_id = auth.uid() AND
    public.get_user_role(auth.uid()) IN ('submitter', 'curator', 'admin')
  )
  WITH CHECK (
    requested_by_user_id = auth.uid() AND
    public.get_user_role(auth.uid()) IN ('submitter', 'curator', 'admin') AND
    (OLD.is_reported_bad IS DISTINCT FROM NEW.is_reported_bad) AND
    OLD.raw_llm_response IS NOT DISTINCT FROM NEW.raw_llm_response AND
    OLD.parsed_event_data IS NOT DISTINCT FROM NEW.parsed_event_data AND
    OLD.error_message IS NOT DISTINCT FROM NEW.error_message AND
    OLD.requested_by_user_id IS NOT DISTINCT FROM NEW.requested_by_user_id AND
    OLD.url_scraped IS NOT DISTINCT FROM NEW.url_scraped AND
    OLD.custom_instruction_id_used IS NOT DISTINCT FROM NEW.custom_instruction_id_used AND
    OLD.playwright_flag_used IS NOT DISTINCT FROM NEW.playwright_flag_used
  );

-- RLS policies for custom_instructions
CREATE POLICY "Anyone can view active custom instructions"
  ON public.custom_instructions
  FOR SELECT
  USING (
    is_active = true
  );

CREATE POLICY "Admins can view all custom instructions"
  ON public.custom_instructions
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage custom instructions"
  ON public.custom_instructions
  FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- RLS policies for user_attendance
CREATE POLICY "Users can view all attendance records"
  ON public.user_attendance
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own attendance"
  ON public.user_attendance
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policies for event_flags
CREATE POLICY "Users can create event flags"
  ON public.event_flags
  FOR INSERT
  WITH CHECK (
    flagger_user_id = auth.uid()
  );

CREATE POLICY "Users can view their own flags"
  ON public.event_flags
  FOR SELECT
  USING (
    flagger_user_id = auth.uid()
  );

CREATE POLICY "Curators and admins can view all flags"
  ON public.event_flags
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('curator', 'admin')
  );

CREATE POLICY "Curators and admins can resolve flags"
  ON public.event_flags
  FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) IN ('curator', 'admin')
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('curator', 'admin') AND
    NEW.resolved_by_user_id = auth.uid() AND
    NEW.status IN ('resolved', 'rejected')
  );
