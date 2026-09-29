import type { TypographyVariantsOptions } from '@mui/material/styles';
import { fontFamilyTokens } from './tokens';

// Handoff board 04. Below `md` each variant switches to the Figma mobile/*
// size through its own media query (typography entries accept nested media
// queries, not breakpoint objects).
const belowMd = '@media (max-width:899.95px)';

const px = (size: number) => `${size}px`;

const display = (size: number, line: number, weight: number, tracking: string) => ({
  fontFamily: fontFamilyTokens.display,
  fontWeight: weight,
  fontSize: px(size),
  lineHeight: px(line),
  letterSpacing: tracking,
});

const body = (size: number, line: number, weight: number) => ({
  fontFamily: fontFamilyTokens.body,
  fontWeight: weight,
  fontSize: px(size),
  lineHeight: px(line),
});

const mobile = (size: number, line: number) => ({ [belowMd]: { fontSize: px(size), lineHeight: px(line) } });

const h1 = { ...display(40, 48, 700, '-0.01em'), ...mobile(28, 34) };
const h2 = { ...display(28, 36, 700, '0'), ...mobile(22, 28) };
const h3 = { ...display(22, 28, 600, '0'), ...mobile(18, 24) };
const bodyM = body(14, 22, 400);
const bodyS = body(12, 18, 400);
const labelM = body(13, 18, 600);

export const typography: TypographyVariantsOptions = {
  fontFamily: fontFamilyTokens.body,
  displayXl: { ...display(72, 76, 800, '-0.02em'), ...mobile(44, 48) },
  display: { ...display(56, 60, 800, '-0.02em'), ...mobile(36, 40) },
  h1,
  h2,
  h3,
  titleL: h2,
  titleM: h3,
  titleS: { ...body(18, 26, 600), ...mobile(16, 24) },
  bodyL: body(16, 24, 400),
  bodyM,
  bodyS,
  body1: bodyM,
  body2: bodyS,
  labelL: body(15, 20, 600),
  labelM,
  labelS: {
    ...body(11, 16, 700),
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  numeric: { ...body(16, 24, 600), fontVariantNumeric: 'tabular-nums' },
  button: { ...labelM, textTransform: 'none' },
};
