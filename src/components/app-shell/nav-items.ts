import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { matchPath } from 'react-router-dom';
import { Role } from '../../contract';
import {
  CALENDAR_PATH,
  DASHBOARD_PATH,
  EVENT_CREATE_PATH,
  EVENT_DETAIL_PATH_PATTERN,
  EVENT_LIST_PATH,
  QUOTATION_PREVIEW_PATH_PATTERN,
  SETTINGS_PATH,
  USER_MANAGEMENT_PATH,
} from '../../routes';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  Icon: ComponentType<SvgIconProps>;
  // Undefined means every role sees the row — matches GET /events and GET
  // /calendar's own "no RequireRole" precedent (app.tsx).
  roles?: Role[];
  isActive: (pathname: string) => boolean;
}

// The one place the drawer rail (desktop) and full-screen nav (mobile) both
// read their row set from, so the two can never drift. New Event, User
// Management, and Settings all stay Event-Manager-only, matching
// EVENT_CREATE_PATH/USER_MANAGEMENT_PATH/SETTINGS_PATH's own RequireRole
// gates in app.tsx.
export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: DASHBOARD_PATH,
    Icon: GridViewOutlinedIcon,
    isActive: (pathname) => pathname === DASHBOARD_PATH,
  },
  {
    id: 'events',
    label: 'Events',
    path: EVENT_LIST_PATH,
    Icon: ListAltOutlinedIcon,
    // An Event's own detail screen and its Quotation Preview are both "the
    // Events area" too. EVENT_DETAIL_PATH_PATTERN ('/events/:id') would
    // otherwise also match EVENT_CREATE_PATH ('/events/new', :id="new") —
    // excluded explicitly so New Event never lights up this row instead of
    // its own.
    isActive: (pathname) =>
      pathname === EVENT_LIST_PATH ||
      (pathname !== EVENT_CREATE_PATH &&
        (matchPath(EVENT_DETAIL_PATH_PATTERN, pathname) !== null ||
          matchPath(QUOTATION_PREVIEW_PATH_PATTERN, pathname) !== null)),
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: CALENDAR_PATH,
    Icon: CalendarMonthOutlinedIcon,
    isActive: (pathname) => pathname === CALENDAR_PATH,
  },
  {
    id: 'new-event',
    label: 'New Event',
    path: EVENT_CREATE_PATH,
    Icon: EventAvailableOutlinedIcon,
    roles: [Role.EventManager],
    isActive: (pathname) => pathname === EVENT_CREATE_PATH,
  },
  {
    id: 'user-management',
    label: 'User Management',
    path: USER_MANAGEMENT_PATH,
    Icon: PeopleAltOutlinedIcon,
    roles: [Role.EventManager],
    isActive: (pathname) => pathname === USER_MANAGEMENT_PATH,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: SETTINGS_PATH,
    Icon: SettingsOutlinedIcon,
    roles: [Role.EventManager],
    isActive: (pathname) => pathname === SETTINGS_PATH,
  },
];
