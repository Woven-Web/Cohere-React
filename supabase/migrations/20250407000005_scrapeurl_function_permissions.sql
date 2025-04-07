
-- Permissions for the scrapeUrl function
-- Created: 2025-04-07

-- Since Edge Functions are managed outside of PostgreSQL,
-- this migration documents the required permissions and settings

COMMENT ON SCHEMA supabase_functions IS $$
scrapeUrl function permissions:
- Authentication: JWT verification enabled
- Minimum user role: 'submitter'
- HTTP method: POST
- Expects JSON body with URL
- Returns JSON with scrape results
$$;

-- Note: The actual function implementation is in supabase/functions/scrapeUrl/index.ts
-- And configuration is in supabase/config.toml with:
-- [functions.scrapeUrl]
-- verify_jwt = true
