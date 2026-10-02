import { type ReactNode, useState } from 'react';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import type { z } from 'zod';
import pageHeaderDecorDark from '../../assets/decor/page-header-dark.svg';
import pageHeaderDecor from '../../assets/decor/page-header.svg';
import StatusChip from '../../components/ui/status-chip';
import ThemedImage from '../../components/ui/themed-image';
import type { filteredEventResultSchema } from '../../contract';
import {
  actionsStyles,
  decorImageStyles,
  decorStyles,
  eyebrowStyles,
  familyTypeStyles,
  headerCardStyles,
  identityRowStyles,
  identityStyles,
  mobileHeaderStyles,
  titleRowStyles,
  titleStyles,
} from './event-detail-header.styles';
import type { EventSummary } from './event-summary';
import EventSummaryStrip from './event-summary-strip';

type HeaderEvent = Pick<z.infer<typeof filteredEventResultSchema>, 'eventId' | 'status' | 'eventFamilyType'>;

interface EventDetailHeaderProps {
  event: HeaderEvent;
  summary: EventSummary;
  isDesktop: boolean;
  // Delete Event is the Event Manager's only (and so is every action here).
  canEdit: boolean;
  onDelete: () => void;
  // The "Notes for Department" slot, filled by DEV-12; sits before Delete.
  notesAction?: ReactNode;
}

// Figma Event Detail/Header (UI-22): the EVENT eyebrow, the event ID with
// its status chip, the family type, the decor, the actions and the Summary
// Strip — one card on desktop; on mobile an identity card (actions in a ⋮
// menu) above the strip's own tiles.
const EventDetailHeader = ({ event, summary, isDesktop, canEdit, onDelete, notesAction }: EventDetailHeaderProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const identity = (
    <Box sx={identityStyles}>
      <Typography variant="labelS" component="p" sx={eyebrowStyles}>
        Event
      </Typography>
      <Box sx={titleRowStyles}>
        <Typography variant="h1" sx={titleStyles}>
          {event.eventId}
        </Typography>
        <StatusChip status={event.status} />
      </Box>
      <Typography variant="bodyL" sx={familyTypeStyles}>
        {event.eventFamilyType}
      </Typography>
    </Box>
  );

  if (!isDesktop) {
    const handleDeleteFromMenu = () => {
      setMenuAnchor(null);
      onDelete();
    };

    return (
      <Box component="header" sx={mobileHeaderStyles}>
        <Box sx={headerCardStyles}>
          <Box sx={identityRowStyles}>
            {identity}
            {canEdit && (
              <IconButton
                aria-label="More actions"
                aria-haspopup="menu"
                onClick={(clickEvent) => setMenuAnchor(clickEvent.currentTarget)}
              >
                <MoreVertRoundedIcon />
              </IconButton>
            )}
          </Box>
          {notesAction}
        </Box>
        <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={handleDeleteFromMenu}>Delete Event</MenuItem>
        </Menu>
        <EventSummaryStrip summary={summary} />
      </Box>
    );
  }

  return (
    <Box component="header" sx={headerCardStyles}>
      <Box sx={decorStyles} aria-hidden>
        <ThemedImage light={pageHeaderDecor} dark={pageHeaderDecorDark} sx={decorImageStyles} />
      </Box>
      {identity}
      {canEdit && (
        <Box sx={actionsStyles}>
          {notesAction}
          <Button variant="outlined" color="error" size="small" startIcon={<DeleteOutlinedIcon />} onClick={onDelete}>
            Delete Event
          </Button>
        </Box>
      )}
      <EventSummaryStrip summary={summary} />
    </Box>
  );
};

export default EventDetailHeader;
