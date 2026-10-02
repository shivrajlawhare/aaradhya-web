import { Box, Typography } from '@mui/material';
import type { EventSummary } from './event-summary';
import { grandTotalTileStyles, labelStyles, stripStyles, tileStyles, valueStyles } from './event-summary-strip.styles';
import { formatAmount } from './format-amount';

interface SummaryTileProps {
  area: string;
  label: string;
  value: string;
}

const SummaryTile = ({ area, label, value }: SummaryTileProps) => (
  <Box sx={tileStyles(area)}>
    <Typography variant="labelS" component="dt" sx={labelStyles}>
      {label}
    </Typography>
    <Typography variant="titleS" component="dd" sx={valueStyles}>
      {value}
    </Typography>
  </Box>
);

interface EventSummaryStripProps {
  summary: EventSummary;
}

// The Event Detail Summary Strip (D9): Dates · Venues · Guests · Sessions,
// plus the Grand Total for the Event Manager.
const EventSummaryStrip = ({ summary }: EventSummaryStripProps) => {
  const hasGrandTotal = summary.grandTotal !== null;

  return (
    <Box component="dl" aria-label="Event summary" sx={stripStyles(hasGrandTotal)}>
      <SummaryTile area="dates" label="Dates" value={summary.dates} />
      <SummaryTile area="venues" label="Venues" value={summary.venues} />
      <SummaryTile area="guests" label="Guests" value={`${summary.guests} pax`} />
      <SummaryTile area="sessions" label="Sessions" value={String(summary.sessions)} />
      {summary.grandTotal !== null && (
        <Box sx={grandTotalTileStyles}>
          <Typography variant="labelS" component="dt" sx={labelStyles}>
            Grand Total
          </Typography>
          <Typography variant="titleS" component="dd" sx={valueStyles}>
            {formatAmount(Math.round(summary.grandTotal))}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EventSummaryStrip;
