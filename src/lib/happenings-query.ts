
import { supabase, Happening } from '@/lib/supabase-client';
import { safeStatus, typedDataResponse, handleDbResponse } from '@/lib/supabase-helpers';

/**
 * Safely query happenings with proper type handling
 */
export async function fetchHappenings(options: {
  status?: 'pending' | 'approved' | 'rejected';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  userId?: string;
  query?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<Happening[]> {
  try {
    let query = supabase
      .from('happenings')
      .select('*');
    
    // Apply filters
    if (options.status) {
      query = query.eq('status', safeStatus(options.status));
    }
    
    if (options.startDate) {
      query = query.gte('start_datetime', options.startDate.toISOString());
    }
    
    if (options.endDate) {
      query = query.lte('start_datetime', options.endDate.toISOString());
    }
    
    if (options.userId) {
      query = query.eq('submitter_user_id', options.userId as any);
    }
    
    if (options.query) {
      query = query.ilike('title', `%${options.query}%`);
    }
    
    // Apply sorting
    const sortBy = options.sortBy || 'start_datetime';
    const sortOrder = options.sortOrder || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const response = await query;
    return typedDataResponse<Happening[]>(response.data) || [];
  } catch (error) {
    console.error('Error in fetchHappenings:', error);
    return [];
  }
}

/**
 * Fetch a single happening by ID with proper error handling
 */
export async function fetchHappeningById(id: string): Promise<Happening | null> {
  try {
    const response = await supabase
      .from('happenings')
      .select('*')
      .eq('id', id as any)
      .maybeSingle();
    
    if (response.error) {
      console.error('Error fetching happening by ID:', response.error);
      return null;
    }
    
    return typedDataResponse<Happening>(response.data);
  } catch (error) {
    console.error('Error in fetchHappeningById:', error);
    return null;
  }
}
