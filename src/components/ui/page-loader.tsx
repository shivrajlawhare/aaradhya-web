import { Box, CircularProgress, Typography } from '@mui/material';
import logoMark from '../../assets/logo-mark.svg';
import {
  captionStyles,
  discStyles,
  logoStyles,
  markStyles,
  pageLoaderStyles,
  RING_SIZE,
  RING_THICKNESS,
  ringStyles,
} from './page-loader.styles';

interface PageLoaderProps {
  caption: string;
}

// The caption is the announced text (role="status"); the ring and logo are
// decoration.
const PageLoader = ({ caption }: PageLoaderProps) => (
  <Box role="status" sx={pageLoaderStyles}>
    <Box sx={markStyles} aria-hidden>
      <CircularProgress size={RING_SIZE} thickness={RING_THICKNESS} sx={ringStyles} />
      <Box sx={discStyles}>
        <Box component="img" src={logoMark} alt="" sx={logoStyles} />
      </Box>
    </Box>
    <Typography variant="bodyM" sx={captionStyles}>
      {caption}
    </Typography>
  </Box>
);

export default PageLoader;
