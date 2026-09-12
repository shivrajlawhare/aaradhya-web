import { EventStatus } from '../../contract';
import type { StatusFilterValue } from './calendar-filters';
import FilterChip from './filter-chip';

interface StatusFilterChipsProps {
  status: StatusFilterValue;
  onChange: (status: StatusFilterValue) => void;
}

// Exactly the three chips FR-SES-6/this story's own Flow line name — All,
// Tentative, Confirmed — not one chip per EventStatus member. Completed
// and Cancelled aren't offered as their own direct status chips; that's
// the spec's own enumerated list, not an oversight.
const StatusFilterChips = ({ status, onChange }: StatusFilterChipsProps) => (
  <>
    <FilterChip label="All" active={status === 'All'} onClick={() => onChange('All')} />
    <FilterChip
      label="Tentative"
      active={status === EventStatus.Tentative}
      onClick={() => onChange(EventStatus.Tentative)}
    />
    <FilterChip
      label="Confirmed"
      active={status === EventStatus.Confirmed}
      onClick={() => onChange(EventStatus.Confirmed)}
    />
  </>
);

export default StatusFilterChips;
