import { type ReactNode, useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { Box, Drawer, IconButton, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import aaradhyaLockupLight from '../../assets/aaradhya-lockup-light.png';
import { LOGIN_PATH } from '../../routes';
import { useAuth } from '../../stores/auth-context';
import AppShellNav from './app-shell-nav';
import { logoStyles } from './app-shell-nav.styles';
import {
  closeButtonStyles,
  desktopContentStyles,
  desktopTitleStyles,
  mobileRootStyles,
  OVERLAY_TRANSITION,
  overlayHeaderStyles,
  overlayLogoStyles,
  overlayPaperStyles,
  rootStyles,
  sidebarContentStyles,
  sidebarDecorStyles,
  sidebarStyles,
  topBarSpacerStyles,
  topBarStyles,
  topBarTitleSlotStyles,
  topBarTitleStyles,
} from './app-shell.styles';
import { NAV_ITEMS } from './nav-items';

interface AppShellProps {
  // The mobile top bar's centred title and, on desktop, a centred heading
  // above the page content — only for the screens whose own component no
  // longer renders one (Dashboard, Events, Calendar, User Management).
  title?: string;
  children: ReactNode;
}

// Wraps every authenticated route (app.tsx): a fixed dark sidebar from `md`
// up, a sticky top bar with a slide-in nav overlay below it.
const AppShell = ({ title, children }: AppShellProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || (user !== null && item.roles.includes(user.role)));

  const handleLogout = () => {
    logout();
    navigate(LOGIN_PATH, { replace: true });
  };

  const handleCloseMobileNav = () => setIsMobileNavOpen(false);

  if (isDesktop) {
    return (
      <Box sx={rootStyles}>
        <Box component="nav" aria-label="Primary" sx={sidebarStyles}>
          <Box sx={sidebarDecorStyles} />
          <Box sx={sidebarContentStyles}>
            <AppShellNav
              header={<Box component="img" src={aaradhyaLockupLight} alt="Aaradhya" sx={logoStyles} />}
              items={visibleItems}
              currentPath={location.pathname}
              user={user}
              onLogout={handleLogout}
            />
          </Box>
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

  const overlayHeader = (
    <Box sx={overlayHeaderStyles}>
      <IconButton aria-label="Close navigation" onClick={handleCloseMobileNav} sx={closeButtonStyles}>
        <CloseRoundedIcon />
      </IconButton>
      <Box component="img" src={aaradhyaLockupLight} alt="Aaradhya" sx={overlayLogoStyles} />
    </Box>
  );

  return (
    <Box sx={rootStyles}>
      <Box sx={mobileRootStyles}>
        <Box component="header" sx={topBarStyles}>
          <IconButton aria-label="Open navigation" onClick={() => setIsMobileNavOpen(true)}>
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={topBarTitleSlotStyles}>
            {title && (
              <Typography variant="titleM" component="h1" sx={topBarTitleStyles}>
                {title}
              </Typography>
            )}
          </Box>
          <Box sx={topBarSpacerStyles} />
        </Box>
        <Box component="main">{children}</Box>
      </Box>
      {/* An overlay drawn over the current screen, not a route change — the
          page underneath (wizard state included) stays mounted. */}
      <Drawer
        anchor="left"
        open={isMobileNavOpen}
        onClose={handleCloseMobileNav}
        transitionDuration={OVERLAY_TRANSITION}
        slotProps={{
          paper: { role: 'dialog', 'aria-modal': true, 'aria-label': 'Navigation', sx: overlayPaperStyles },
        }}
      >
        <AppShellNav
          header={overlayHeader}
          items={visibleItems}
          currentPath={location.pathname}
          user={user}
          onLogout={handleLogout}
          onNavigate={handleCloseMobileNav}
        />
      </Drawer>
    </Box>
  );
};

export default AppShell;
