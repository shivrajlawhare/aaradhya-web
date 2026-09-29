import { Box, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { errorStateStyles, illustrationStyles, messageStyles } from './error-state.styles';
import type { IllustrationName } from './illustrations';
import ThemedIllustration from './themed-illustration';

export interface ErrorStateLink {
  label: string;
  to: string;
}

interface ErrorStateProps {
  illustration: IllustrationName;
  message: string;
  link?: ErrorStateLink;
}

const ErrorState = ({ illustration, message, link }: ErrorStateProps) => (
  <Box sx={errorStateStyles}>
    <ThemedIllustration name={illustration} sx={illustrationStyles} />
    <Typography variant="h3" component="p" sx={messageStyles}>
      {message}
    </Typography>
    {link && (
      <Typography variant="labelL" component="p">
        <Link component={RouterLink} to={link.to}>
          {link.label}
        </Link>
      </Typography>
    )}
  </Box>
);

export default ErrorState;
