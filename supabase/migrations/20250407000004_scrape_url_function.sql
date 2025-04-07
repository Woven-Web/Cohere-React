
-- Edge Function Configuration for scrapeUrl
-- Created: 2025-04-07

-- This migration just documents the edge function configuration
-- The actual implementation is in supabase/functions/scrapeUrl/index.ts

COMMENT ON SCHEMA supabase_functions IS 'Edge function schema containing scrapeUrl function';

-- Create a comment to document the required secrets
COMMENT ON SCHEMA supabase_functions IS $$
Required secrets for scrapeUrl function:
- PYTHON_API_URL: Full URL of the Python API endpoint
- GEMINI_API_KEY: API key for the Gemini LLM
- EDGE_SERVICE_ROLE_KEY: Supabase project service role key
$$;
