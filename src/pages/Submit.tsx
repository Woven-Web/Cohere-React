
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, MapPin, Link2, AlertTriangle, Loader2, Flag } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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
  const { user, isCurator, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EventFormData>(initialFormState);
  const [urlToScrape, setUrlToScrape] = useState('');
  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeLogId, setScrapeLogId] = useState<string | null>(null);
  const [reportingIssue, setReportingIssue] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: 'start_date' | 'end_date', date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleScrape = async () => {
    if (!urlToScrape) {
      toast('Please enter a URL to scrape', {
        description: 'The URL field cannot be empty'
      });
      return;
    }

    if (!urlToScrape.startsWith('http')) {
      toast('Please enter a valid URL', {
        description: 'The URL must start with http:// or https://',
        variant: 'destructive'
      });
      return;
    }

    setScraping(true);
    setScrapeError(null);
    setScrapeLogId(null);

    try {
      console.log('Attempting to scrape URL:', urlToScrape);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be signed in to scrape URLs');
      }
      
      const response = await supabase.functions.invoke('scrapeUrl', {
        body: { url: urlToScrape }
      });

      console.log('Scrape function response:', response);

      // The edge function now always returns a 200 status with data in the response
      if (response.error) {
        // This is a connection error to the edge function itself
        throw new Error(response.error.message || 'Failed to connect to event scraper');
      }

      const data = response.data;
      
      // Store the scrape log ID regardless of success/failure
      if (data.scrape_log_id) {
        setScrapeLogId(data.scrape_log_id);
      }

      if (data.data) {
        // Successful scrape with event data
        populateFormWithScrapeData(data.data, urlToScrape);
        toast('Successfully scraped event details!');
      } else if (data.error) {
        // Scrape function ran but couldn't extract event data
        setScrapeError(data.details || data.error);
        throw new Error(data.error + (data.details ? ': ' + data.details : ''));
      } else {
        // Unexpected response format
        setScrapeError('No event data or error details returned');
        throw new Error('No event data found in the response');
      }
    } catch (error: any) {
      console.error('Scrape error:', error);
      setScrapeError(error.message || 'Failed to scrape event details');
      toast('Error', {
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
      try {
        const startDate = new Date(data.start_datetime);
        updates.start_date = startDate;
        updates.start_time = format(startDate, 'HH:mm');
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

  const reportBadScrape = async () => {
    if (!scrapeLogId) return;

    try {
      setReportingIssue(true);
      
      const { error } = await supabase
        .from('scrape_logs')
        .update({ is_reported_bad: true })
        .eq('id', scrapeLogId);

      if (error) throw error;
      
      toast('Thank you for reporting this issue', {
        description: 'We will look into it.'
      });
      
      setScrapeError(prev => prev ? `${prev} (Reported)` : null);
    } catch (error: any) {
      console.error('Error reporting bad scrape:', error);
      toast('Error', {
        description: error.message || 'Failed to report issue',
        variant: 'destructive'
      });
    } finally {
      setReportingIssue(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast('You must be signed in to submit events', {
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.title || !formData.start_date || !formData.start_time) {
      toast('Please fill in all required fields', {
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

      // Set status based on user role
      const status = isCurator || isAdmin ? 'approved' : 'pending';
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime ? endDateTime.toISOString() : null,
        location: formData.location,
        source_url: formData.source_url,
        submitter_user_id: user.id,
        scrape_log_id: formData.scrape_log_id,
        status: status
      };

      const { error } = await supabase
        .from('happenings')
        .insert(eventData);

      if (error) throw error;

      toast('Success', {
        description: isCurator || isAdmin 
          ? 'Your event has been submitted and is now live!' 
          : 'Your event has been submitted and will be reviewed by a curator.'
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Error submitting event:', error);
      toast('Error', {
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
          {(isCurator || isAdmin) && (
            <span className="ml-2 text-yellow-500 font-medium">
              - Your event will be published immediately
            </span>
          )}
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
                    {scrapeLogId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700"
                        onClick={reportBadScrape}
                        disabled={reportingIssue || scrapeError?.includes('(Reported)')}
                      >
                        {reportingIssue ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Flag className="h-4 w-4 mr-2" />
                        )}
                        {scrapeError?.includes('(Reported)') ? 'Issue Reported' : 'Report this issue'}
                      </Button>
                    )}
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
