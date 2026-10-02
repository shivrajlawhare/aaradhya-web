import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../theme/tokens';

const { space } = scaleTokens;

const PANEL_WIDTH = 560;

// Figma 07 Event Detail / Review & Quotation: the cost panel beside the
// Quotation card; stacked on mobile.
export const layoutStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: `minmax(0, ${PANEL_WIDTH}px) minmax(0, 1fr)` },
  gap: { xs: `${space[16]}px`, md: `${space[24]}px` },
  alignItems: 'start',
};

export const previewLinkStyles: SxProps<Theme> = {
  alignSelf: { xs: 'center', md: 'flex-start' },
};
