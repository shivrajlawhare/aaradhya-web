import type { SxProps, Theme } from '@mui/material';
import { colorTokens, paletteVar, scaleTokens } from '../../theme/tokens';

const { radius, space } = scaleTokens;

const STATUS_DOT_SIZE = 6;

// "• Active" on the confirmed (green) tint; Inactive on the completed (muted)
// tint. The dot is the chip's own ::before.
export const statusChipStyles = (active: boolean): SxProps<Theme> => ({
  bgcolor: active ? colorTokens.statusConfirmedTint : colorTokens.statusCompletedTint,
  color: active ? colorTokens.statusConfirmed : colorTokens.statusCompleted,
  borderRadius: `${radius.pill}px`,
  fontWeight: 600,
  '& .MuiChip-label': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${space[4]}px`,
  },
  '& .MuiChip-label::before': {
    content: '""',
    width: STATUS_DOT_SIZE,
    height: STATUS_DOT_SIZE,
    borderRadius: '50%',
    bgcolor: 'currentColor',
  },
});

export const deleteButtonStyles: SxProps<Theme> = {
  color: paletteVar('brand-destructiveText'),
};
