
import React, { useEffect, useState } from 'react';
import { supabase, Happening } from '@/lib/supabase';
import EventCard from '@/components/events/EventCard';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import EventFiltersBar from '@/components/events/EventFiltersBar';
import { useEventFilters } from '@/hooks/useEventFilters';

const EventList = () => {
  const [events, setEvents] = useState<Happening[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventCoordinates, setEventCoordinates] = useState<Record<string, [number, number]>>({});
  const { filters, setFilters, resetFilters, filterEvents } = useEventFilters();

  useEffect(() => {
    fetchEvents();
  }, [filters.includePastEvents]); // Refetch when includePastEvents changes

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('happenings')
        .select('*')
        .eq('status', 'approved')
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      
      // Apply default filter for past events if not explicitly included
      let processedEvents = data || [];
      if (!filters.includePastEvents) {
        const now = new Date();
        processedEvents = processedEvents.filter(event => {
          // Check if the event has ended (using end_datetime if available, otherwise use start_datetime)
          const eventEndTime = event.end_datetime ? new Date(event.end_datetime) : new Date(event.start_datetime);
          return eventEndTime >= now;
        });
      }
      
      setEvents(processedEvents);
      processEventLocations(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process event locations for distance filtering
  const processEventLocations = async (events: Happening[]) => {
    if (!filters.userLocation) return;
    
    const coordinatesMap: Record<string, [number, number]> = {};
    await Promise.all(events.map(async (event) => {
      if (!event.location) return;
      
      try {
        // Simple geocoding simulation - in a real app, use a geocoding service
        // This is a placeholder for demonstration
        const parts = event.location.split(',');
        if (parts.length >= 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            coordinatesMap[event.id] = [lng, lat];
          }
        }
      } catch (error) {
        console.error(`Error processing location for event ${event.id}:`, error);
      }
    }));
    
    setEventCoordinates(coordinatesMap);
  };

  // Apply filters to events
  const filteredEvents = filterEvents(events, eventCoordinates);

  const renderSkeleton = () => {
    return Array(3).fill(0).map((_, index) => (
      <div key={index} className="event-card">
        <div className="p-5">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </div>
    ));
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">Discover Events</h1>
        <p className="text-muted-foreground">
          Find and join happenings in your community
        </p>
      </div>

      {/* Use our reusable filters component */}
      <div className="mb-6">
        <EventFiltersBar 
          filters={filters}
          setFilters={setFilters}
          onReset={resetFilters}
          inline={true}
          showPastEventsFilter={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          renderSkeleton()
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No events found</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
            <Button className="mt-4" variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
