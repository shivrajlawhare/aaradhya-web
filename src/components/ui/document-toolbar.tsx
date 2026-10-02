import type { ReactNode } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import aaradhyaMark from '../../assets/aaradhya-mark.svg';
import type { EventStatus } from '../../contract';
import { eventDetailPath } from '../../routes';
import {
  dividerStyles,
  eventIdStyles,
  markStyles,
  mobileActionStyles,
  spacerStyles,
  titleBlockStyles,
  titleStyles,
  toolbarStyles,
} from './document-toolbar.styles';
import StatusChip from './status-chip';

export interface DocumentToolbarEvent {
  id: string;
  eventId: string;
  // Absent hides the status chip (the Banquet Event Order shows none).
  status?: EventStatus;
}

export interface DocumentToolbarAction {
  label: string;
  icon: ReactNode;
  isLoading: boolean;
  onClick: () => void;
}

interface DocumentToolbarProps {
  // Absent while loading or when the Event wasn't found: only the mark
  // shows then.
  event?: DocumentToolbarEvent;
  title: string;
  // The shorter mobile title, e.g. "Quotation".
  mobileTitle: string;
  action: DocumentToolbarAction;
  // On mobile the mark is dropped when the title needs the room (UI-44).
  isMobileMarkHidden?: boolean;
  isDesktop: boolean;
}

// Figma Quotation/Toolbar (D9, D10), shared by the Quotation Preview and the
// Banquet Event Order: "Back to event", the mark, the title with the event
// ID, the status chip, and the primary document action. Mobile uses icon
// buttons and the short title.
const DocumentToolbar = ({
  event,
  title,
  mobileTitle,
  action,
  isMobileMarkHidden = false,
  isDesktop,
}: DocumentToolbarProps) => {
  const mark = <Box component="img" src={aaradhyaMark} alt="" aria-hidden sx={markStyles} />;

  if (!event) {
    return <Box sx={toolbarStyles}>{mark}</Box>;
  }

  const backToEvent = eventDetailPath(event.id);
  const statusChip = event.status && <StatusChip status={event.status} />;

  if (!isDesktop) {
    return (
      <Box sx={toolbarStyles}>
        <IconButton component={RouterLink} to={backToEvent} aria-label="Back to event">
          <ArrowBackRoundedIcon />
        </IconButton>
        {!isMobileMarkHidden && mark}
        <Box sx={titleBlockStyles}>
          <Typography variant="titleS" component="p" sx={titleStyles}>
            {mobileTitle}
          </Typography>
          <Typography variant="bodyS" sx={eventIdStyles}>
            {event.eventId}
          </Typography>
        </Box>
        {statusChip}
        <Box sx={spacerStyles} />
        <IconButton
          aria-label={action.label}
          onClick={action.onClick}
          disabled={action.isLoading}
          sx={mobileActionStyles}
        >
          {action.icon}
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={toolbarStyles}>
      <Button variant="ghost" component={RouterLink} to={backToEvent} startIcon={<ArrowBackRoundedIcon />}>
        Back to event
      </Button>
      {mark}
      <Box sx={dividerStyles} />
      <Box sx={titleBlockStyles}>
        <Typography variant="titleS" component="p" sx={titleStyles}>
          {title}
        </Typography>
        <Typography variant="bodyS" sx={eventIdStyles}>
          {event.eventId}
        </Typography>
      </Box>
      {statusChip}
      <Box sx={spacerStyles} />
      <Button variant="contained" startIcon={action.icon} onClick={action.onClick} loading={action.isLoading}>
        {action.label}
      </Button>
    </Box>
  );
};

export default DocumentToolbar;
