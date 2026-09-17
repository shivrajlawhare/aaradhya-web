import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const desktopRowStyles: SxProps<Theme> = {
  gap: `${spaceTokens.space8}px`,
  flexWrap: 'wrap',
};

type PillStatus = 'current' | 'completed' | 'upcoming';

export const pillStyles = (status: PillStatus): SxProps<Theme> => {
  if (status === 'current') {
    return (theme) => ({
      bgcolor: colorTokens.accent,
      color: theme.palette.primary.contrastText,
      border: `1px solid ${colorTokens.accent}`,
      borderRadius: `${radiusTokens.radiusLg}px`,
      px: `${spaceTokens.space16}px`,
      py: `${spaceTokens.space8}px`,
    });
  }
  if (status === 'completed') {
    return {
      bgcolor: colorTokens.accentTint,
      color: colorTokens.accentDeep,
      border: `1px solid ${colorTokens.accentTint}`,
      borderRadius: `${radiusTokens.radiusLg}px`,
      px: `${spaceTokens.space16}px`,
      py: `${spaceTokens.space8}px`,
    };
  }
  return {
    bgcolor: 'transparent',
    color: colorTokens.text,
    border: `1px solid ${colorTokens.line}`,
    borderRadius: `${radiusTokens.radiusLg}px`,
    px: `${spaceTokens.space16}px`,
    py: `${spaceTokens.space8}px`,
  };
};

export const mobileWrapperStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space8}px`,
  width: '100%',
};

export const mobileLabelStyles: SxProps<Theme> = {
  color: colorTokens.text,
};

export const progressBarStyles: SxProps<Theme> = {
  height: 4,
  borderRadius: 2,
  bgcolor: colorTokens.line,
  '& .MuiLinearProgress-bar': {
    bgcolor: colorTokens.accent,
  },
};
