
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { typedDataResponse } from '@/lib/supabase-helpers';

/**
 * A hook for performing Supabase queries with proper typing
 * 
 * @param tableName The table to query
 * @param options Query options
 * @returns Query result object with loading state, data, and error
 */
export function useSupabaseQuery<T>(
  tableName: string,
  options: {
    select?: string;
    filters?: { column: string; value: any; operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' }[];
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
    enabled?: boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { select = '*', filters = [], order, limit, single = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    async function fetchData() {
      try {
        setLoading(true);
        let query = supabase.from(tableName).select(select);

        // Apply filters
        filters.forEach(filter => {
          const { column, value, operator = 'eq' } = filter;
          switch (operator) {
            case 'eq':
              query = query.eq(column, value);
              break;
            case 'neq':
              query = query.neq(column, value);
              break;
            case 'gt':
              query = query.gt(column, value);
              break;
            case 'gte':
              query = query.gte(column, value);
              break;
            case 'lt':
              query = query.lt(column, value);
              break;
            case 'lte':
              query = query.lte(column, value);
              break;
            case 'like':
              query = query.like(column, value);
              break;
            case 'ilike':
              query = query.ilike(column, value);
              break;
          }
        });

        // Apply ordering
        if (order) {
          query = query.order(order.column, { ascending: order.ascending ?? true });
        }

        // Apply limit
        if (limit) {
          query = query.limit(limit);
        }

        // Get single result or multiple
        const response = single ? await query.single() : await query;

        if (response.error) throw response.error;

        // Use our type casting helper
        setData(typedDataResponse<T>(response.data));
        setError(null);
      } catch (error: any) {
        console.error(`Error fetching data from ${tableName}:`, error);
        setError(error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tableName, select, JSON.stringify(filters), order?.column, order?.ascending, limit, single, enabled]);

  return { data, error, loading };
}
