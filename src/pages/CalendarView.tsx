
import React, { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { supabase, Happening } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const CalendarView = () => {
  const [events, setEvents] = useState<Happening[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventsForMonth();
  }, [currentDate]);

  const fetchEventsForMonth = async () => {
    setLoading(true);
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    try {
      const { data, error } = await supabase
        .from('happenings')
        .select('*')
        .eq('status', 'approved')
        .gte('start_datetime', start.toISOString())
        .lte('start_datetime', end.toISOString())
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(currentDate => direction === 'next' 
      ? addMonths(currentDate, 1) 
      : subMonths(currentDate, 1)
    );
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return isSameDay(day, eventDate);
    });
  };

  const renderCell = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    const isToday = isSameDay(day, new Date());
    const isCurrentMonth = isSameMonth(day, currentDate);
    
    return (
      <div 
        key={day.toString()}
        className={`min-h-[120px] border p-1 ${
          !isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''
        } ${isToday ? 'bg-yellow-50 border-yellow-200' : ''}`}
      >
        <div className="text-right mb-1">
          <span className={`text-sm inline-block rounded-full w-6 h-6 text-center leading-6 ${
            isToday ? 'bg-yellow-500 text-white' : ''
          }`}>
            {format(day, 'd')}
          </span>
        </div>
        
        <div className="space-y-1 overflow-y-auto max-h-[80px]">
          {loading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            dayEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => navigate(`/event/${event.id}`)}
                className="text-xs p-1 bg-primary/10 rounded truncate cursor-pointer hover:bg-primary/20"
              >
                {format(new Date(event.start_datetime), 'h:mm a')} {event.title}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Event Calendar</h1>
        <p className="text-muted-foreground">
          View events by month
        </p>
      </div>
      
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <Button variant="outline" onClick={() => navigateMonth('next')}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 bg-muted text-center py-2 font-medium">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div className="grid grid-cols-7">
          {days.map(day => renderCell(day))}
        </div>
      </Card>
    </div>
  );
};

export default CalendarView;
