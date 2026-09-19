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

// Replaces the previous hand-typed "AARADHYA"/"A COMPLETE DESTINATION"
// Typography lines with the org's own real wordmark image (intrinsic
// 50727×10000, ~5.07:1) — `width: auto` preserves that aspect ratio off a
// single fixed height, matching the reference PDFs' own header proportions
// (crown mark roughly square, wordmark spanning a wider strip beside it).
export const headerTextImageStyles: SxProps<Theme> = {
  height: '44px',
  width: 'auto',
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

// Each per-date Event Details table always starts its own page in the
// generated PDF — applied to every one of them, including the first, so
// page 1 ends right after Accommodation Details rather than spilling the
// first date's own table onto it. `breakBefore` is the modern CSS
// Fragmentation property; `pageBreakBefore` is the older alias some print
// engines still key off — both target the same outcome, harmless to set
// together. Has no visible effect on-screen (only `@media print`/PDF
// generation honors either property), so the live preview is unchanged.
export const dateSectionStyles: SxProps<Theme> = {
  ...sectionStyles,
  breakBefore: 'page',
  pageBreakBefore: 'always',
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

// textAlign: 'right' — both reference PDFs right-align every numeric
// column (Occ./Tariff/No. Of Rooms/Total including GST here, STORY-070;
// No. Of Guests/Selected Venue Cost in STORY-069's own Event Details), a
// detail STORY-069 itself didn't apply — fixed here rather than left
// inconsistent, since it's the same shared style both tables already use.
export const numericCellStyles: SxProps<Theme> = {
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
};

// Sampled from example_quatation_1.pdf/example_quatation_2.pdf's own Total
// Occ./Total Charges footer cell shading (STORY-070's own AC, SRS §4.7e) —
// a visual best-effort match, not a pixel-exact extraction (no tooling here
// samples a PDF's own fill color), the same kind of explicit, separate,
// one-time design decision HEADING_BLUE above already is.
const TOTAL_OCCUPANCY_GREEN = '#A9D18E';
const TOTAL_CHARGES_AMBER = '#FFD966';

// Includes numericCellStyles' own properties directly rather than an sx
// array — MUI's TableCell sx typing rejects an array of two SxProps<Theme>
// values nested together (a plain array of style objects works, but not
// one mixing already-typed SxProps values), so the numeric-cell look is
// folded in here instead of composed at the call site.
export const totalOccupancyCellStyles: SxProps<Theme> = {
  bgcolor: TOTAL_OCCUPANCY_GREEN,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
};

export const totalChargesCellStyles: SxProps<Theme> = {
  bgcolor: TOTAL_CHARGES_AMBER,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
};

// Sampled from both reference PDFs' own Ceremony-row shading (STORY-071's
// own Tokens line) — a visual best-effort match, same "not a pixel-exact
// extraction" caveat TOTAL_OCCUPANCY_GREEN/TOTAL_CHARGES_AMBER above
// already carry.
const CEREMONY_ROW_GREY = '#D9D9D9';

export const ceremonyRowStyles: SxProps<Theme> = {
  bgcolor: CEREMONY_ROW_GREY,
  fontWeight: 700,
};

// STORY-072 — the Total Cost Summary's own Food Cost and Grand Total rows
// (SRS §4.7e/FR-QUO-9's color-coding note), reusing the exact same amber
// shade TOTAL_CHARGES_AMBER above already samples from the reference PDFs'
// Accommodation footer — the two are visually indistinguishable in both
// reference documents, not two independently-sampled colors.
export const costSummaryHighlightLabelCellStyles: SxProps<Theme> = {
  bgcolor: TOTAL_CHARGES_AMBER,
  fontWeight: 700,
};

export const costSummaryHighlightNumericCellStyles: SxProps<Theme> = {
  bgcolor: TOTAL_CHARGES_AMBER,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
};

// STORY-073 — the static footer's Terms & Conditions (bulleted) and
// Documents Required (numbered) lists. A plain margin reset plus a fixed
// left indent for the marker itself — MUI's own Typography/Box defaults
// would otherwise carry the app's interactive body-copy margins into this
// fixed-reproduction section, same "pinned, not inherited" reasoning
// rootStyles' own DOCUMENT_FONT_FAMILY choice already documents. The
// inter-item gap is a sibling-combinator margin, not `display: flex` +
// `gap` on the list itself — flex blockifies every `<li>` into a flex
// item, which suppresses its `::marker` box entirely in a real browser
// (jsdom doesn't run layout, so this wouldn't have shown up in a test),
// silently dropping every bullet/number despite `listStyleType` being set.
const footerListStyles: SxProps<Theme> = {
  fontFamily: DOCUMENT_FONT_FAMILY,
  fontSize: '12px',
  margin: 0,
  paddingLeft: '20px',
  '& li + li': {
    marginTop: '2px',
  },
};

export const bulletedListStyles: SxProps<Theme> = {
  ...footerListStyles,
  listStyleType: 'disc',
};

export const numberedListStyles: SxProps<Theme> = {
  ...footerListStyles,
  listStyleType: 'decimal',
};

// The Quotation's own closing "Regards / Aaradhya Banquets" lines — plain
// text, no heading/table styling, matching the reference PDFs' own
// unadorned final two lines.
export const closingLineStyles: SxProps<Theme> = {
  fontFamily: DOCUMENT_FONT_FAMILY,
  fontSize: '12px',
};
