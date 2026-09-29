import { Box, type SxProps, type Theme } from '@mui/material';
import { darkImageStyles, lightImageStyles } from './themed-image.styles';

// One image exported per colour scheme.
export interface ThemedImageSources {
  light: string;
  dark: string;
}

interface ThemedImageProps extends ThemedImageSources {
  // Defaults to decorative (""), for spot art and motifs whose meaning the
  // surrounding text already carries.
  alt?: string;
  sx?: SxProps<Theme>;
}

// Shows the export for the active colour scheme (illustrations, decor, logos).
const ThemedImage = ({ light, dark, alt = '', sx = [] }: ThemedImageProps) => {
  const extraStyles = Array.isArray(sx) ? sx : [sx];
  const isDecorative = alt === '';

  return (
    <>
      <Box
        component="img"
        src={light}
        alt={alt}
        aria-hidden={isDecorative}
        data-scheme="light"
        sx={[lightImageStyles, ...extraStyles]}
      />
      <Box
        component="img"
        src={dark}
        alt={alt}
        aria-hidden={isDecorative}
        data-scheme="dark"
        sx={[darkImageStyles, ...extraStyles]}
      />
    </>
  );
};

export default ThemedImage;
