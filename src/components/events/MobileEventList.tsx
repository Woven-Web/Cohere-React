
import React from 'react';
import { Happening } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

interface MobileEventListProps {
  events: Happening[];
  selectedEvent: Happening | null;
  onEventSelect: (event: Happening) => void;
  onEventDetails: (id: string) => void;
  loading?: boolean;
}

const MobileEventList: React.FC<MobileEventListProps> = ({
  events,
  selectedEvent,
  onEventSelect,
  onEventDetails,
  loading = false
}) => {
  const [page, setPage] = React.useState(1);
  const eventsPerPage = 5;
  
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const paginatedEvents = events.slice(
    (page - 1) * eventsPerPage,
    page * eventsPerPage
  );

  const formatEventDate = (date: string) => {
    return format(new Date(date), 'MMMM d, yyyy h:mm a');
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center p-2">
        <div className="text-sm font-medium">
          {events.length} {events.length === 1 ? 'event' : 'events'} found
        </div>
        {totalPages > 1 && (
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
        )}
      </div>
      
      <ScrollArea className="h-[300px] rounded-md border p-2">
        {paginatedEvents.map(event => (
          <Card 
            key={event.id} 
            className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
              selectedEvent?.id === event.id ? 'ring-2 ring-yellow-500 shadow-md' : ''
            }`}
            onClick={() => onEventSelect(event)}
          >
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm mb-1 line-clamp-1">{event.title}</h3>
              <div className="flex items-center text-xs text-muted-foreground mb-1">
                <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{formatEventDate(event.start_datetime)}</span>
              </div>
              {event.location && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 h-7 w-full justify-end"
                onClick={(e) => {
                  e.stopPropagation();
                  onEventDetails(event.id);
                }}
              >
                <span className="text-xs">Details</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {paginatedEvents.length === 0 && !loading && (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">No events found</p>
          </div>
        )}
      </ScrollArea>
      
      {totalPages > 1 && (
        <Pagination className="justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(pageNum);
                  }}
                  isActive={page === pageNum}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default MobileEventList;
