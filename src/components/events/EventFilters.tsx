
import React from 'react';
import EventFiltersBar from './EventFiltersBar';
import { FiltersState } from '@/hooks/useEventFilters';

// This component now simply wraps our new EventFiltersBar for backward compatibility
interface EventFiltersProps {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  onReset: () => void;
  className?: string;
  compact?: boolean;
}

const EventFilters: React.FC<EventFiltersProps> = ({
  filters,
  setFilters,
  onReset,
  className,
  compact = false
}) => {
  return (
    <EventFiltersBar 
      filters={filters}
      setFilters={setFilters}
      onReset={onReset}
      className={className}
      showDateFilter={true}
      showLocationFilter={true}
      showSearchFilter={true}
      inline={!compact}
    />
  );
};

export default EventFilters;
