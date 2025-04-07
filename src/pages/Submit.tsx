
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ScrapeForm from '@/components/events/ScrapeForm';
import EventForm from '@/components/events/EventForm';

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
    </div>
  );
};

export default Submit;
