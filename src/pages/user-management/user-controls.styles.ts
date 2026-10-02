import type { SxProps, Theme } from '@mui/material';
import { paletteVar } from '../../theme/tokens';

export const deleteButtonStyles: SxProps<Theme> = {
  color: paletteVar('brand-destructiveText'),
};
