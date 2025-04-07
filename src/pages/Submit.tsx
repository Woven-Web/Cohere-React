import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, MapPin, Link2, AlertTriangle, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface ScrapeResult {
  title?: string;
  description?: string;
  start_datetime?: string;
  end_datetime?: string;
  location?: string;
}

const Submit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EventFormData>(initialFormState);
  const [urlToScrape, setUrlToScrape] = useState('');
  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeLogId, setScrapeLogId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: 'start_date' | 'end_date', date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleScrape = async () => {
    if (!urlToScrape) {
      toast({
        title: 'Error',
        description: 'Please enter a URL to scrape',
        variant: 'destructive'
      });
      return;
    }

    if (!urlToScrape.startsWith('http')) {
      toast({
        title: 'Error',
        description: 'Please enter a valid URL starting with http:// or https://',
        variant: 'destructive'
      });
      return;
    }

    setScraping(true);
    setScrapeError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be signed in to scrape URLs');
      }
      
      const { data, error } = await supabase.functions.invoke('scrapeUrl', {
        body: { url: urlToScrape }
      });

      if (error) {
        throw new Error(error.message || 'Failed to scrape event details');
      }

      if (data.scrape_log_id) {
        setScrapeLogId(data.scrape_log_id);
      }

      if (data.data) {
        populateFormWithScrapeData(data.data, urlToScrape);
        toast({
          title: 'Success',
          description: 'Successfully scraped event details!',
          variant: 'default'
        });
      } else {
        throw new Error(data.error || 'No event data found');
      }
    } catch (error: any) {
      console.error('Scrape error:', error);
      setScrapeError(error.message || 'Failed to scrape event details');
      toast({
        title: 'Error',
        description: error.message || 'Failed to scrape event details',
        variant: 'destructive'
      });
    } finally {
      setScraping(false);
    }
  };

  const populateFormWithScrapeData = (data: ScrapeResult, url: string) => {
    const updates: Partial<EventFormData> = {
      title: data.title || '',
      description: data.description || '',
      location: data.location || '',
      source_url: url,
      scrape_log_id: scrapeLogId
    };

    if (data.start_datetime) {
      const startDate = new Date(data.start_datetime);
      updates.start_date = startDate;
      updates.start_time = format(startDate, 'HH:mm');
    }

    if (data.end_datetime) {
      const endDate = new Date(data.end_datetime);
      updates.end_date = endDate;
      updates.end_time = format(endDate, 'HH:mm');
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const reportBadScrape = async () => {
    if (!scrapeLogId) return;

    try {
      const { error } = await supabase
        .from('scrape_logs')
        .update({ is_reported_bad: true })
        .eq('id', scrapeLogId);

      if (error) throw error;
      toast({
        title: 'Thank you',
        description: 'Thank you for reporting this issue',
      });
    } catch (error: any) {
      console.error('Error reporting bad scrape:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to report issue',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be signed in to submit events',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.title || !formData.start_date || !formData.start_time) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
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

      const eventData = {
        title: formData.title,
        description: formData.description,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime ? endDateTime.toISOString() : null,
        location: formData.location,
        source_url: formData.source_url,
        submitter_user_id: user.id,
        scrape_log_id: formData.scrape_log_id
      };

      const { error } = await supabase
        .from('happenings')
        .insert(eventData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your event has been submitted and will be reviewed by a curator.',
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Error submitting event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit event',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit an Event</h1>
        <p className="text-muted-foreground">
          Share your community happenings with others
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Scrape Event Details</CardTitle>
              <CardDescription>
                Have an event URL? Let us extract the details for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="urlToScrape">Event URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="urlToScrape"
                      placeholder="https://example.com/event"
                      value={urlToScrape}
                      onChange={(e) => setUrlToScrape(e.target.value)}
                      disabled={scraping}
                    />
                    <Button 
                      onClick={handleScrape} 
                      disabled={scraping || !urlToScrape}
                    >
                      {scraping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Scrape'
                      )}
                    </Button>
                  </div>
                </div>

                {scrapeError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-800">Scraping failed</span>
                    </div>
                    <p className="mt-1 text-red-700">{scrapeError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-red-600"
                      onClick={reportBadScrape}
                      disabled={!scrapeLogId}
                    >
                      Report this issue
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Fill in the details about your event
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
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
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
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
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start_time"
                        name="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        required
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
        </div>
      </div>
    </div>
  );
};

export default Submit;
