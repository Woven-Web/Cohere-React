import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase, Happening } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMapboxToken } from '@/hooks/useMapboxToken';

interface EventWithCoordinates extends Happening {
  coordinates?: [number, number];
}

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [events, setEvents] = useState<EventWithCoordinates[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [validating, setValidating] = useState(false);
  const { token, setToken, isValid, validateToken } = useMapboxToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (isValid) {
      fetchEvents();
    }
  }, [isValid]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('happenings')
        .select('*')
        .eq('status', 'approved');
      
      if (error) throw error;
      
      const eventsWithCoordinates = await Promise.all((data || []).map(processEventLocation));
      setEvents(eventsWithCoordinates);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const processEventLocation = async (event: Happening): Promise<EventWithCoordinates> => {
    if (!event.location || !token) return event;
    
    try {
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(event.location)}.json?access_token=${token}&limit=1`;
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return {
          ...event,
          coordinates: [lng, lat]
        };
      }
    } catch (error) {
      console.error(`Error geocoding location for event ${event.id}:`, error);
    }
    
    return event;
  };

  useEffect(() => {
    if (!mapContainer.current || !events.length || !token || !isValid) return;
    
    if (!map.current) {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.5, 40],
        zoom: 2
      });
      
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        setMapLoaded(true);
      });
    }
    
    if (mapLoaded && events.length > 0) {
      addMarkersToMap();
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [events, mapLoaded, token, isValid]);
  
  const addMarkersToMap = () => {
    if (!map.current) return;
    
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    const validCoordinates: mapboxgl.LngLatLike[] = [];
    
    events.forEach(event => {
      if (event.coordinates) {
        const [lng, lat] = event.coordinates;
        
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = '<div class="marker-pin bg-yellow-500 w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>';
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current);
          
        marker.getElement().addEventListener('click', () => {
          setSelectedEvent(event);
        });
        
        markers.current.push(marker);
        validCoordinates.push([lng, lat]);
      }
    });
    
    if (validCoordinates.length > 0) {
      const bounds = validCoordinates.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new mapboxgl.LngLatBounds(validCoordinates[0] as [number, number], validCoordinates[0] as [number, number])
      );
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  };
  
  const navigateToEvent = (id: string) => {
    navigate(`/event/${id}`);
  };
  
  const formatEventDate = (date: string) => {
    return format(new Date(date), 'MMMM d, yyyy h:mm a');
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    
    setValidating(true);
    try {
      const isValid = await validateToken(tokenInput);
      if (isValid) {
        setToken(tokenInput);
        setTokenInput('');
      }
    } finally {
      setValidating(false);
    }
  };

  const renderEventList = () => {
    if (loading) {
      return Array(3).fill(0).map((_, index) => (
        <Card key={index} className="mb-4">
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ));
    }

    if (events.length === 0) {
      return (
        <Card className="text-center p-6">
          <p className="text-muted-foreground">No events found</p>
        </Card>
      );
    }

    return events.map(event => (
      <Card 
        key={event.id} 
        className={`mb-4 cursor-pointer transition-all hover:shadow-md ${selectedEvent?.id === event.id ? 'ring-2 ring-yellow-500 shadow-lg' : ''}`}
        onClick={() => {
          setSelectedEvent(event);
          if (event.coordinates && map.current) {
            map.current.flyTo({
              center: event.coordinates,
              zoom: 14
            });
          }
        }}
      >
        <CardContent className="p-4">
          <h3 className="font-semibold mb-1 line-clamp-1">{event.title}</h3>
          <div className="flex items-center text-sm text-muted-foreground mb-1">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{formatEventDate(event.start_datetime)}</span>
          </div>
          {event.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };

  if (!token || !isValid) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Event Map</h1>
          <p className="text-muted-foreground mb-6">
            Discover events by location
          </p>
          
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Mapbox API Key Required</AlertTitle>
            <AlertDescription>
              To view the map, you need to provide your Mapbox API key. 
              Get one for free at <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a>.
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">Mapbox Access Token</Label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1Ijoi..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="font-mono text-sm"
                required
              />
            </div>
            <Button type="submit" disabled={validating}>
              {validating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Set API Key & Load Map'
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Event Map</h1>
        <p className="text-muted-foreground">
          Discover events by location
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
        <div className="lg:col-span-1 h-full">
          <ScrollArea className="h-full pr-4">
            {renderEventList()}
          </ScrollArea>
        </div>

        <div className="lg:col-span-2 h-full flex flex-col">
          <div className="relative flex-grow rounded-lg overflow-hidden border">
            <div ref={mapContainer} className="absolute inset-0" />
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p>Loading map...</p>
                </div>
              </div>
            )}
            
            {selectedEvent && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/90 border-t">
                <h3 className="font-semibold mb-1">{selectedEvent.title}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatEventDate(selectedEvent.start_datetime)}</span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Close
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => navigateToEvent(selectedEvent.id)}
                  >
                    <Navigation className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
