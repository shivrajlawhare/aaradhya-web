import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { emptyTextStyles, groupStyles, headingStyles, listStyles } from './combined-item-list.styles';

const LIST_LABEL = 'Ceremonies & food/dining events';
const EMPTY_TEXT = 'No ceremonies or food/dining events yet';

interface CombinedItemListProps {
  // One <li> per Item, already in the date's add order.
  rows: ReactNode[];
}

// Figma Section/Item Group Kind=Combined (UI-46): "Ceremonies & food/dining
// events · N" over one column of ceremony and food/dining cards, or the
// empty text when the date has none (UI Redesign 5C.3).
const CombinedItemList = ({ rows }: CombinedItemListProps) => {
  let heading = LIST_LABEL;
  let body: ReactNode = (
    <Typography variant="bodyM" sx={emptyTextStyles}>
      {EMPTY_TEXT}
    </Typography>
  );
  if (rows.length > 0) {
    heading = `${LIST_LABEL} · ${rows.length}`;
    body = (
      <Box component="ul" sx={listStyles}>
        {rows}
      </Box>
    );
  }

  return (
    <Stack component="section" aria-label={LIST_LABEL} sx={groupStyles}>
      <Typography variant="labelS" component="h2" sx={headingStyles}>
        {heading}
      </Typography>
      {body}
    </Stack>
  );
};

export default CombinedItemList;
