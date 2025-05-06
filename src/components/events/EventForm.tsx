
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, MapPin, Link2, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface EventFormData {
  title: string;
  description: string;
  start_date: Date | undefined;
  start_time: string;
  end_date: Date | undefined;
  end_time: string;
  location: string;
  source_url: string;
  scrape_log_id: string | null;
}

interface EventFormProps {
  userId: string;
  isCurator: boolean;
  isAdmin: boolean;
  initialData?: EventFormData;
  scrapeData?: {
    data: any;
    url: string;
    logId: string | null;
  };
}

const initialFormState: EventFormData = {
  title: '',
  description: '',
  start_date: undefined,
  start_time: '',
  end_date: undefined,
  end_time: '',
  location: '',
  source_url: '',
  scrape_log_id: null
};

const EventForm: React.FC<EventFormProps> = ({ 
  userId, 
  isCurator, 
  isAdmin, 
  initialData = initialFormState,
  scrapeData
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EventFormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [isPastEvent, setIsPastEvent] = useState(false);

  useEffect(() => {
    checkIfPastEvent();
  }, [formData.start_date, formData.start_time]);

  useEffect(() => {
    if (scrapeData?.data) {
      populateFormWithScrapeData(
        scrapeData.data, 
        scrapeData.url, 
        scrapeData.logId
      );
    }
  }, [scrapeData]);

  const checkIfPastEvent = () => {
    if (formData.start_date && formData.start_time) {
      const startDateTime = new Date(formData.start_date);
      const [startHours, startMinutes] = formData.start_time.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);
      
      const now = new Date();
      setIsPastEvent(startDateTime < now);
    } else {
      setIsPastEvent(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: 'start_date' | 'end_date', date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const populateFormWithScrapeData = (data: any, url: string, logId: string | null) => {
    const updates: Partial<EventFormData> = {
      title: data.title || '',
      description: data.description || '',
      location: data.location || '',
      source_url: url,
      scrape_log_id: logId
    };

    if (data.start_datetime) {
      try {
        const startDate = new Date(data.start_datetime);
        updates.start_date = startDate;
        updates.start_time = format(startDate, 'HH:mm');
        
        const now = new Date();
        if (startDate < now) {
          setIsPastEvent(true);
        }
      } catch (error) {
        console.error('Error parsing start_datetime:', error);
      }
    }

    if (data.end_datetime) {
      try {
        const endDate = new Date(data.end_datetime);
        updates.end_date = endDate;
        updates.end_time = format(endDate, 'HH:mm');
      } catch (error) {
        console.error('Error parsing end_datetime:', error);
      }
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('You must be signed in to submit events');
      return;
    }
    
    if (!formData.title || !formData.start_date || !formData.start_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const startDateTime = new Date(formData.start_date);
      const [startHours, startMinutes] = formData.start_time.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);

      let endDateTime = null;
      if (formData.end_date && formData.end_time) {
        endDateTime = new Date(formData.end_date);
        const [endHours, endMinutes] = formData.end_time.split(':').map(Number);
        endDateTime.setHours(endHours, endMinutes);
      }

      // Set status based on role: submitters, curators, and admins can publish immediately
      const status = isCurator || isAdmin ? 'approved' : 'pending';
      
      const eventData: any = {
        title: formData.title,
        description: formData.description,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime ? endDateTime.toISOString() : null,
        location: formData.location || null,
        source_url: formData.source_url || null,
        submitter_user_id: userId,
        scrape_log_id: formData.scrape_log_id,
        status
      };

      const { error } = await supabase
        .from('happenings')
        .insert(eventData);

      if (error) throw error;

      toast.success('Success', {
        description: isCurator || isAdmin 
          ? 'Your event has been submitted and is now live!' 
          : 'Your event has been submitted and will be reviewed by a curator.'
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Error submitting event:', error);
      toast.error('Failed to submit event', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
        <CardDescription>
          Fill in the details about your event
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {isPastEvent && (
            <Alert variant="destructive" className="bg-yellow-50 border-yellow-300">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Past Event Warning</AlertTitle>
              <AlertDescription className="text-yellow-700">
                The event date appears to be in the past. Please verify this is correct before submitting.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start_date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      isPastEvent && "border-yellow-500 text-yellow-700"
                    )}
                  >
                    <CalendarIcon className={cn("mr-2 h-4 w-4", isPastEvent && "text-yellow-600")} />
                    {formData.start_date ? (
                      format(formData.start_date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => handleDateChange('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <div className="flex items-center">
                <Clock className={cn("mr-2 h-4 w-4", isPastEvent ? "text-yellow-600" : "text-muted-foreground")} />
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className={cn(isPastEvent && "border-yellow-500")}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end_date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? (
                      format(formData.end_date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => handleDateChange('end_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_url">Source URL</Label>
            <div className="flex items-center">
              <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="source_url"
                name="source_url"
                value={formData.source_url}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-yellow-500 hover:bg-yellow-600"
            disabled={submitting || !formData.title || !formData.start_date || !formData.start_time}
          >
            {submitting ? 'Submitting...' : 'Submit Event'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventForm;
