
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Happening } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const { isCurator, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Happening | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    if (!isCurator && !isAdmin) {
      navigate('/');
      return;
    }
    
    fetchEvent(id);
  }, [id, isCurator, isAdmin, navigate]);

  const fetchEvent = async (eventId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('happenings')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      setEvent(data);
      
      // Format dates and times for the form
      const start = new Date(data.start_datetime);
      setTitle(data.title);
      setDescription(data.description || '');
      setLocation(data.location || '');
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      
      if (data.end_datetime) {
        const end = new Date(data.end_datetime);
        setEndDate(format(end, 'yyyy-MM-dd'));
        setEndTime(format(end, 'HH:mm'));
      }
      
      setSourceUrl(data.source_url || '');
    } catch (error: any) {
      console.error('Error fetching event:', error);
      setError(error.message);
      toast.error('Failed to load event', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!id || !user) return;
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!startDate || !startTime) {
      toast.error('Start date and time are required');
      return;
    }
    
    setSaving(true);
    
    try {
      // Convert date and time inputs to ISO timestamps
      const startTimestamp = new Date(`${startDate}T${startTime}`).toISOString();
      let endTimestamp = null;
      
      if (endDate && endTime) {
        endTimestamp = new Date(`${endDate}T${endTime}`).toISOString();
      }
      
      const { error } = await supabase
        .from('happenings')
        .update({
          title,
          description,
          location,
          start_datetime: startTimestamp,
          end_datetime: endTimestamp,
          source_url: sourceUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Event updated successfully');
      navigate(`/event/${id}`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event', {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-28 mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
        <p className="text-muted-foreground mb-6">
          {error || "We couldn't find the event you're trying to edit."}
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-4 -ml-4 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(`/event/${id}`)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to event
        </Button>
        <h1 className="text-3xl font-bold">Edit Event</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title*</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              className="min-h-[120px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Event location"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date*</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time*</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (Optional)</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
            <Input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/event"
            />
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={handleSaveEvent} 
              disabled={saving || !title || !startDate || !startTime}
              className="w-full md:w-auto"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditEvent;
