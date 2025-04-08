
/**
 * Helper functions for dealing with Supabase response types
 */

/**
 * Cast any Supabase response to the expected type
 * This is needed to work around TypeScript type issues with Supabase responses
 */
export function castResponseData<T>(data: any): T {
  return data as T;
}
