import type { SxProps, Theme } from '@mui/material';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const navListStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space4}px`,
  width: 220,
  flexShrink: 0,
  bgcolor: colorTokens.surface2,
  border: `1px solid ${colorTokens.line}`,
  borderRadius: `${radiusTokens.radiusMd}px`, // radius-md (cards)
  p: `${spaceTokens.space8}px`,
};

export const sectionRowStyles = (selected: boolean): SxProps<Theme> => ({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  border: 'none',
  font: 'inherit',
  cursor: 'pointer',
  px: `${spaceTokens.space12}px`,
  py: `${spaceTokens.space12}px`,
  borderRadius: `${radiusTokens.radiusSm}px`,
  bgcolor: selected ? colorTokens.accentTint : 'transparent',
  color: selected ? colorTokens.accent : colorTokens.text,
  fontWeight: selected ? 600 : 400,
  '&:hover': {
    bgcolor: selected ? colorTokens.accentTint : colorTokens.surface,
  },
});
