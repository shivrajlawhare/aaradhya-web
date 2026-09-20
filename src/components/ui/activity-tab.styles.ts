import type { SxProps, Theme } from '@mui/material';
import { spaceTokens } from '../../theme/tokens';

// STORY-081 — one of these per grouped edit action, replacing the old flat
// per-field ListItem. A plain Stack, not a MUI List/ListItem: the inner
// bulleted list of field changes (changeListStyles below) is the only
// content here with genuine ARIA list semantics — nesting a real <ul>/<li>
// inside a MuiListItem's own <li> made `getByRole('listitem')` match both
// levels indistinguishably in tests, so the outer "card per group" level
// deliberately isn't list-semantic at all.
export const rowStyles: SxProps<Theme> = {
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: `${spaceTokens.space4}px`,
  px: `${spaceTokens.space16}px`,
  py: `${spaceTokens.space12}px`,
};

// Every group but the last gets this instead of rowStyles — a bottom
// border replacing the old MuiListItem `divider` prop's own visual.
export const groupDividerStyles: SxProps<Theme> = {
  ...rowStyles,
  borderBottom: '1px solid',
  borderColor: 'divider',
};

export const metaRowStyles: SxProps<Theme> = {
  display: 'flex',
  gap: `${spaceTokens.space8}px`,
};

export const timestampStyles: SxProps<Theme> = {
  color: 'text.disabled', // text-faint (timestamps) — wired in theme.ts
};

export const emptyStateStyles: SxProps<Theme> = {
  p: 3, // space-24
};

// STORY-081 — a real bulleted list of humanized field changes underneath
// each grouped edit action's own actor/timestamp header. A margin/padding
// reset since MUI's own Typography/Box defaults would otherwise carry
// interactive-UI body-copy spacing into this fixed list, same "pinned, not
// inherited" reasoning quotation-document.styles.ts's own footerListStyles
// already documents for an unrelated fixed list on this app.
export const changeListStyles: SxProps<Theme> = {
  margin: 0,
  paddingLeft: `${spaceTokens.space16}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spaceTokens.space4}px`,
};
