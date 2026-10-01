import type { SxProps, Theme } from '@mui/material';
import { paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, stroke } = scaleTokens;

export const timePickerCardStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  border: `${stroke.default}px solid ${paletteVar('divider')}`,
  borderRadius: `${radius.lg}px`,
  overflow: 'hidden',
  bgcolor: 'background.paper',
};
