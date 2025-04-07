
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Happening } from '@/lib/supabase-client';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AttendButton } from './AttendButton';

interface EventCardProps {
  event: Happening;
  showAttendButton?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, showAttendButton = true }) => {
  const startDate = new Date(event.start_datetime);
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
  
  // Check if event is happening today
  const isToday = new Date().toDateString() === startDate.toDateString();
  
  // Check if event has already passed
  const isPast = startDate < new Date();

  return (
    <div className={`event-card ${isPast ? 'opacity-70' : ''}`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <Link to={`/event/${event.id}`}>
              <h3 className="text-lg font-bold hover:text-primary transition-colors line-clamp-1">
                {event.title}
              </h3>
            </Link>
            {event.status !== 'approved' && (
              <Badge variant={event.status === 'pending' ? 'outline' : 'destructive'} className="mt-1">
                {event.status}
              </Badge>
            )}
          </div>
          {isToday && !isPast && (
            <Badge variant="default" className="bg-yellow-500">Today</Badge>
          )}
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description || 'No description available.'}
          </p>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{format(startDate, 'MMMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>
              {format(startDate, 'h:mm a')}
              {endDate && ` - ${format(endDate, 'h:mm a')}`}
            </span>
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
        
        {showAttendButton && event.status === 'approved' && !isPast && (
          <div className="mt-4">
            <AttendButton eventId={event.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
