import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { NavItem } from './nav-items';
import {
  logoutRowWrapperStyles,
  navContentStyles,
  navRowIconStyles,
  navRowLabelStyles,
  navRowStyles,
  navRowsStyles,
  wordmarkStyles,
} from './app-shell-nav.styles';

interface AppShellNavProps {
  items: NavItem[];
  currentPath: string;
  onLogout: () => void;
  // Set only by the mobile full-screen nav, to close the overlay after a
  // row is activated — undefined on the desktop rail, which has nothing to
  // close.
  onNavigate?: () => void;
}

// The one row set both the desktop rail and the mobile full-screen nav
// render from (STORY-053's own AC: "same row set as the desktop rail").
const AppShellNav = ({ items, currentPath, onLogout, onNavigate }: AppShellNavProps) => {
  return (
    <Stack sx={navContentStyles}>
      <Typography variant="display" sx={wordmarkStyles}>
        Aaradhya
      </Typography>
      <Stack component="nav" sx={navRowsStyles} aria-label="Main">
        {items.map((item) => {
          const selected = item.isActive(currentPath);
          const Icon = item.Icon;
          return (
            <Box
              key={item.id}
              component={RouterLink}
              to={item.path}
              onClick={onNavigate}
              sx={navRowStyles(selected)}
              aria-current={selected ? 'page' : undefined}
            >
              <Box sx={navRowIconStyles}>
                <Icon fontSize="small" />
              </Box>
              <Typography variant="bodyL" sx={navRowLabelStyles(selected)}>
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Stack>
      <Box sx={logoutRowWrapperStyles}>
        <Box component="button" type="button" onClick={onLogout} sx={navRowStyles(false)}>
          <Box sx={navRowIconStyles}>
            <LogoutOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="bodyL" sx={navRowLabelStyles(false)}>
            Logout
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
};

export default AppShellNav;
