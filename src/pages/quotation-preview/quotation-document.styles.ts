import type { SxProps, Theme } from '@mui/material';

// This story's own Tokens line: "N/A — the Quotation's own typography/color
// is a fixed reproduction of the reference PDFs' letterhead styling, not
// the app's interactive-UI token set." Every value below is therefore
// pinned directly against example_quatation_1.pdf/example_quatation_2.pdf
// (docs/example_quatations, aaradhya-api repo), not theme/tokens.ts —
// deliberately not reusing colorTokens.accent (this app's own orange) for
// the section-heading blue, or fontFamilyTokens.body/.display, since both
// PDFs use a plain serif body face and a distinct blue for every "Client
// Details"/"Event Details" heading that has nothing to do with the app's
// own interactive theme.
export const DOCUMENT_FONT_FAMILY = '"Times New Roman", Times, serif';
const HEADING_BLUE = '#1F4E79';
const BORDER_COLOR = '#000000';
const MUTED_TEXT = '#4A4A4A';

export const rootStyles: SxProps<Theme> = {
  bgcolor: '#FFFFFF',
  color: '#000000',
  fontFamily: DOCUMENT_FONT_FAMILY,
  p: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  maxWidth: 900,
  mx: 'auto',
  width: '100%',
  boxSizing: 'border-box',
};

export const headerRowStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '16px',
  pb: '12px',
  borderBottom: `1px solid ${BORDER_COLOR}`,
};

export const brandLockupStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

export const markImageStyles: SxProps<Theme> = {
  width: 56,
  height: 56,
  flexShrink: 0,
};

export const wordmarkNameStyles: SxProps<Theme> = {
  fontFamily: DOCUMENT_FONT_FAMILY,
  fontWeight: 700,
  fontSize: '22px',
  letterSpacing: '1px',
  lineHeight: 1.1,
  color: '#000000',
};

export const wordmarkTaglineStyles: SxProps<Theme> = {
  fontFamily: DOCUMENT_FONT_FAMILY,
  fontSize: '10px',
  letterSpacing: '2px',
  color: MUTED_TEXT,
};

export const orgDetailsStyles: SxProps<Theme> = {
  textAlign: 'right',
  color: '#000000',
};

// Font styling only — textAlign: 'right' lives on the wrapping Box above
// (orgDetailsStyles) and is inherited by these lines rather than repeated
// on each one.
export const orgDetailsLineStyles: SxProps<Theme> = {
  fontFamily: DOCUMENT_FONT_FAMILY,
  fontSize: '11px',
  lineHeight: 1.5,
};

// A 3-column grid (empty | title | date) keeps "Event Quotation" visually
// centered on the row regardless of how wide the date text on its right is
// — an inline flex row with the date simply pushed right wouldn't center
// the title against the page, only against the remaining space.
export const titleRowStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  columnGap: '8px',
};

export const titleTextStyles: SxProps<Theme> = {
  fontFamily: DOCUMENT_FONT_FAMILY,
  fontWeight: 700,
  fontSize: '20px',
  textAlign: 'center',
  gridColumn: 2,
};

export const quotationDateStyles: SxProps<Theme> = {
  gridColumn: 3,
  justifySelf: 'end',
  fontFamily: DOCUMENT_FONT_FAMILY,
  fontWeight: 700,
  fontSize: '12px',
};

export const sectionStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

export const sectionHeadingStyles: SxProps<Theme> = {
  fontFamily: DOCUMENT_FONT_FAMILY,
  fontStyle: 'italic',
  fontWeight: 700,
  color: HEADING_BLUE,
  fontSize: '13px',
};

export const tableScrollStyles: SxProps<Theme> = {
  overflowX: 'auto',
};

export const tableStyles: SxProps<Theme> = {
  borderCollapse: 'collapse',
  width: '100%',
  '& th, & td': {
    border: `1px solid ${BORDER_COLOR}`,
    fontFamily: DOCUMENT_FONT_FAMILY,
    fontSize: '12px',
    padding: '4px 8px',
    verticalAlign: 'top',
    color: '#000000',
  },
  '& th': {
    fontWeight: 700,
    textAlign: 'left',
  },
};

export const rowLabelCellStyles: SxProps<Theme> = {
  fontWeight: 700,
};

export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};
