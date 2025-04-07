
# Supabase Migrations

This directory contains SQL migrations for the Cohere Community Calendar Supabase backend.

Each migration file follows the format: `YYYYMMDDHHMMSS_description.sql` 

## Running Migrations

These migrations can be run with the Supabase CLI:

```bash
supabase db reset
```

Or individually:

```bash
supabase db push
```

## Migration Versions

- 20250407000000_initial_schema.sql - Initial database schema setup
- 20250407000001_auth_trigger.sql - User authentication trigger setup
- 20250407000002_helper_functions.sql - Database helper functions
- 20250407000003_rls_policies.sql - Row level security policies
