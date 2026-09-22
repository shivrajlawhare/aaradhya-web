import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { colorTokens, radiusTokens, spaceTokens } from '../../theme/tokens';

export const navContentStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  gap: `${spaceTokens.space8}px`,
  p: `${spaceTokens.space16}px`,
};

// STORY-087 — the header-text.svg asset's own two brand colors (#FF5B00
// orange, #3D3D3D near-black grey — a vector trace, not embedded raster, so
// no color-filter hack over raster data is possible) were designed against
// the Quotation document's white page background (quotation-document.
// styles.ts's own headerTextImageStyles). On the drawer's own dark
// background (colorTokens.drawerBg, close in value to that same near-black
// grey) the grey portion of the wordmark would disappear into it — a light
// rounded backing chip is the simplest fix, keeping the asset itself
// pixel-identical to how it already renders on the Quotation.
// Same outer position/padding the old text-only wordmarkStyles used
// (px: space-8, py: space-16), now as margin around the chip rather than
// padding on the text itself, so the chip's own edges sit exactly where the
// text's own edges used to.
export const wordmarkChipStyles: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  bgcolor: colorTokens.surface,
  borderRadius: `${radiusTokens.radiusSm}px`,
  p: `${spaceTokens.space8}px`,
  mx: `${spaceTokens.space8}px`,
  my: `${spaceTokens.space16}px`,
};

// height fixed, width auto — preserves the asset's own ~5.07:1 aspect ratio,
// same sizing convention quotation-document.styles.ts's own
// headerTextImageStyles already establishes. Comfortably fits the drawer's
// own 280px width (app-shell.styles.ts's own DRAWER_WIDTH) once the
// navContentStyles/chip padding above is accounted for.
export const wordmarkImageStyles: SxProps<Theme> = {
  display: 'block',
  height: 32,
  width: 'auto',
};

export const navRowsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space4}px`,
};

// Always at the bottom of the column, however many rows precede it — a
// role with only Dashboard/Events/Calendar/Logout doesn't pull Logout
// upward oddly, since `mt: auto` pins it against the Stack's own height
// (100%) rather than against its sibling rows.
export const logoutRowWrapperStyles: SxProps<Theme> = {
  mt: 'auto',
};

export const navRowStyles = (selected: boolean): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  gap: `${spaceTokens.space12}px`,
  px: `${spaceTokens.space12}px`,
  py: `${spaceTokens.space12}px`,
  borderRadius: `${radiusTokens.radiusSm}px`,
  bgcolor: selected ? alpha(colorTokens.accent, 0.18) : 'transparent',
  color: selected ? colorTokens.accent : colorTokens.drawerTextMuted,
  textDecoration: 'none',
  cursor: 'pointer',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  font: 'inherit',
  '&:hover': {
    bgcolor: selected ? alpha(colorTokens.accent, 0.18) : alpha(colorTokens.drawerText, 0.06),
  },
});

export const navRowIconStyles: SxProps<Theme> = {
  display: 'flex',
  color: 'inherit',
  '& svg': { fontSize: 20 },
};

export const navRowLabelStyles = (selected: boolean): SxProps<Theme> => ({
  color: 'inherit',
  fontWeight: selected ? 600 : 400,
});
