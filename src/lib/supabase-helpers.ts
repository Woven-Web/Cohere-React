
/**
 * Helper functions to safely work with Supabase
 */
import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import { Tables } from './supabase-client';

/**
 * Type-guard to check if a response is an error
 */
export function isPostgrestError(obj: any): obj is PostgrestError {
  return obj && typeof obj === 'object' && 'code' in obj && 'message' in obj;
}

/**
 * Type assertion for Supabase query responses
 * This helps handle the complex type issues with Supabase's GetResult types
 */
export function typedDataResponse<T>(data: any): T {
  return data as T;
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
  response: { data: any; error: PostgrestError | null },
  defaultValue: T
): T {
  if (response.error) {
    console.error(`Error in ${operation}:`, response.error);
    return defaultValue;
  }
  return typedDataResponse<T>(response.data) || defaultValue;
}

/**
 * Helper for safely handling single responses
 */
export function handleSingleResponse<T>(
  response: PostgrestSingleResponse<any>,
  defaultValue: T | null = null
): T | null {
  if (response.error) {
    console.error('Database query error:', response.error);
    return defaultValue;
  }
  return typedDataResponse<T>(response.data);
}

/**
 * Helper function to safely convert string IDs for database queries
 */
export function safeId(id: string): any {
  return id;
}

/**
 * Helper function to safely convert string enum values for database queries
 */
export function safeStatus(status: 'pending' | 'approved' | 'rejected'): any {
  return status;
}

/**
 * Helper to create typesafe insert objects
 */
export function createInsertData<T extends keyof Tables>(
  _table: T,
  data: Tables[T]['Insert']
): any {
  return data;
}

/**
 * Helper to create typesafe update objects
 */
export function createUpdateData<T extends keyof Tables>(
  _table: T,
  data: Tables[T]['Update']
): any {
  return data;
}
