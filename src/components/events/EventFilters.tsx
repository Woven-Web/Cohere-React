
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Filter, X } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export interface FiltersState {
  dateRange: DateRange | undefined;
  locationRadius: number | null;
  userLocation: { lat: number; lng: number } | null;
  searchQuery: string;
}

interface EventFiltersProps {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  onReset: () => void;
  className?: string;
  compact?: boolean;
}

const EventFilters: React.FC<EventFiltersProps> = ({ 
  filters, 
  setFilters, 
  onReset,
  className,
  compact = false
}) => {
  const { dateRange, locationRadius, userLocation, searchQuery } = filters;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
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

  const hasActiveFilters = !!dateRange || !!userLocation || !!searchQuery;

  return (
    <div className={cn("grid gap-4", className)}>
      {compact ? (
        <div className="flex gap-2 overflow-x-auto pb-2 flex-nowrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Date Range</h4>
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
                </div>

                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  {userLocation ? (
                    <div className="space-y-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Within {locationRadius} miles of my location</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 ml-1" 
                          onClick={clearLocationFilter}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                      <Select 
                        value={locationRadius?.toString() || "10"} 
                        onValueChange={(value) => setFilters(prev => ({ 
                          ...prev,
                          locationRadius: parseInt(value) 
                        }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Distance in miles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Within 5 miles</SelectItem>
                          <SelectItem value="10">Within 10 miles</SelectItem>
                          <SelectItem value="25">Within 25 miles</SelectItem>
                          <SelectItem value="50">Within 50 miles</SelectItem>
                        </SelectContent>
                      </Select>
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

                <div>
                  <h4 className="font-medium mb-2">Search</h4>
                  <Input 
                    type="search"
                    placeholder="Search events..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onReset}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Active filter indicators */}
          {dateRange?.from && (
            <Badge variant="outline" className="whitespace-nowrap">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {format(dateRange.from, "MMM d")} 
              {dateRange.to && ` - ${format(dateRange.to, "MMM d")}`}
            </Badge>
          )}
          
          {userLocation && (
            <Badge variant="outline" className="whitespace-nowrap">
              <MapPin className="h-3 w-3 mr-1" />
              {locationRadius} mi radius
            </Badge>
          )}
          
          {searchQuery && (
            <Badge variant="outline" className="whitespace-nowrap">
              "{searchQuery}"
            </Badge>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              {userLocation ? (
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Select 
                    value={locationRadius?.toString() || "10"} 
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev,
                      locationRadius: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                      <SelectItem value="25">25 miles</SelectItem>
                      <SelectItem value="50">50 miles</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={clearLocationFilter}>
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

            <div className="relative md:col-span-2">
              <Input
                type="search"
                placeholder="Search events..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                {dateRange?.from && (
                  <Badge variant="outline">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Date: {format(dateRange.from, "MMM d")} 
                    {dateRange.to && ` - ${format(dateRange.to, "MMM d")}`}
                  </Badge>
                )}
                
                {userLocation && (
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location: Within {locationRadius} miles
                  </Badge>
                )}
                
                {searchQuery && (
                  <Badge variant="outline">
                    Search: "{searchQuery}"
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
        </>
      )}
    </div>
  );
};

export default EventFilters;
