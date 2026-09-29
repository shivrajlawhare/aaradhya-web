import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import emptyDecor from '../../assets/decor/empty.svg';
import { artBackdropStyles, artStyles, emptyStateStyles, illustrationStyles, titleStyles } from './empty-state.styles';
import type { IllustrationName } from './illustrations';
import ThemedIllustration from './themed-illustration';

interface EmptyStateProps {
  illustration: IllustrationName;
  title: string;
  action?: ReactNode;
}

const EmptyState = ({ illustration, title, action }: EmptyStateProps) => (
  <Box sx={emptyStateStyles}>
    <Box sx={artStyles}>
      <Box component="img" src={emptyDecor} alt="" aria-hidden sx={artBackdropStyles} />
      <ThemedIllustration name={illustration} sx={illustrationStyles} />
    </Box>
    <Typography variant="h3" component="p" sx={titleStyles}>
      {title}
    </Typography>
    {action}
  </Box>
);

export default EmptyState;
