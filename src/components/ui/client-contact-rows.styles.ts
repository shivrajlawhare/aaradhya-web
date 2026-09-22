import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

export const rowStackStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`, // space-12
};

// column below `md` — Name/Contact number/Role crammed into one row was
// congested on a phone, same fix client-details-step.styles.ts's own
// rowStyles already applies for the wizard's identical-shaped row.
export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`, // space-12
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'stretch', md: 'center' },
  borderBottom: '1px solid', // line token, via border color below
  borderColor: 'divider', // line token — wired in theme.ts
  pb: `${spaceTokens.space12}px`, // space-12
};

export const roleFieldStyles: SxProps<Theme> = {
  minWidth: { xs: '100%', md: 140 },
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};
