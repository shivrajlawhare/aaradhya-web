import { Box, type SxProps, type Theme } from '@mui/material';
import { type IllustrationName, ILLUSTRATIONS } from './illustrations';
import { darkImageStyles, lightImageStyles } from './themed-illustration.styles';

interface ThemedIllustrationProps {
  name: IllustrationName;
  sx?: SxProps<Theme>;
}

// Decorative spot art: the caller's own text carries the meaning, so the
// images are hidden from assistive tech.
const ThemedIllustration = ({ name, sx = [] }: ThemedIllustrationProps) => {
  const sources = ILLUSTRATIONS[name];
  const sizeStyles = Array.isArray(sx) ? sx : [sx];

  return (
    <>
      <Box
        component="img"
        src={sources.light}
        alt=""
        aria-hidden
        data-scheme="light"
        sx={[lightImageStyles, ...sizeStyles]}
      />
      <Box
        component="img"
        src={sources.dark}
        alt=""
        aria-hidden
        data-scheme="dark"
        sx={[darkImageStyles, ...sizeStyles]}
      />
    </>
  );
};

export default ThemedIllustration;
