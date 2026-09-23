import { type ReactNode, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, IconButton, Slide, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { LOGIN_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import AppShellNav from './app-shell-nav';
import {
  closeButtonStyles,
  desktopContentStyles,
  desktopTitleStyles,
  menuButtonStyles,
  mobileOverlayHeaderStyles,
  mobileOverlayStyles,
  mobileRootStyles,
  railStyles,
  rootStyles,
  topBarStyles,
  topBarTitleStyles,
} from './app-shell.styles';
import { NAV_ITEMS } from './nav-items';

interface AppShellProps {
  // Used for the mobile top bar's centered title and, on desktop, a
  // centered heading above the page's own content — only for the screens
  // whose own component no longer renders this itself (Dashboard, Events,
  // Calendar, User Management; STORY-053's own AC). Left undefined for
  // every other wrapped screen (New Event, Event Detail, ...) so their
  // existing in-page titles aren't joined by a second, AppShell-rendered
  // one.
  title?: string;
  children: ReactNode;
}

// Wraps every authenticated route (app.tsx) with the Figma-finalized
// navigation shell: a persistent dark rail at desktop/laptop widths, a
// hamburger-triggered full-screen nav at mobile widths. Replaces
// DashboardNav, which only ever rendered on the Dashboard screen itself.
const AppShell = ({ title, children }: AppShellProps) => {
  const theme = useTheme();
  // 900px — MUI's own `md` breakpoint, matching this story's own AC.
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || (user !== null && item.roles.includes(user.role)));

  const handleLogout = () => {
    logout();
    navigate(LOGIN_PATH, { replace: true });
  };

  if (isDesktop) {
    return (
      <Box sx={rootStyles}>
        <Box component="nav" aria-label="Primary" sx={railStyles}>
          <AppShellNav items={visibleItems} currentPath={location.pathname} onLogout={handleLogout} />
        </Box>
        <Box component="main" sx={desktopContentStyles}>
          {title && (
            <Typography variant="titleL" component="h1" sx={desktopTitleStyles}>
              {title}
            </Typography>
          )}
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={rootStyles}>
      <Box sx={mobileRootStyles}>
        <Box component="header" sx={topBarStyles}>
          <IconButton aria-label="Open navigation" onClick={() => setMobileNavOpen(true)} sx={menuButtonStyles}>
            <MenuIcon />
          </IconButton>
          {title && (
            <Typography variant="titleL" component="h1" sx={topBarTitleStyles}>
              {title}
            </Typography>
          )}
        </Box>
        <Box component="main">{children}</Box>
      </Box>
      {/* Slide, not plain conditional JSX — mounts/unmounts with a slide
          transition from the left edge instead of an instant appear/
          disappear. mountOnEnter/unmountOnExit keep the same "not in the DOM
          until opened" behavior the old `{mobileNavOpen && ...}` guard gave,
          so the "same-mounted overlay, not a route push" reasoning below
          still holds. */}
      <Slide direction="right" in={mobileNavOpen} mountOnEnter unmountOnExit>
        <Box role="dialog" aria-modal="true" aria-label="Navigation" sx={mobileOverlayStyles}>
          <Box sx={mobileOverlayHeaderStyles}>
            <IconButton aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} sx={closeButtonStyles}>
              <CloseIcon />
            </IconButton>
          </Box>
          <AppShellNav
            items={visibleItems}
            currentPath={location.pathname}
            onLogout={handleLogout}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </Box>
      </Slide>
    </Box>
  );
};

export default AppShell;
