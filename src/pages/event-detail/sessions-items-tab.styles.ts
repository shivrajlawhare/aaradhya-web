import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

// STORY-079 — duplicated verbatim from sessions-items-step.styles.ts (the
// wizard's own identical recipe), not cross-imported — same "documented
// duplication over a cross-directory event-creation/↔event-detail/ import"
// convention this codebase already applies elsewhere (e.g. session-form.
// styles.ts's own setupCardStyles vs event-details-step.styles.ts's).

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

export const optionFieldStyles: SxProps<Theme> = {
  minWidth: 200,
};

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

export const miniFieldLabelStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const previewLineStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const addButtonStyles: SxProps<Theme> = {
  alignSelf: 'flex-start',
};

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

// A read-only row (non-EventManager) reuses rowCardStyles minus the click
// affordance — no onClick is ever wired for it, but the pointer cursor from
// rowCardStyles would otherwise mislead a viewer who can't actually edit.
export const rowCardReadOnlyStyles: SxProps<Theme> = {
  ...rowCardStyles,
  cursor: 'default',
};

export const rowCardEditingStyles: SxProps<Theme> = {
  ...rowCardStyles,
  border: `1px solid ${colorTokens.accent}`,
};

export const rowListStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`,
};

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
