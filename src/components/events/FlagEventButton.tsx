
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface FlagEventButtonProps {
  eventId: string;
  className?: string;
}

const FlagEventButton = ({ eventId, className }: FlagEventButtonProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [changesRequested, setChangesRequested] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFlag = async () => {
    if (!user) {
      toast.error('You must be signed in to flag an event');
      return;
    }

    if (!changesRequested.trim()) {
      toast.error('Please describe what needs to be changed');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('event_flags')
        .insert({
          happening_id: eventId,
          flagger_user_id: user.id,
          changes_requested: changesRequested
        });

      if (error) throw error;

      toast.success('Event flagged successfully', {
        description: 'An admin will review your request'
      });
      setIsDialogOpen(false);
      setChangesRequested('');
    } catch (error: any) {
      console.error('Error flagging event:', error);
      toast.error('Failed to flag event', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className={`text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700 ${className}`}
        onClick={() => setIsDialogOpen(true)}
      >
        <Flag className="h-4 w-4 mr-2" />
        Report Issue
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Issue with Event</DialogTitle>
            <DialogDescription>
              Let us know what information needs to be corrected for this event.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Describe what needs to be changed (e.g., incorrect date, wrong location, etc.)"
              className="min-h-[120px]"
              value={changesRequested}
              onChange={(e) => setChangesRequested(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitFlag} 
              disabled={isSubmitting || !changesRequested.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Flag className="h-4 w-4 mr-2" />
              )}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlagEventButton;
