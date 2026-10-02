import type { SxProps, Theme } from '@mui/material';
import { colorTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const INACTIVE_OPACITY = 0.7;

export const listStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
  width: '100%',
  m: 0,
  p: 0,
  listStyle: 'none',
};

// A deactivated entry's whole card reads as muted (70%, Figma UI-29).
export const cardStyles = (active: boolean): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[8]}px`,
  width: '100%',
  bgcolor: 'background.paper',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  p: `${space[16]}px`,
  opacity: active ? 1 : INACTIVE_OPACITY,
});

export const headerRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${space[8]}px`,
};

export const metaStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const actionsRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[8]}px`,
};

export const spacerStyles: SxProps<Theme> = {
  flex: 1,
};
