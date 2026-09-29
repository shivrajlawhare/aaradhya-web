import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Figma `Loader/Page`: an 88 px accent ring spinning around an 80 px disc
// holding the logo mark, caption underneath.
const MARK_BOX_SIZE = 112;
const DISC_SIZE = 80;
const LOGO_WIDTH = 49;
const LOGO_HEIGHT = 44;

export const RING_SIZE = 88;
// CircularProgress thickness is in its 44-unit viewBox: 1.5 renders a 3 px
// stroke at 88 px.
export const RING_THICKNESS = 1.5;

export const pageLoaderStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: `${space[16]}px`,
  p: `${space[24]}px`,
};

export const markStyles: SxProps<Theme> = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: MARK_BOX_SIZE,
  height: MARK_BOX_SIZE,
};

export const ringStyles: SxProps<Theme> = {
  position: 'absolute',
  color: 'primary.main',
};

export const discStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: DISC_SIZE,
  height: DISC_SIZE,
  borderRadius: '50%',
  bgcolor: 'background.paper',
  border: `1px solid ${paletteVar('divider')}`,
};

export const logoStyles: SxProps<Theme> = {
  width: LOGO_WIDTH,
  height: LOGO_HEIGHT,
};

export const captionStyles: SxProps<Theme> = {
  color: 'text.secondary',
};
