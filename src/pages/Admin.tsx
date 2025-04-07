
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Happening } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventCard from '@/components/events/EventCard';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

const Admin = () => {
  const { isCurator } = useAuth();
  const [pendingEvents, setPendingEvents] = useState<Happening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCurator) {
      fetchPendingEvents();
    }
  }, [isCurator]);

  const fetchPendingEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('happenings')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingEvents(data || []);
    } catch (error) {
      console.error('Error fetching pending events:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEventStatus = async (eventId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('happenings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) throw error;

      // Update local state
      setPendingEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast.success(
        status === 'approved' 
          ? 'Event approved successfully' 
          : 'Event rejected successfully'
      );
    } catch (error: any) {
      console.error('Error updating event status:', error);
      toast.error('Failed to update event status', {
        description: error.message
      });
    }
  };

  if (!isCurator) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage community events and settings
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Events</TabsTrigger>
          <TabsTrigger value="logs">Scrape Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Events</CardTitle>
              <CardDescription>
                Review and approve community-submitted events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading pending events...</p>
              ) : pendingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending events to review
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingEvents.map(event => (
                    <div key={event.id} className="border-b pb-6 last:border-0">
                      <EventCard event={event} showAttendButton={false} />
                      <div className="flex justify-end space-x-3 mt-4">
                        <Button 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => updateEventStatus(event.id, 'rejected')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateEventStatus(event.id, 'approved')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Scrape Logs</CardTitle>
              <CardDescription>
                View logs of URL scraping attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Scrape logs feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
              <CardDescription>
                Configure community calendar settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Admin settings feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
