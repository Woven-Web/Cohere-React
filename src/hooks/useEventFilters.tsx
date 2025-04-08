
import { useState, useCallback, useEffect } from 'react';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Happening } from '@/lib/supabase';
import { useLocation } from 'react-router-dom';

// Export the FiltersState type (renamed from EventFilters to avoid confusion)
export interface FiltersState {
  dateRange: DateRange | undefined;
  locationRadius: number | null;
  userLocation: { lat: number; lng: number } | null;
  searchQuery: string;
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
    
    // For other views, don't set a default date range
    return undefined;
  };
  
  const [filters, setFilters] = useState<FiltersState>({
    dateRange: getInitialDateRange(),
    locationRadius: null,
    userLocation: null,
    searchQuery: ''
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
      searchQuery: ''
    });
  }, [location.pathname]);

  const filterEvents = useCallback((events: Happening[], eventGeodata: Record<string, [number, number]> = {}) => {
    const { dateRange, locationRadius, userLocation, searchQuery } = filters;
    
    return events.filter(event => {
      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const eventDate = new Date(event.start_datetime);
        
        if (dateRange.from && dateRange.to) {
          // Set times to midnight for accurate date comparison
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          
          if (eventDate < fromDate || eventDate > toDate) {
            return false;
          }
        } else if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (eventDate < fromDate) return false;
        } else if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (eventDate > toDate) return false;
        }
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
        } else {
          // If we don't have coordinates for this event yet, keep it in the results
          // This allows the app to still show events while geocoding happens
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
