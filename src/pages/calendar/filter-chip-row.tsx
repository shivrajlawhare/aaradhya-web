import { Box } from '@mui/material';
import type { CalendarFilters, StatusFilterValue } from './calendar-filters';
import { rowStyles } from './filter-chip-row.styles';
import type { PickerOption } from './picker-filter-chip';
import PickerFilterChip from './picker-filter-chip';
import StatusFilterChips from './status-filter-chips';

interface FilterChipRowProps {
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  venueOptions: string[];
  eventFamilyTypeOptions: string[];
  eventManagerOptions: PickerOption[];
}

const FilterChipRow = ({
  filters,
  onFiltersChange,
  venueOptions,
  eventFamilyTypeOptions,
  eventManagerOptions,
}: FilterChipRowProps) => {
  const handleStatusChange = (status: StatusFilterValue) => {
    onFiltersChange({ ...filters, status });
  };

  return (
    <Box sx={rowStyles}>
      <StatusFilterChips status={filters.status} onChange={handleStatusChange} />
      <PickerFilterChip
        label="Venue"
        options={venueOptions.map((venue) => ({ value: venue, label: venue }))}
        selectedValue={filters.venue}
        onSelect={(venue) => onFiltersChange({ ...filters, venue })}
      />
      <PickerFilterChip
        label="Event Manager"
        options={eventManagerOptions}
        selectedValue={filters.eventManagerId}
        onSelect={(eventManagerId) => onFiltersChange({ ...filters, eventManagerId })}
      />
      <PickerFilterChip
        label="Event Type"
        options={eventFamilyTypeOptions.map((type) => ({ value: type, label: type }))}
        selectedValue={filters.eventFamilyType}
        onSelect={(eventFamilyType) => onFiltersChange({ ...filters, eventFamilyType })}
      />
    </Box>
  );
};

export default FilterChipRow;
