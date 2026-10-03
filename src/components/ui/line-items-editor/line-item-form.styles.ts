import type { SxProps, Theme } from '@mui/material';
import { scaleTokens } from '../../../theme/tokens';

const { space } = scaleTokens;

const AMOUNT_FIELD_WIDTH = 200;
const ONE_ROW_MIN_WIDTH = 640;

// A size container: the form sits full-width in wizard step 5 but inside the
// narrow Total Cost Summary panel on Event Detail, so the fields lay out by
// the form's own width rather than the viewport's.
export const formStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: `${space[12]}px`,
  containerType: 'inline-size',
};

// Name · Note · Total Cost on one row when the form is wide enough, stacked
// otherwise.
export const fieldsStyles: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: `${space[12]}px`,
  [`@container (min-width: ${ONE_ROW_MIN_WIDTH}px)`]: {
    gridTemplateColumns: `1fr 2fr ${AMOUNT_FIELD_WIDTH}px`,
  },
};

export const actionsStyles: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  gap: `${space[8]}px`,
};

export const submitButtonStyles: SxProps<Theme> = {
  alignSelf: { xs: 'stretch', md: 'flex-start' },
};
