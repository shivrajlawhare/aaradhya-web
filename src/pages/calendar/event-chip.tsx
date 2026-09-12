import { Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import { STATUS_CHIP_COLORS } from '../../components/ui/status-chip.styles';
import type { calendarSessionResultSchema } from '../../contract';
import { eventDetailPath } from '../../routes';
import { chipStyles } from './event-chip.styles';

type CalendarEventSummary = z.infer<typeof calendarSessionResultSchema>['event'];

interface EventChipProps {
  event: CalendarEventSummary;
}

// Reuses STATUS_CHIP_COLORS (components/ui/status-chip.tsx) rather than a
// second status-to-color mapping — this story's own AC: "Chip color
// matches the parent Event's status token." The label is eventFamilyType,
// not the status word itself (StatusChip's own job) — a calendar chip
// identifies which Event it is; its color alone conveys status.
const EventChip = ({ event }: EventChipProps) => {
  const navigate = useNavigate();

  return (
    <Chip
      label={event.eventFamilyType}
      size="small"
      style={STATUS_CHIP_COLORS[event.status]}
      sx={chipStyles}
      onClick={() => navigate(eventDetailPath(event.id))}
      aria-label={`Open Event ${event.eventFamilyType}`}
    />
  );
};

export default EventChip;
