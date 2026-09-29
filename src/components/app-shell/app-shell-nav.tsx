import type { ReactNode } from 'react';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { AuthUser } from '../../stores/auth-context';
import {
  logoutRowStyles,
  navContentStyles,
  navFooterStyles,
  navRowIconStyles,
  navRowLabelStyles,
  navRowsStyles,
  navRowStyles,
} from './app-shell-nav.styles';
import type { NavItem } from './nav-items';
import NavUserCard from './nav-user-card';
import ThemeToggle from './theme-toggle';

interface AppShellNavProps {
  header: ReactNode;
  items: NavItem[];
  currentPath: string;
  user: AuthUser | null;
  onLogout: () => void;
  // Set only by the mobile overlay, to close it after a row is activated —
  // undefined on the desktop sidebar, which has nothing to close.
  onNavigate?: () => void;
}

// The one row set both the desktop sidebar and the mobile overlay render
// from, so the two can never drift.
const AppShellNav = ({ header, items, currentPath, user, onLogout, onNavigate }: AppShellNavProps) => (
  <Stack sx={navContentStyles}>
    {header}
    <Stack component="nav" sx={navRowsStyles} aria-label="Main">
      {items.map((item) => {
        const isSelected = item.isActive(currentPath);
        const Icon = item.Icon;
        return (
          <Box
            key={item.id}
            component={RouterLink}
            to={item.path}
            onClick={onNavigate}
            sx={navRowStyles(isSelected)}
            aria-current={isSelected ? 'page' : undefined}
          >
            <Box sx={navRowIconStyles}>
              <Icon fontSize="small" />
            </Box>
            <Typography variant="labelL" sx={navRowLabelStyles}>
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Stack>
    <Stack sx={navFooterStyles}>
      {user && <NavUserCard user={user} />}
      <ThemeToggle />
      <Box component="button" type="button" onClick={onLogout} sx={logoutRowStyles}>
        <Box sx={navRowIconStyles}>
          <LogoutOutlinedIcon fontSize="small" />
        </Box>
        <Typography variant="labelL" sx={navRowLabelStyles}>
          Logout
        </Typography>
      </Box>
    </Stack>
  </Stack>
);

export default AppShellNav;
