
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Happening } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Link2, ArrowLeft, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AttendButton } from '@/components/events/AttendButton';
import FlagEventButton from '@/components/events/FlagEventButton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Happening | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isCurator, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('happenings')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = () => {
    if (event && id) {
      navigate(`/admin/edit-event/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <Card>
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
        <p className="text-muted-foreground mb-6">
          {error || "We couldn't find the event you're looking for."}
        </p>
        <Link to="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.start_datetime);
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
  const isPast = startDate < new Date();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-sm flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to all events
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            {event.status !== 'approved' && (
              <Badge variant={event.status === 'pending' ? 'outline' : 'destructive'} className="mb-2">
                {event.status}
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-2">
            {(isCurator || isAdmin) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEditEvent}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
            )}
            
            {user && (
              <FlagEventButton eventId={event.id} />
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-3">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">
                  {event.description || 'No description provided.'}
                </p>
              </div>

              {event.source_url && (
                <div className="mt-6">
                  <a 
                    href={event.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    View original event page
                  </a>
                </div>
              )}
            </div>

            <div>
              <div className="bg-secondary p-4 rounded-lg space-y-4">
                <div>
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Date</h3>
                      <p>{format(startDate, 'MMMM d, yyyy')}</p>
                      {endDate && endDate.toDateString() !== startDate.toDateString() && (
                        <p>to {format(endDate, 'MMMM d, yyyy')}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Time</h3>
                      <p>
                        {format(startDate, 'h:mm a')}
                        {endDate && ` - ${format(endDate, 'h:mm a')}`}
                      </p>
                    </div>
                  </div>
                </div>

                {event.location && (
                  <div>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Location</h3>
                        <p>{event.location}</p>
                      </div>
                    </div>
                  </div>
                )}

                {event.status === 'approved' && !isPast && (
                  <div className="pt-2">
                    <AttendButton eventId={event.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetail;
