
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { typedDataResponse } from '@/lib/supabase-helpers';
import { PostgrestError } from '@supabase/supabase-js';

// Valid table names for type safety
type TableNames = 'custom_instructions' | 'event_flags' | 'happenings' | 'scrape_logs' | 'user_attendance' | 'user_profiles';

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';

interface QueryFilter {
  column: string;
  value: any;
  operator?: FilterOperator;
}

interface QueryOptions {
  select?: string;
  filters?: QueryFilter[];
  order?: { column: string; ascending?: boolean };
  limit?: number;
  single?: boolean;
  enabled?: boolean;
}

/**
 * A hook for performing Supabase queries with proper typing
 */
export function useSupabaseQuery<T>(
  tableName: TableNames,
  options: QueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { select = '*', filters = [], order, limit, single = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    async function fetchData() {
      try {
        setLoading(true);
        
        // Cast tableName as any to avoid TypeScript complexity
        const query = supabase.from(tableName as any).select(select);

        // Apply filters
        filters.forEach(filter => {
          const { column, value, operator = 'eq' } = filter;
          
          // Cast query as any to avoid excessive type depth
          let nextQuery = query as any;
          
          switch (operator) {
            case 'eq':
              nextQuery = nextQuery.eq(column, value);
              break;
            case 'neq':
              nextQuery = nextQuery.neq(column, value);
              break;
            case 'gt':
              nextQuery = nextQuery.gt(column, value);
              break;
            case 'gte':
              nextQuery = nextQuery.gte(column, value);
              break;
            case 'lt':
              nextQuery = nextQuery.lt(column, value);
              break;
            case 'lte':
              nextQuery = nextQuery.lte(column, value);
              break;
            case 'like':
              nextQuery = nextQuery.like(column, value);
              break;
            case 'ilike':
              nextQuery = nextQuery.ilike(column, value);
              break;
          }
        });

        // Apply ordering
        if (order) {
          (query as any).order(order.column, { ascending: order.ascending ?? true });
        }

        // Apply limit
        if (limit) {
          (query as any).limit(limit);
        }

        // Get single result or multiple
        const response = single ? await (query as any).single() : await query;

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
