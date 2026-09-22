import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const cardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: { xs: `${spaceTokens.space16}px`, md: `${spaceTokens.space24}px` },
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: `${spaceTokens.space12}px`, md: `${spaceTokens.space16}px` },
};

export const rowStackStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`,
};

// column below `md` — Role/Name/Contact Number/remove-button crammed into
// one row was congested on a phone; stacked, each field gets its own full
// width instead of fighting the others for space.
export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`,
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'stretch', md: 'flex-start' },
};

export const roleLabelStyles: SxProps<Theme> = {
  color: colorTokens.text,
  width: { xs: '100%', md: 160 },
  flexShrink: 0,
  // Lines up with the TextFields beside it (MUI's own input height at
  // default size) only in the row layout — the xs column layout doesn't
  // need this offset, but it's harmless there (no TextField beside it to
  // line up with at that width).
  pt: { xs: 0, md: '16px' },
};

export const roleFieldStyles: SxProps<Theme> = {
  width: { xs: '100%', md: 160 },
  flexShrink: 0,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};
