import { useState } from 'react';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
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
  // Delete Event is the Event Manager's only.
  canEdit: boolean;
  onDelete: () => void;
  // "Notes for Department" (DEV-12) — the Banquet Event Order preview, for
  // every role.
  notesPath: string;
}

const NOTES_LABEL = 'Notes for Department';

// Figma Event Detail/Header (UI-22, UI-44): the EVENT eyebrow, the event ID
// with its status chip, the family type, the decor, the actions ("Notes for
// Department" for every role, "Delete Event" for the Event Manager) and the
// Summary Strip — one card on desktop. On mobile an identity card above the
// strip's own tiles: the Event Manager's actions sit in a ⋮ menu; other roles
// get the Notes for Department icon button in its place.
const EventDetailHeader = ({ event, summary, isDesktop, canEdit, onDelete, notesPath }: EventDetailHeaderProps) => {
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

    let headerAction = (
      <IconButton component={RouterLink} to={notesPath} aria-label={NOTES_LABEL}>
        <DescriptionOutlinedIcon />
      </IconButton>
    );
    if (canEdit) {
      headerAction = (
        <IconButton
          aria-label="More actions"
          aria-haspopup="menu"
          onClick={(clickEvent) => setMenuAnchor(clickEvent.currentTarget)}
        >
          <MoreVertRoundedIcon />
        </IconButton>
      );
    }

    return (
      <Box component="header" sx={mobileHeaderStyles}>
        <Box sx={headerCardStyles}>
          <Box sx={identityRowStyles}>
            {identity}
            {headerAction}
          </Box>
        </Box>
        <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
          <MenuItem component={RouterLink} to={notesPath}>
            {NOTES_LABEL}
          </MenuItem>
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
      <Box sx={actionsStyles}>
        <Button
          variant="outlined"
          size="small"
          component={RouterLink}
          to={notesPath}
          startIcon={<DescriptionOutlinedIcon />}
        >
          {NOTES_LABEL}
        </Button>
        {canEdit && (
          <Button variant="outlined" color="error" size="small" startIcon={<DeleteOutlinedIcon />} onClick={onDelete}>
            Delete Event
          </Button>
        )}
      </Box>
      <EventSummaryStrip summary={summary} />
    </Box>
  );
};

export default EventDetailHeader;
