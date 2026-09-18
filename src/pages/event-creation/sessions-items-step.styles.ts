import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const wrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space24}px`,
};

export const reminderStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const sectionCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: `${spaceTokens.space24}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space16}px`,
};

export const rowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space12}px`,
  flexWrap: 'wrap',
};

// The Event Name/Meal Name select and their own Custom text field siblings
// — a fixed minimum width so the row doesn't visually jump narrow when a
// short preset name is selected.
export const optionFieldStyles: SxProps<Theme> = {
  minWidth: 200,
};

// rowStyles plus vertical centering — Pax/L.S./Cost sit at different
// natural heights (a text field vs. a label+switch pair), so this row
// needs it where the others don't.
export const paxRowStyles: SxProps<Theme> = {
  ...rowStyles,
  alignItems: 'center',
};

export const lsToggleRowStyles: SxProps<Theme> = {
  alignItems: 'center',
  gap: `${spaceTokens.space8}px`,
};

export const timeFieldStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`,
};

// type-label-s — this story's own Tokens line, for the Start/End time mini
// headers above each StaticTimePicker (a smaller label than
// event-details-step.tsx's own titleM section headers, a deliberate
// per-story difference, not an inconsistency).
export const miniFieldLabelStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const previewLineStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};

// surface-2 (row card fill) — this story's own Tokens line, for each
// already-added Ceremony/Food row, distinct from the white (surface)
// section form card above it.
export const rowCardStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface2,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusSm}px`,
  p: `${spaceTokens.space12}px`,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${spaceTokens.space12}px`,
  cursor: 'pointer',
};

// The row currently loaded into the form above for editing (this story's
// own AC: "clicking a row re-populates the form... for editing") — an
// accent-colored border so it's visually distinguishable from the other
// added rows while being edited.
export const rowCardEditingStyles: SxProps<Theme> = {
  ...rowCardStyles,
  border: `1px solid ${colorTokens.accent}`,
};

export const rowListStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`,
};

// accent (on) / text-faint (off) — this story's own Tokens line, for the
// L.S. toggle's own label.
export const lsLabelStyles = (isOn: boolean): SxProps<Theme> => ({
  color: isOn ? colorTokens.accent : colorTokens.textFaint,
  fontWeight: 600,
});

export const lsSwitchStyles: SxProps<Theme> = {
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: colorTokens.accent,
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: colorTokens.accent,
  },
};
