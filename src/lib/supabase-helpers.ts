
/**
 * Helper functions to safely work with Supabase
 */
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Type-guard to check if a response is an error
 */
export function isPostgrestError(obj: any): obj is PostgrestError {
  return obj && typeof obj === 'object' && 'code' in obj && 'message' in obj;
}

/**
 * Safely handle Supabase database responses, with proper error handling
 * @param operation The name of the operation (for logging)
 * @param response The database response
 * @param defaultValue Default value to return in case of error
 * @returns The data or defaultValue if error
 */
export function handleDbResponse<T>(
  operation: string,
  response: { data: T | null; error: PostgrestError | null },
  defaultValue: T
): T {
  if (response.error) {
    console.error(`Error in ${operation}:`, response.error);
    return defaultValue;
  }
  return response.data || defaultValue;
}

/**
 * Type assertion helper for Supabase operations
 * This is used when TypeScript doesn't correctly infer types
 */
export function asDbType<T>(data: any): T {
  return data as T;
}
