import type { SxProps, Theme } from '@mui/material';
import { fontFamilyTokens } from '../../theme/tokens';
import {
  brandLockupStyles,
  headerTextImageStyles,
  markImageStyles,
  PAPER_COLORS,
  PAPER_WIDTH,
  sectionHeadingStyles,
} from '../quotation-preview/quotation-document.styles';

// Figma BEO/Document (UI-44): A4 pages bound only to the paper primitives,
// like the quotation, so they print the same in light and dark mode.
export { brandLockupStyles, headerTextImageStyles, markImageStyles, sectionHeadingStyles };

const PAPER_HEIGHT = 1123;
const PAPER_PADDING = 48;
const HAIRLINE = `1px solid ${PAPER_COLORS.espresso100}`;
const BODY_FONT_SIZE = '11px';
const TITLE_FONT_SIZE = '24px';
const CELL_PADDING = '6px 10px';
const BOX_PADDING = '12px 14px';
const NOTES_GRID_MIN_HEIGHT = 340;
const LIST_INDENT = '18px';

export const documentStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

// One sheet per session; each starts a new PDF page (D5).
export const pageStyles: SxProps<Theme> = {
  width: PAPER_WIDTH,
  minHeight: PAPER_HEIGHT,
  boxSizing: 'border-box',
  bgcolor: PAPER_COLORS.white,
  color: PAPER_COLORS.espresso900,
  fontFamily: fontFamilyTokens.body,
  fontSize: BODY_FONT_SIZE,
  lineHeight: 1.5,
  p: `${PAPER_PADDING}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  printColorAdjust: 'exact',
  WebkitPrintColorAdjust: 'exact',
  breakAfter: 'page',
  pageBreakAfter: 'always',
  '&:last-of-type': { breakAfter: 'auto', pageBreakAfter: 'auto' },
};

export const lockupRowStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
};

export const titleStyles: SxProps<Theme> = {
  fontFamily: fontFamilyTokens.display,
  fontWeight: 800,
  fontSize: TITLE_FONT_SIZE,
  lineHeight: 1.2,
  textAlign: 'center',
  m: 0,
};

// The key/value table: two equal columns, hairline rules, bold labels.
export const detailsTableStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  border: HAIRLINE,
  m: 0,
};

export const detailLabelStyles: SxProps<Theme> = {
  fontWeight: 700,
  p: CELL_PADDING,
  m: 0,
  borderRight: HAIRLINE,
  '&:not(:last-of-type)': { borderBottom: HAIRLINE },
};

export const detailValueStyles: SxProps<Theme> = {
  p: CELL_PADDING,
  m: 0,
  '&:not(:last-of-type)': { borderBottom: HAIRLINE },
};

export const notesSectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

// Kitchen/Menu on the left, the other departments stacked on the right.
export const notesGridStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  border: HAIRLINE,
  minHeight: NOTES_GRID_MIN_HEIGHT,
};

export const kitchenColumnStyles: SxProps<Theme> = {
  borderRight: HAIRLINE,
};

export const departmentColumnStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
};

export const boxStyles: SxProps<Theme> = {
  p: BOX_PADDING,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  '&:not(:last-of-type)': { borderBottom: HAIRLINE },
};

// The department name, and the bold Veg/Non-Veg lines.
export const boxTitleStyles: SxProps<Theme> = {
  fontWeight: 700,
  m: 0,
};

export const paxLinesStyles: SxProps<Theme> = {
  fontWeight: 700,
  m: 0,
};

export const menuHeadingStyles: SxProps<Theme> = {
  fontWeight: 600,
  m: 0,
};

export const numberedListStyles: SxProps<Theme> = {
  m: 0,
  pl: LIST_INDENT,
};
