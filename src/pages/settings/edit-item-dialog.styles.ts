import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

// Room above the first field so its label isn't clipped under the title.
export const fieldStackStyles: SxProps<Theme> = {
  gap: `${space[16]}px`,
  pt: `${space[8]}px`,
};
