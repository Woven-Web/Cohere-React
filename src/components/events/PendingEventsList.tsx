
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { CheckCircle, XCircle, EyeIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Happening } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

const PendingEventsList = () => {
  const queryClient = useQueryClient();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Query for pending events
  const { data: pendingEvents, isLoading, error } = useQuery({
    queryKey: ['pendingEvents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('happenings')
        .select('*, user_profiles:submitter_user_id(role)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Mutation for approving/rejecting events
  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('happenings')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingEvents'] });
      toast.success(
        data.status === 'approved' 
          ? 'Event approved and published!' 
          : 'Event rejected'
      );
    },
    onError: (error: any) => {
      toast.error('Failed to update event status', {
        description: error.message
      });
    }
  });

  const handleApprove = (id: string) => {
    updateEventStatusMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateEventStatusMutation.mutate({ id, status: 'rejected' });
  };

  const toggleExpand = (id: string) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border border-gray-200">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-20 mr-2" />
              <Skeleton className="h-9 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p className="font-medium">Error loading pending events</p>
        <p className="text-sm mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  if (!pendingEvents || pendingEvents.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No pending events</h3>
        <p className="mt-1 text-gray-500">All submitted events have been processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingEvents.map((event: Happening) => (
        <Card key={event.id} className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <Badge variant="outline" className="ml-2">Pending</Badge>
            </div>
            <CardDescription>
              Submitted {format(new Date(event.created_at), 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">When:</span>
                <span className="text-sm">
                  {format(new Date(event.start_datetime), 'PPP p')}
                  {event.end_datetime && (
                    <> — {format(new Date(event.end_datetime), 'PPP p')}</>
                  )}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Where:</span>
                  <span className="text-sm">{event.location}</span>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 p-0 h-auto"
                onClick={() => toggleExpand(event.id)}
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                {expandedEventId === event.id ? 'Show less' : 'Show details'}
              </Button>
              
              {expandedEventId === event.id && (
                <div className="pt-2">
                  <Separator className="my-2" />
                  {event.description && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Description:</h4>
                      <p className="text-sm whitespace-pre-line">{event.description}</p>
                    </div>
                  )}
                  
                  {event.source_url && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Source:</h4>
                      <a 
                        href={event.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {event.source_url}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleReject(event.id)}
              disabled={updateEventStatusMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button 
              variant="default" 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(event.id)}
              disabled={updateEventStatusMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default PendingEventsList;
