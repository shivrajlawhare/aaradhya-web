import type { SxProps, Theme } from '@mui/material';
import { colorTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space, stroke } = scaleTokens;

const INACTIVE_OPACITY = 0.6;

export const listStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
  width: '100%',
  m: 0,
  p: 0,
  listStyle: 'none',
};

// A deactivated user's whole card reads as muted, not just its status chip.
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

export const usernameStyles: SxProps<Theme> = {
  color: colorTokens.textSoft,
};

export const actionsRowStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[8]}px`,
};

// The select fills the row; the switch and delete sit at its end.
export const roleSelectStyles: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
};
