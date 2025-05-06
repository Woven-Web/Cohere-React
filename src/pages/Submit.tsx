
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ScrapeForm from '@/components/events/ScrapeForm';
import EventForm from '@/components/events/EventForm';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, LogIn } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ScrapeData {
  data: any;
  url: string;
  logId: string | null;
}

const Submit = () => {
  const { user, isAuthenticated, isCurator, isAdmin } = useAuth();
  const [scrapeData, setScrapeData] = useState<ScrapeData | undefined>(undefined);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleScrapedData = (data: any, url: string, logId: string | null) => {
    setScrapeData({ data, url, logId });
  };

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription className="mt-2">
            You need to sign in to submit events to the calendar.
          </AlertDescription>
          <div className="mt-4">
            <Link to="/signin">
              <Button variant="default" size="sm" className="bg-yellow-500 hover:bg-yellow-600">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Button>
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit an Event</h1>
        <p className="text-muted-foreground">
          Share your community happenings with others
          {(isCurator || isAdmin) ? (
            <span className="ml-2 text-yellow-500 font-medium">
              - Your event will be published immediately
            </span>
          ) : (
            <span className="ml-2 text-blue-500 font-medium">
              - Your event will be reviewed by a curator before publishing
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
          <div className={`grid grid-cols-1 ${isMobile ? "" : "lg:grid-cols-5"} gap-8`}>
            <div className={isMobile ? "" : "lg:col-span-2"}>
              <ScrapeForm onScrapedData={handleScrapedData} />
            </div>

            <div className={isMobile ? "mt-6" : "lg:col-span-3"}>
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
            {user && (
              <EventForm 
                userId={user.id}
                isCurator={isCurator}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Submit;
