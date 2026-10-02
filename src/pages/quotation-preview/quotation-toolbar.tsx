import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { z } from 'zod';
import aaradhyaMark from '../../assets/aaradhya-mark.svg';
import StatusChip from '../../components/ui/status-chip';
import type { filteredEventResultSchema } from '../../contract';
import { eventDetailPath } from '../../routes';
import {
  dividerStyles,
  eventIdStyles,
  markStyles,
  mobileShareStyles,
  spacerStyles,
  titleBlockStyles,
  titleStyles,
  toolbarStyles,
} from './quotation-toolbar.styles';

type QuotationToolbarEvent = Pick<z.infer<typeof filteredEventResultSchema>, 'id' | 'eventId' | 'status'>;

interface QuotationToolbarProps {
  // Absent while loading or when the Event wasn't found: only the mark
  // shows then.
  event?: QuotationToolbarEvent;
  isDesktop: boolean;
  isSharing: boolean;
  onShare: () => void;
}

// Figma Quotation/Toolbar (D9, D10): "Back to event", the mark, the title
// with the event ID, the status chip, and "Share PDF". Mobile uses icon
// buttons and the short title "Quotation".
const QuotationToolbar = ({ event, isDesktop, isSharing, onShare }: QuotationToolbarProps) => {
  const mark = <Box component="img" src={aaradhyaMark} alt="" aria-hidden sx={markStyles} />;

  if (!event) {
    return <Box sx={toolbarStyles}>{mark}</Box>;
  }

  const backToEvent = eventDetailPath(event.id);

  if (!isDesktop) {
    return (
      <Box sx={toolbarStyles}>
        <IconButton component={RouterLink} to={backToEvent} aria-label="Back to event">
          <ArrowBackRoundedIcon />
        </IconButton>
        {mark}
        <Box sx={titleBlockStyles}>
          <Typography variant="titleS" component="p" sx={titleStyles}>
            Quotation
          </Typography>
          <Typography variant="bodyS" sx={eventIdStyles}>
            {event.eventId}
          </Typography>
        </Box>
        <StatusChip status={event.status} />
        <Box sx={spacerStyles} />
        <IconButton aria-label="Share PDF" onClick={onShare} disabled={isSharing} sx={mobileShareStyles}>
          <IosShareRoundedIcon />
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
          Event Quotation
        </Typography>
        <Typography variant="bodyS" sx={eventIdStyles}>
          {event.eventId}
        </Typography>
      </Box>
      <StatusChip status={event.status} />
      <Box sx={spacerStyles} />
      <Button variant="contained" startIcon={<IosShareRoundedIcon />} onClick={onShare} loading={isSharing}>
        Share PDF
      </Button>
    </Box>
  );
};

export default QuotationToolbar;
