
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ScrapeForm from '@/components/events/ScrapeForm';
import EventForm from '@/components/events/EventForm';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';

interface ScrapeData {
  data: any;
  url: string;
  logId: string | null;
}

const Submit = () => {
  const { user, isCurator, isAdmin } = useAuth();
  const [scrapeData, setScrapeData] = useState<ScrapeData | undefined>(undefined);

  const handleScrapedData = (data: any, url: string, logId: string | null) => {
    setScrapeData({ data, url, logId });
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

      <Tabs defaultValue="scrape" className="mb-8">
        <TabsList>
          <TabsTrigger value="scrape">Scrape from URL</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scrape" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <ScrapeForm onScrapedData={handleScrapedData} />
            </div>

            <div className="lg:col-span-3">
              {user && (
                <EventForm 
                  userId={user.id}
                  isCurator={isCurator}
                  isAdmin={isAdmin}
                  scrapeData={scrapeData}
                />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="manual" className="mt-4">
          <div className="max-w-3xl mx-auto">
            {user ? (
              <EventForm 
                userId={user.id}
                isCurator={isCurator}
                isAdmin={isAdmin}
              />
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                  You must be signed in to submit events.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Submit;
