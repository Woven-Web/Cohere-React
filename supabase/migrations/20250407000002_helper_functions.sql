
-- Helper functions for the Cohere Community Calendar
-- Created: 2025-04-07

-- Create get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_profiles WHERE id = user_id;
$$;

-- Create is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Create can_update_profile function
CREATE OR REPLACE FUNCTION public.can_update_profile(user_id uuid, target_user_id uuid, new_role text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_role TEXT;
BEGIN
  -- Get the current role from the profile being updated
  SELECT role INTO current_role FROM public.user_profiles WHERE id = target_user_id;
  
  -- User can update their own profile except for role
  IF user_id = target_user_id AND new_role = current_role THEN
    RETURN TRUE;
  END IF;
  
  -- Admin can update any profile including role
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;
