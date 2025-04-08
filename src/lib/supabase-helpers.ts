
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

/**
 * Helper function to safely convert string IDs for database queries
 * This helps prevent TypeScript errors when using string IDs with Supabase
 */
export function safeId(id: string): unknown {
  return id as unknown;
}

/**
 * Helper function to safely convert string enum values for database queries
 */
export function safeEnumValue<T extends string>(value: T): unknown {
  return value as unknown;
}

/**
 * Helper to convert query parameter string to database enum
 */
export function safeStatus(status: 'pending' | 'approved' | 'rejected'): unknown {
  return status as unknown;
}

/**
 * Helper to safely handle single responses
 */
export function handleSingleResponse<T extends object>(
  response: PostgrestSingleResponse<T>,
  defaultValue: T | null = null
): T | null {
  if (response.error) {
    console.error('Database query error:', response.error);
    return defaultValue;
  }
  return response.data;
}

/**
 * Helper for creating type-safe insert data
 */
export function createInsertData<T extends keyof Tables>(
  table: T,
  data: Tables[T]['Insert']
): Tables[T]['Insert'] {
  return data;
}

/**
 * Helper for creating type-safe update data
 */
export function createUpdateData<T extends keyof Tables>(
  table: T,
  data: Tables[T]['Update']
): Tables[T]['Update'] {
  return data;
}
