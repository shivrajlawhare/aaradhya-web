import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../../theme/motion';
import { pageTransitionStyles } from './page-transition.styles';

interface PageTransitionProps {
  children: ReactNode;
}

// Figma Motion Spec "Page → page": only the route content fades in and rises
// 8 px (motion/slow); the shell around it stays put. Keyed by pathname so it
// replays on each route change. Under prefers-reduced-motion the content
// just appears.
const PageTransition = ({ children }: PageTransitionProps) => {
  const { pathname } = useLocation();
  const isReducedMotion = useReducedMotion();

  return (
    <Box key={pathname} data-route-transition sx={pageTransitionStyles(isReducedMotion)}>
      {children}
    </Box>
  );
};

export default PageTransition;
