
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PendingEventsList from '@/components/events/PendingEventsList';
import { ClipboardList, Settings, Users, Flag, FileText } from 'lucide-react';
import EventFlagsList from '@/components/admin/EventFlagsList';
import UserManagement from '@/components/admin/UserManagement';
import CustomInstructionsManager from '@/components/admin/CustomInstructionsManager';
import ScrapeLogsList from '@/components/admin/ScrapeLogsList';
import { useMediaQuery } from '@/hooks/use-mobile';

const Admin = () => {
  const { user, isAdmin, isCurator, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("pending-events");
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  }

  if (!user || (!isAdmin && !isCurator)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Curation</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage all aspects of the platform' : 'Review and approve community events'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="border-b pb-2">
          <TabsList className="inline-flex flex-wrap gap-2 p-1 justify-start">
            <TabsTrigger value="pending-events" className="flex items-center">
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>Pending Events</span>
            </TabsTrigger>
            
            <TabsTrigger value="event-flags" className="flex items-center">
              <Flag className="mr-2 h-4 w-4" />
              <span>Event Flags</span>
            </TabsTrigger>
            
            {isAdmin && (
              <>
                <TabsTrigger value="scrape-logs" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Scrape Logs</span>
                </TabsTrigger>
                
                <TabsTrigger value="users" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>User Management</span>
                </TabsTrigger>
                
                <TabsTrigger value="settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Custom Instructions</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <TabsContent value="pending-events">
          <Card>
            <CardHeader>
              <CardTitle>Pending Events</CardTitle>
              <CardDescription>
                Review and approve events submitted by community members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingEventsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="event-flags">
          <Card>
            <CardHeader>
              <CardTitle>Event Flags</CardTitle>
              <CardDescription>
                Review and resolve reported issues with events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventFlagsList />
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="scrape-logs">
              <Card>
                <CardHeader>
                  <CardTitle>Scrape Logs</CardTitle>
                  <CardDescription>
                    Review URL scraping history and analyze issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrapeLogsList />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user roles and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Instructions</CardTitle>
                  <CardDescription>
                    Configure site-specific scraping instructions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomInstructionsManager />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Admin;
