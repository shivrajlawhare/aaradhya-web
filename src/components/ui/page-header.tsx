import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import pageHeaderDecor from '../../assets/decor/page-header.svg';
import {
  actionsStyles,
  decorFrameStyles,
  decorImageStyles,
  eyebrowStyles,
  pageHeaderStyles,
  supportingTextStyles,
  textColumnStyles,
  titleStyles,
} from './page-header.styles';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  supportingText?: ReactNode;
  actions?: ReactNode;
}

// The page header band from the redesign's page anatomy: eyebrow, h1,
// optional supporting line and actions, abstract decor on the right.
const PageHeader = ({ eyebrow, title, supportingText, actions }: PageHeaderProps) => (
  <Box component="header" sx={pageHeaderStyles}>
    <Box sx={textColumnStyles}>
      <Typography variant="labelS" component="p" sx={eyebrowStyles}>
        {eyebrow}
      </Typography>
      <Typography variant="h1" sx={titleStyles}>
        {title}
      </Typography>
      {supportingText && (
        <Typography variant="bodyL" component="div" sx={supportingTextStyles}>
          {supportingText}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={actionsStyles}>{actions}</Box>}
    <Box sx={decorFrameStyles} aria-hidden>
      <Box component="img" src={pageHeaderDecor} alt="" sx={decorImageStyles} />
    </Box>
  </Box>
);

export default PageHeader;
