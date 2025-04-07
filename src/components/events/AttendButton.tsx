
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AttendButtonProps {
  eventId: string;
}

export const AttendButton: React.FC<AttendButtonProps> = ({ eventId }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'going' | 'maybe_going' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAttendanceStatus();
    }
  }, [user, eventId]);

  const fetchAttendanceStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_attendance')
        .select('status')
        .eq('user_id', user.id)
        .eq('happening_id', eventId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
          console.error('Error fetching attendance status:', error);
        }
        setStatus(null);
      } else if (data) {
        setStatus(data.status as 'going' | 'maybe_going');
      }
    } catch (error) {
      console.error('Error in fetchAttendanceStatus:', error);
    }
  };

  const updateAttendance = async (newStatus: 'going' | 'maybe_going') => {
    if (!user) {
      toast.error('Please sign in to attend events');
      return;
    }
    
    setLoading(true);
    
    try {
      // If user already has a status, update it
      if (status) {
        const { error } = await supabase
          .from('user_attendance')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('happening_id', eventId);
        
        if (error) throw error;
      } else {
        // Otherwise insert a new record
        const { error } = await supabase
          .from('user_attendance')
          .insert({
            user_id: user.id,
            happening_id: eventId,
            status: newStatus,
          });
        
        if (error) throw error;
      }
      
      setStatus(newStatus);
      toast.success(`You're ${newStatus === 'going' ? 'attending' : 'interested in'} this event!`);
    } catch (error: any) {
      toast.error('Failed to update attendance', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAttendance = async () => {
    if (!user || !status) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_attendance')
        .delete()
        .eq('user_id', user.id)
        .eq('happening_id', eventId);
      
      if (error) throw error;
      
      setStatus(null);
      toast.success('Attendance removed');
    } catch (error: any) {
      toast.error('Failed to remove attendance', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Button variant="outline" disabled={loading} className="w-full">
        <UserPlus className="mr-2 h-4 w-4" />
        Sign in to attend
      </Button>
    );
  }

  if (status === 'going') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" className="w-full bg-yellow-500 hover:bg-yellow-600">
            <Check className="mr-2 h-4 w-4" />
            Going
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => updateAttendance('maybe_going')}>
            <Clock className="mr-2 h-4 w-4" />
            Change to Maybe
          </DropdownMenuItem>
          <DropdownMenuItem onClick={removeAttendance}>
            Not Going
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  if (status === 'maybe_going') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            Maybe
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => updateAttendance('going')}>
            <Check className="mr-2 h-4 w-4" />
            Change to Going
          </DropdownMenuItem>
          <DropdownMenuItem onClick={removeAttendance}>
            Not Going
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading} className="w-full">
          <UserPlus className="mr-2 h-4 w-4" />
          Attend
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => updateAttendance('going')}>
          <Check className="mr-2 h-4 w-4" />
          Going
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateAttendance('maybe_going')}>
          <Clock className="mr-2 h-4 w-4" />
          Maybe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
