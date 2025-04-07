
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Flag, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ScrapeFormProps {
  onScrapedData: (data: any, url: string, logId: string | null) => void;
}

interface ScrapeResult {
  title?: string;
  description?: string;
  start_datetime?: string;
  end_datetime?: string;
  location?: string;
}

const ScrapeForm: React.FC<ScrapeFormProps> = ({ onScrapedData }) => {
  const [urlToScrape, setUrlToScrape] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeLogId, setScrapeLogId] = useState<string | null>(null);
  const [reportingIssue, setReportingIssue] = useState(false);

  const handleScrape = async () => {
    if (!urlToScrape) {
      toast.error('Please enter a URL to scrape', {
        description: 'The URL field cannot be empty'
      });
      return;
    }

    if (!urlToScrape.startsWith('http')) {
      toast.error('Please enter a valid URL', {
        description: 'The URL must start with http:// or https://'
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

      if (response.error) {
        throw new Error(response.error.message || 'Failed to connect to event scraper');
      }

      const data = response.data;
      
      if (data.scrape_log_id) {
        setScrapeLogId(data.scrape_log_id);
      }

      if (data.data) {
        onScrapedData(data.data, urlToScrape, data.scrape_log_id);
        toast.success('Successfully scraped event details!');
      } else if (data.error) {
        setScrapeError(data.details || data.error);
        throw new Error(data.error + (data.details ? ': ' + data.details : ''));
      } else {
        setScrapeError('No event data or error details returned');
        throw new Error('No event data found in the response');
      }
    } catch (error: any) {
      console.error('Scrape error:', error);
      setScrapeError(error.message || 'Failed to scrape event details');
      toast.error('Failed to scrape event details', {
        description: error.message || 'An unknown error occurred'
      });
    } finally {
      setScraping(false);
    }
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
      
      toast.success('Thank you for reporting this issue', {
        description: 'We will look into it.'
      });
      
      setScrapeError(prev => prev ? `${prev} (Reported)` : null);
    } catch (error: any) {
      console.error('Error reporting bad scrape:', error);
      toast.error('Failed to report issue', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setReportingIssue(false);
    }
  };

  return (
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
  );
};

export default ScrapeForm;
