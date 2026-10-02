import type { SxProps, Theme } from '@mui/material';
import { fontFamilyTokens } from '../../theme/tokens';

// Figma Quotation/Document (UI-21 / UI-42): the paper is bound only to the
// Primitives collection, never to theme tokens, so it stays light paper in
// dark mode and prints the same everywhere (preview and the server-side
// PDF render). Fonts are the app's own families.
export const PAPER_COLORS = {
  white: '#FFFFFF',
  espresso50: '#F6EFE8',
  espresso100: '#EDE3D6',
  espresso700: '#432A1D',
  espresso900: '#200F07',
  custard100: '#FFF9EB',
  leaf100: '#D8F2E4',
  saffron100: '#FCEFD0',
  orange500: '#F77331',
};

// A4 at 96 dpi — the paper is a fixed sheet, scaled (not reflowed) on
// small screens by the preview page.
export const PAPER_WIDTH = 794;
const PAPER_PADDING = 48;
const HAIRLINE = `1px solid ${PAPER_COLORS.espresso100}`;
const BODY_FONT_SIZE = '11px';

export const rootStyles: SxProps<Theme> = {
  width: PAPER_WIDTH,
  boxSizing: 'border-box',
  bgcolor: PAPER_COLORS.white,
  color: PAPER_COLORS.espresso900,
  fontFamily: fontFamilyTokens.body,
  fontSize: BODY_FONT_SIZE,
  lineHeight: 1.5,
  p: `${PAPER_PADDING}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
  // Exact paper colours in the PDF (shaded cells, the orange rule).
  printColorAdjust: 'exact',
  WebkitPrintColorAdjust: 'exact',
};

// Letterhead: lockup left, org details right, an orange 2 px rule under.
export const headerRowStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  pb: '16px',
  borderBottom: `2px solid ${PAPER_COLORS.orange500}`,
};

export const brandLockupStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

export const markImageStyles: SxProps<Theme> = {
  width: 32,
  height: 32,
  flexShrink: 0,
};

// The wordmark image (~5.07:1) off a fixed height.
export const headerTextImageStyles: SxProps<Theme> = {
  height: '20px',
  width: 'auto',
};

export const orgDetailsStyles: SxProps<Theme> = {
  textAlign: 'right',
  fontSize: '10px',
  lineHeight: 1.6,
  color: PAPER_COLORS.espresso700,
};

export const titleRowStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: '16px',
};

export const titleTextStyles: SxProps<Theme> = {
  fontFamily: fontFamilyTokens.display,
  fontWeight: 700,
  fontSize: '26px',
  lineHeight: 1.2,
  m: 0,
};

export const quotationDateStyles: SxProps<Theme> = {
  fontSize: BODY_FONT_SIZE,
  color: PAPER_COLORS.espresso700,
};

export const sectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

// Only print/PDF honours these; the on-screen sheet is unchanged.
const pageBreakBeforeStyles = {
  breakBefore: 'page',
  pageBreakBefore: 'always',
};

// Each per-date Event Details table starts its own PDF page, including the
// first, so page 1 ends after Accommodation Details.
export const dateSectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  ...pageBreakBeforeStyles,
};

// The Total Cost Summary always starts its own page too.
export const totalCostSummarySectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  ...pageBreakBeforeStyles,
};

// Bricolage Bold 14 with a 4 × 16 orange accent bar.
export const sectionHeadingStyles: SxProps<Theme> = {
  fontFamily: fontFamilyTokens.display,
  fontWeight: 700,
  fontSize: '14px',
  lineHeight: '18px',
  color: PAPER_COLORS.espresso900,
  m: 0,
  pl: '12px',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '1px',
    width: '4px',
    height: '16px',
    borderRadius: '2px',
    bgcolor: PAPER_COLORS.orange500,
  },
};

// The theme's own table look (56 px body rows, uppercase letter-spaced
// heads on brand.subtle) must not leak onto the paper: the head rule needs
// a selector stronger than the theme's '.MuiTableHead-root .MuiTableCell-head'.
export const tableStyles: SxProps<Theme> = {
  borderCollapse: 'collapse',
  width: '100%',
  '& th, & td': {
    border: HAIRLINE,
    fontFamily: fontFamilyTokens.body,
    fontSize: BODY_FONT_SIZE,
    lineHeight: 1.5,
    height: 'auto',
    padding: '6px 8px',
    verticalAlign: 'top',
    color: PAPER_COLORS.espresso900,
  },
  '& .MuiTableHead-root .MuiTableCell-head': {
    fontFamily: fontFamilyTokens.body,
    fontSize: BODY_FONT_SIZE,
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: 'normal',
    textTransform: 'none',
    color: PAPER_COLORS.espresso900,
    bgcolor: PAPER_COLORS.custard100,
  },
  '& tr': { breakInside: 'avoid' },
};

export const rowLabelCellStyles: SxProps<Theme> = {
  fontWeight: 600,
};

export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  whiteSpace: 'nowrap',
};

// Header cells over numeric columns line up with their values. '&&'
// out-ranks tableStyles' own '& th' rule.
export const numericHeaderStyles: SxProps<Theme> = {
  '&&': { textAlign: 'right' },
};

export const totalOccupancyCellStyles: SxProps<Theme> = {
  bgcolor: PAPER_COLORS.leaf100,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
};

export const highlightLabelCellStyles: SxProps<Theme> = {
  bgcolor: PAPER_COLORS.saffron100,
  fontWeight: 600,
};

export const highlightNumericCellStyles: SxProps<Theme> = {
  bgcolor: PAPER_COLORS.saffron100,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  whiteSpace: 'nowrap',
};

// The discount rows sit under the last two columns only; the cell to their
// left is blank paper (no fill, no left/top/bottom rules).
export const discountSpacerCellStyles: SxProps<Theme> = {
  '&&': { borderLeft: 'none', borderBottom: 'none', borderTop: 'none' },
};

export const ceremonyRowStyles: SxProps<Theme> = {
  bgcolor: PAPER_COLORS.espresso50,
  fontWeight: 600,
};

// A manual line item's note, merged across Description → GST and centred
// (example_quatation_3.pdf).
export const mergedDescriptionCellStyles: SxProps<Theme> = {
  textAlign: 'center',
};

export const bulletedListStyles: SxProps<Theme> = {
  m: 0,
  pl: '20px',
  listStyleType: 'disc',
  '& li + li': { mt: '4px' },
  '& li::marker': { color: PAPER_COLORS.orange500 },
};

export const numberedListStyles: SxProps<Theme> = {
  m: 0,
  pl: '20px',
  listStyleType: 'decimal',
  '& li + li': { mt: '4px' },
  '& li::marker': { fontWeight: 700 },
};

// Documents Required (284) beside Bank Account Details (fills), as a print-
// safe grid that never splits across a page.
export const documentsAndBankStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: '284px minmax(0, 1fr)',
  columnGap: '24px',
  alignItems: 'start',
  breakInside: 'avoid',
};

export const bankLabelCellStyles: SxProps<Theme> = {
  width: 140,
  fontWeight: 600,
};

export const closingStyles: SxProps<Theme> = {
  mt: '24px',
  display: 'flex',
  flexDirection: 'column',
};

export const closingLineStyles: SxProps<Theme> = {
  fontSize: BODY_FONT_SIZE,
};

export const closingNameStyles: SxProps<Theme> = {
  fontSize: BODY_FONT_SIZE,
  fontWeight: 700,
};
