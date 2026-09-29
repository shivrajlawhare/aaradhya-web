import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import pageHeaderDecorDark from '../../assets/decor/page-header-dark.svg';
import pageHeaderDecorMobileDark from '../../assets/decor/page-header-mobile-dark.svg';
import pageHeaderDecorMobile from '../../assets/decor/page-header-mobile.svg';
import pageHeaderDecor from '../../assets/decor/page-header.svg';
import {
  actionsStyles,
  desktopDecorFrameStyles,
  desktopDecorImageStyles,
  eyebrowStyles,
  mobileDecorFrameStyles,
  mobileDecorImageStyles,
  pageHeaderStyles,
  supportingTextStyles,
  textColumnStyles,
  titleStyles,
} from './page-header.styles';
import ThemedImage from './themed-image';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  supportingText?: ReactNode;
  actions?: ReactNode;
  isTitleHiddenOnMobile?: boolean;
}

// The page header band from the redesign's page anatomy: eyebrow, h1,
// optional supporting line and actions, abstract decor on the right.
const PageHeader = ({ eyebrow, title, supportingText, actions, isTitleHiddenOnMobile = false }: PageHeaderProps) => (
  <Box component="header" sx={pageHeaderStyles}>
    <Box sx={textColumnStyles}>
      <Typography variant="labelS" component="p" sx={eyebrowStyles}>
        {eyebrow}
      </Typography>
      <Typography variant="h1" sx={titleStyles(isTitleHiddenOnMobile)}>
        {title}
      </Typography>
      {supportingText && (
        <Typography variant="bodyL" component="div" sx={supportingTextStyles}>
          {supportingText}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={actionsStyles}>{actions}</Box>}
    <Box sx={mobileDecorFrameStyles} aria-hidden data-decor="mobile">
      <ThemedImage light={pageHeaderDecorMobile} dark={pageHeaderDecorMobileDark} sx={mobileDecorImageStyles} />
    </Box>
    <Box sx={desktopDecorFrameStyles} aria-hidden data-decor="desktop">
      <ThemedImage light={pageHeaderDecor} dark={pageHeaderDecorDark} sx={desktopDecorImageStyles} />
    </Box>
  </Box>
);

export default PageHeader;
