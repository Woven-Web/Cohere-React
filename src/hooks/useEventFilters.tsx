import { useState, useCallback, useEffect } from 'react';
import { addDays, startOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Happening } from '@/lib/supabase';
import { useLocation } from 'react-router-dom';

// Export the FiltersState type (renamed from EventFilters to avoid confusion)
export interface FiltersState {
  dateRange: DateRange | undefined;
  locationRadius: number | null;
  userLocation: { lat: number; lng: number } | null;
  searchQuery: string;
  includePastEvents: boolean; // New filter to explicitly include past events
}

// Function to calculate distance in miles between two coordinates
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  // Haversine formula
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

export const useEventFilters = () => {
  const location = useLocation();
  const isMapView = location.pathname === '/map';
  
  // Initial state depends on the current view
  const getInitialDateRange = (): DateRange | undefined => {
    if (isMapView) {
      // For map view, set default date range to today -> 1 week from now
      const today = new Date();
      const oneWeekFromNow = addDays(today, 7);
      return {
        from: today,
        to: oneWeekFromNow
      };
    }
    
    // For other views, we'll use the includePastEvents flag instead of a date range
    return undefined;
  };
  
  const [filters, setFilters] = useState<FiltersState>({
    dateRange: getInitialDateRange(),
    locationRadius: null,
    userLocation: null,
    searchQuery: '',
    includePastEvents: false // Default to not showing past events
  });

  // Update filters when route changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      dateRange: getInitialDateRange()
    }));
  }, [location.pathname]);

  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: getInitialDateRange(),
      locationRadius: null,
      userLocation: null,
      searchQuery: '',
      includePastEvents: false // Reset to not showing past events
    });
  }, [location.pathname]);

  const filterEvents = useCallback((events: Happening[], eventGeodata: Record<string, [number, number]> = {}) => {
    const { dateRange, locationRadius, userLocation, searchQuery, includePastEvents } = filters;
    
    return events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      
      // Date filtering: First check if we should include past events
      if (!includePastEvents && !dateRange) {
        // When not explicitly including past events and no date range set
        // Filter out events that have already occurred
        const now = new Date();
        if (eventDate < now) {
          return false;
        }
      }

      // Apply selected date range filter if provided
      if (dateRange?.from || dateRange?.to) {
        // Set times to midnight for accurate date comparison
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        if (fromDate) fromDate.setHours(0, 0, 0, 0);
        
        const toDate = dateRange.to ? new Date(dateRange.to) : null;
        if (toDate) toDate.setHours(23, 59, 59, 999);
        
        if (fromDate && eventDate < fromDate) return false;
        if (toDate && eventDate > toDate) return false;
      }
      
      // Location filter
      if (userLocation && locationRadius && event.location) {
        const eventCoords = eventGeodata[event.id];
        if (eventCoords) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            eventCoords[1], // lat
            eventCoords[0]  // lng
          );
          
          if (distance > locationRadius) {
            return false;
          }
        }
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDescription = event.description?.toLowerCase().includes(query);
        const matchesLocation = event.location?.toLowerCase().includes(query);
        
        if (!matchesTitle && !matchesDescription && !matchesLocation) {
          return false;
        }
      }
      
      return true;
    });
  }, [filters]);

  return {
    filters,
    setFilters,
    resetFilters,
    filterEvents
  };
};
