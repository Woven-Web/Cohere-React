
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Check, X, ExternalLink, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface EventFlag {
  id: string;
  happening_id: string;
  flagger_user_id: string;
  changes_requested: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
  happening: {
    title: string;
  };
}

const EventFlagsList = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedFlag, setSelectedFlag] = useState<EventFlag | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Query for event flags
  const { data: eventFlags, isLoading, error } = useQuery({
    queryKey: ['eventFlags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_flags')
        .select('*, happening:happenings(title)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EventFlag[];
    }
  });

  // Mutation for updating flag status
  const updateFlagStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status 
    }: { 
      id: string, 
      status: 'resolved' | 'rejected' 
    }) => {
      const { error } = await supabase
        .from('event_flags')
        .update({ 
          status,
          resolved_by_user_id: (await supabase.auth.getSession()).data.session?.user.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eventFlags'] });
      toast.success(
        data.status === 'resolved' 
          ? 'Flag marked as resolved' 
          : 'Flag rejected'
      );
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update flag status', {
        description: error.message
      });
    }
  });

  const handleViewDetails = (flag: EventFlag) => {
    setSelectedFlag(flag);
    setIsDialogOpen(true);
  };

  const handleResolve = (id: string) => {
    updateFlagStatusMutation.mutate({ id, status: 'resolved' });
  };

  const handleReject = (id: string) => {
    updateFlagStatusMutation.mutate({ id, status: 'rejected' });
  };

  const handleEditEvent = (happeningId: string) => {
    navigate(`/admin/edit-event/${happeningId}`);
    setIsDialogOpen(false);
  };

  const handleViewEvent = (happeningId: string) => {
    navigate(`/event/${happeningId}`);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <Skeleton className="h-10 w-full mb-4" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full mb-2" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p className="font-medium">Error loading event flags</p>
        <p className="text-sm mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  if (!eventFlags || eventFlags.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No event flags</h3>
        <p className="mt-1 text-gray-500">No events have been flagged for changes.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventFlags.map((flag) => (
              <TableRow key={flag.id}>
                <TableCell className="font-medium truncate max-w-[150px]">
                  {flag.happening?.title || 'Unknown Event'}
                </TableCell>
                <TableCell className="truncate max-w-[200px]">
                  {flag.changes_requested.substring(0, 50)}
                  {flag.changes_requested.length > 50 ? '...' : ''}
                </TableCell>
                <TableCell>
                  {format(new Date(flag.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      flag.status === 'pending'
                        ? 'outline'
                        : flag.status === 'resolved'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {flag.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(flag)}
                    >
                      Details
                    </Button>
                    
                    {flag.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleReject(flag.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleResolve(flag.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedFlag && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Event Flag Details</DialogTitle>
              <DialogDescription>
                Review the reported issue for {selectedFlag.happening?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Reported Issue:</h4>
                <p className="whitespace-pre-line">{selectedFlag.changes_requested}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Reported On:</h4>
                  <p>{format(new Date(selectedFlag.created_at), 'MMMM d, yyyy h:mm a')}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status:</h4>
                  <Badge
                    variant={
                      selectedFlag.status === 'pending'
                        ? 'outline'
                        : selectedFlag.status === 'resolved'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {selectedFlag.status}
                  </Badge>
                </div>
              </div>
              
              {selectedFlag.resolved_at && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Resolved On:</h4>
                    <p>{format(new Date(selectedFlag.resolved_at), 'MMMM d, yyyy h:mm a')}</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex-1 flex justify-start">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-primary"
                  onClick={() => handleViewEvent(selectedFlag.happening_id)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Event
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
                
                {selectedFlag.status === 'pending' && (
                  <>
                    <Button 
                      variant="secondary"
                      onClick={() => handleEditEvent(selectedFlag.happening_id)}
                    >
                      Edit Event
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default EventFlagsList;
