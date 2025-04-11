
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, X, Search, History } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { FiltersState } from '@/hooks/useEventFilters';

interface EventFiltersBarProps {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  onReset: () => void;
  className?: string;
  showDateFilter?: boolean;
  showLocationFilter?: boolean;
  showSearchFilter?: boolean;
  showPastEventsFilter?: boolean;
  inline?: boolean;
}

const EventFiltersBar: React.FC<EventFiltersBarProps> = ({
  filters,
  setFilters,
  onReset,
  className,
  showDateFilter = true,
  showLocationFilter = true,
  showSearchFilter = true,
  showPastEventsFilter = true,
  inline = false
}) => {
  const { dateRange, locationRadius, userLocation, searchQuery, includePastEvents } = filters;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const togglePastEvents = (checked: boolean) => {
    setFilters(prev => ({ ...prev, includePastEvents: checked }));
  };

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters(prev => ({
            ...prev,
            userLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            locationRadius: 10 // Default to 10 miles
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const clearLocationFilter = () => {
    setFilters(prev => ({ ...prev, userLocation: null, locationRadius: null }));
  };

  const hasActiveFilters = !!dateRange || !!userLocation || !!searchQuery || includePastEvents;

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("grid gap-4", inline ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1")}>
        {showDateFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
        )}

        {showLocationFilter && (
          <div>
            {userLocation ? (
              <div className="flex gap-2">
                <Select
                  value={locationRadius?.toString() || "10"}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    locationRadius: parseInt(value)
                  }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Within 5 miles</SelectItem>
                    <SelectItem value="10">Within 10 miles</SelectItem>
                    <SelectItem value="25">Within 25 miles</SelectItem>
                    <SelectItem value="50">Within 50 miles</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearLocationFilter} className="flex-shrink-0">
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={requestUserLocation}
                className="w-full"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Use my location
              </Button>
            )}
          </div>
        )}

        {showSearchFilter && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              className="pl-9"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        )}
      </div>

      {showPastEventsFilter && (
        <div className="flex items-center space-x-2">
          <Switch 
            id="past-events"
            checked={includePastEvents}
            onCheckedChange={togglePastEvents}
          />
          <Label htmlFor="past-events" className="text-sm font-medium">
            <History className="h-4 w-4 inline mr-1" />
            Include past events
          </Label>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {dateRange?.from && (
              <Badge variant="outline">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {format(dateRange.from, "MMM d")}
                {dateRange.to && ` - ${format(dateRange.to, "MMM d")}`}
              </Badge>
            )}

            {userLocation && (
              <Badge variant="outline">
                <MapPin className="h-3 w-3 mr-1" />
                Within {locationRadius} miles
              </Badge>
            )}

            {searchQuery && (
              <Badge variant="outline">
                Search: "{searchQuery}"
              </Badge>
            )}

            {includePastEvents && (
              <Badge variant="outline">
                <History className="h-3 w-3 mr-1" />
                Including past events
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
          >
            Reset All
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventFiltersBar;
