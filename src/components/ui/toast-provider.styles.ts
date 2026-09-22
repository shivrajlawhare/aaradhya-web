import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const toastStackStyles: SxProps<Theme> = {
  position: 'fixed',
  bottom: spaceTokens.space24,
  right: spaceTokens.space24,
  zIndex: (theme) => theme.zIndex.snackbar,
  gap: spaceTokens.space8,
  width: '100%',
  maxWidth: 360,
};

// A left accent bar in the brand's own primary-action color, not MUI's
// default filled-green success treatment — the app has exactly one
// "positive/primary" color (accent/accentDeep), reused here rather than
// introducing an unrelated green into the palette.
export const successAlertStyles: SxProps<Theme> = {
  bgcolor: colorTokens.surface,
  color: colorTokens.text,
  borderLeft: `4px solid ${colorTokens.accent}`,
  borderRadius: radiusTokens.radiusSm,
  boxShadow: 3,
  '& .MuiAlert-icon': { color: colorTokens.accentDeep },
};

// MUI's own default `severity="error"` red — the same untouched treatment
// every existing inline `<Alert severity="error">` banner in the app
// already uses; only the shadow/radius are added so it reads as a toast.
export const errorAlertStyles: SxProps<Theme> = {
  borderRadius: radiusTokens.radiusSm,
  boxShadow: 3,
};
