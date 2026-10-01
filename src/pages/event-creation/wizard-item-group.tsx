import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { emptyTextStyles, groupStyles, headingStyles, listStyles } from './wizard-item-group.styles';

interface WizardItemGroupProps {
  label: string;
  emptyText: string;
  count: number;
  children: ReactNode;
}

// Figma Section/Item Group: "Ceremony events · 2" over that date's rows (a
// 2-up grid on desktop), or the empty text when the date has none.
const WizardItemGroup = ({ label, emptyText, count, children }: WizardItemGroupProps) => {
  const heading = count > 0 ? `${label} · ${count}` : label;

  let body: ReactNode;
  if (count > 0) {
    body = <Box sx={listStyles}>{children}</Box>;
  } else {
    body = (
      <Typography variant="bodyM" sx={emptyTextStyles}>
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack component="section" aria-label={label} sx={groupStyles}>
      <Typography variant="labelS" component="h2" sx={headingStyles}>
        {heading}
      </Typography>
      {body}
    </Stack>
  );
};

export default WizardItemGroup;
