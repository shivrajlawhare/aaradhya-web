import { Box } from '@mui/material';
import { EventStatus } from '../../contract';
import type { CalendarFilters } from './calendar-filters';
import { rowStyles } from './filter-chip-row.styles';
import type { PickerOption } from './picker-filter-chip';
import PickerFilterChip from './picker-filter-chip';

interface FilterChipRowProps {
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  venueOptions: string[];
  eventFamilyTypeOptions: string[];
  eventManagerOptions: PickerOption[];
}

// The two real values FR-SES-6/STORY-035's own Flow line named — not one
// option per EventStatus member. Completed and Cancelled aren't offered
// here; that's the spec's own enumerated list, not an oversight, unchanged
// by this story's own "combine the three status buttons into one dropdown"
// request.
const STATUS_OPTIONS: PickerOption[] = [
  { value: EventStatus.Tentative, label: 'Tentative' },
  { value: EventStatus.Confirmed, label: 'Confirmed' },
];

const FilterChipRow = ({
  filters,
  onFiltersChange,
  venueOptions,
  eventFamilyTypeOptions,
  eventManagerOptions,
}: FilterChipRowProps) => {
  const eventTypeOptions = eventFamilyTypeOptions.map((type) => ({ value: type, label: type }));

  return (
    <Box sx={rowStyles}>
      <PickerFilterChip
        label="Status"
        allLabel="All Statuses"
        options={STATUS_OPTIONS}
        // 'All' (CalendarFilters' own sentinel) <-> null (PickerFilterChip's
        // own "nothing selected" convention) — kept as 'All' in
        // CalendarFilters/the URL rather than changing that representation
        // just to match this one picker's prop shape.
        selectedValue={filters.status === 'All' ? null : filters.status}
        onSelect={(status) =>
          onFiltersChange({
            ...filters,
            status: status === EventStatus.Tentative || status === EventStatus.Confirmed ? status : 'All',
          })
        }
      />
      <PickerFilterChip
        label="Venue"
        options={venueOptions.map((venue) => ({ value: venue, label: venue }))}
        selectedValue={filters.venue}
        onSelect={(venue) => onFiltersChange({ ...filters, venue })}
      />
      {/* "Event" (STORY-060) — per product direction, the same
          distinct-eventFamilyType list as Event Type below, offered as its
          own separate dropdown (not a search-by-specific-Event selector,
          the other reading SRS Assumption A10 left open) and AND-combined
          with it like every other filter dimension. */}
      <PickerFilterChip
        label="Event"
        options={eventTypeOptions}
        selectedValue={filters.event}
        onSelect={(event) => onFiltersChange({ ...filters, event })}
      />
      <PickerFilterChip
        label="Event Manager"
        options={eventManagerOptions}
        selectedValue={filters.eventManagerId}
        onSelect={(eventManagerId) => onFiltersChange({ ...filters, eventManagerId })}
      />
      <PickerFilterChip
        label="Event Type"
        options={eventTypeOptions}
        selectedValue={filters.eventFamilyType}
        onSelect={(eventFamilyType) => onFiltersChange({ ...filters, eventFamilyType })}
      />
    </Box>
  );
};

export default FilterChipRow;
