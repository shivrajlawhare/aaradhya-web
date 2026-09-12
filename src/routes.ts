// Route paths as constants — used by src/App.tsx and anywhere that navigates,
// so the two never drift.
export const LOGIN_PATH = '/login';
export const DASHBOARD_PATH = '/dashboard';
export const USER_MANAGEMENT_PATH = '/users';
export const EVENT_LIST_PATH = '/events';
export const EVENT_CREATE_PATH = '/events/new';
// STORY-017 hasn't landed yet — this is the URL a successful Event creation
// navigates to. EVENT_DETAIL_PATH_PATTERN is the <Route path> registered
// against an EventDetailPlaceholderPage stand-in (mirrors DashboardPlaceholderPage's
// role until the real screen is built); eventDetailPath(id) builds an actual
// URL to navigate to.
export const EVENT_DETAIL_PATH_PATTERN = '/events/:id';
export const eventDetailPath = (id: string): string => `/events/${id}`;
export const CALENDAR_PATH = '/calendar';
