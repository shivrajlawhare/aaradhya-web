import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space24}px`,
};

export const formCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const dateTimeRowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space24}px`,
  flexWrap: 'wrap',
};

export const dateTimeSectionStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`,
};

export const summaryLineStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const tableCardStyles: SxProps<Theme> = {
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  overflow: 'hidden',
};

export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

export const addButtonStyles: SxProps<Theme> = {
  m: `${spaceTokens.space12}px`,
  alignSelf: 'flex-start',
};

export const footerStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space16}px`,
  flexWrap: 'wrap',
};

type FooterCellKind = 'occupancy' | 'charges';

// green/status-confirmed-family for Total Occupancy, yellow/accent-tint-family
// for Total Charges — this story's own Tokens line names these two exact
// token families (SRS §4.7e's shading, carried unchanged into the
// Quotation's own Accommodation table, STORY-070). The palette
// (docs/design/theme-tokens.md) has no literal green token — status-confirmed
// is the closest "positive/settled" semantic tone available, same
// "closest existing token, don't invent a new hex" reasoning
// wizard-stepper.tsx's own "completed" pill already applies using
// accent-tint/accent-deep for the other slot.
export const footerCellStyles = (kind: FooterCellKind): SxProps<Theme> => ({
  bgcolor: kind === 'occupancy' ? colorTokens.statusConfirmedTint : colorTokens.accentTint,
  color: kind === 'occupancy' ? colorTokens.statusConfirmed : colorTokens.accentDeep,
  border: `1px solid ${kind === 'occupancy' ? colorTokens.statusConfirmedTint : colorTokens.accentTint}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  px: `${spaceTokens.space16}px`,
  py: `${spaceTokens.space12}px`,
  fontVariantNumeric: 'tabular-nums',
  flex: 1,
});
