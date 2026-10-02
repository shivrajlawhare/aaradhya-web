import type { SxProps, Theme } from '@mui/material';
import { shadowTokens } from '../../theme/tokens';

export const scaledPaperFrameStyles: SxProps<Theme> = {
  width: '100%',
  minWidth: 0,
};

export const scaledPaperStyles = (scale: number): SxProps<Theme> => ({
  zoom: scale,
  width: 'fit-content',
  boxShadow: shadowTokens.softLg,
});
