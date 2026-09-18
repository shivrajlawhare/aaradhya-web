import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space24}px`,
};

export const eventTypeCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const optionRowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`,
  flexWrap: 'wrap',
};

// The Event Type select and its own Custom text field sibling, and the Add
// Line Item form's Name field.
export const optionFieldStyles: SxProps<Theme> = {
  minWidth: 200,
};

export const noteFieldStyles: SxProps<Theme> = {
  minWidth: 280,
};

export const amountFieldStyles: SxProps<Theme> = {
  minWidth: 160,
};

export const inlineRowStyles: SxProps<Theme> = {
  alignItems: 'center',
  gap: `${spaceTokens.space8}px`,
};

export const manualItemAmountCellStyles: SxProps<Theme> = {
  alignItems: 'center',
  gap: `${spaceTokens.space8}px`,
  justifyContent: 'flex-end',
};

// The manual line item's own name + optional note (Sub Cost Item column) —
// stacked vertically, not left to run together on one line the way two
// adjacent Typography elements with no custom variantMapping otherwise
// would (this app's own custom variants default to an inline <span>).
export const manualItemNameCellStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space4}px`,
};

export const manualItemNoteStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const summaryCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  overflow: 'hidden',
};

export const dateBlockHeaderStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface2,
};

export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};

// accent-tint — this story's own Tokens line, for the Food Cost and Grand
// Total rows.
export const shadedRowStyles: SxProps<Theme> = {
  bgcolor: colorTokens.accentTint,
};

export const shadedCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
  color: colorTokens.accentDeep,
  fontWeight: 600,
};

export const gstFieldStyles: SxProps<Theme> = {
  width: 90,
};

export const manualItemsCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`,
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};

export const submittingNoteStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};
