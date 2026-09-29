import eventCreatedDark from '../../assets/illustrations/event-created-dark.svg';
import eventCreated from '../../assets/illustrations/event-created.svg';
import loginHeroDark from '../../assets/illustrations/login-hero-dark.svg';
import loginHero from '../../assets/illustrations/login-hero.svg';
import noActivityDark from '../../assets/illustrations/no-activity-dark.svg';
import noActivity from '../../assets/illustrations/no-activity.svg';
import noEventsYetDark from '../../assets/illustrations/no-events-yet-dark.svg';
import noEventsYet from '../../assets/illustrations/no-events-yet.svg';
import noFilterResultsDark from '../../assets/illustrations/no-filter-results-dark.svg';
import noFilterResults from '../../assets/illustrations/no-filter-results.svg';
import noItemsDark from '../../assets/illustrations/no-items-dark.svg';
import noItems from '../../assets/illustrations/no-items.svg';
import noSessionsDark from '../../assets/illustrations/no-sessions-dark.svg';
import noSessions from '../../assets/illustrations/no-sessions.svg';
import noUpcomingEventsDark from '../../assets/illustrations/no-upcoming-events-dark.svg';
import noUpcomingEvents from '../../assets/illustrations/no-upcoming-events.svg';
import notFoundDark from '../../assets/illustrations/not-found-dark.svg';
import notFound from '../../assets/illustrations/not-found.svg';
import quotationReadyDark from '../../assets/illustrations/quotation-ready-dark.svg';
import quotationReady from '../../assets/illustrations/quotation-ready.svg';
import restrictedDark from '../../assets/illustrations/restricted-dark.svg';
import restricted from '../../assets/illustrations/restricted.svg';
import settingsDark from '../../assets/illustrations/settings-dark.svg';
import settings from '../../assets/illustrations/settings.svg';
import somethingWentWrongDark from '../../assets/illustrations/something-went-wrong-dark.svg';
import somethingWentWrong from '../../assets/illustrations/something-went-wrong.svg';
import usersDark from '../../assets/illustrations/users-dark.svg';
import users from '../../assets/illustrations/users.svg';
import type { ThemedImageSources } from './themed-image';

// The Handoff board 08 illustration set: each Figma `Illustration/*`
// component exported once per colour scheme.
export type IllustrationName =
  | 'no-upcoming-events'
  | 'no-events-yet'
  | 'no-filter-results'
  | 'no-sessions'
  | 'no-activity'
  | 'no-items'
  | 'quotation-ready'
  | 'event-created'
  | 'not-found'
  | 'something-went-wrong'
  | 'restricted'
  | 'users'
  | 'settings'
  | 'login-hero';

export const ILLUSTRATIONS: Record<IllustrationName, ThemedImageSources> = {
  'no-upcoming-events': { light: noUpcomingEvents, dark: noUpcomingEventsDark },
  'no-events-yet': { light: noEventsYet, dark: noEventsYetDark },
  'no-filter-results': { light: noFilterResults, dark: noFilterResultsDark },
  'no-sessions': { light: noSessions, dark: noSessionsDark },
  'no-activity': { light: noActivity, dark: noActivityDark },
  'no-items': { light: noItems, dark: noItemsDark },
  'quotation-ready': { light: quotationReady, dark: quotationReadyDark },
  'event-created': { light: eventCreated, dark: eventCreatedDark },
  'not-found': { light: notFound, dark: notFoundDark },
  'something-went-wrong': { light: somethingWentWrong, dark: somethingWentWrongDark },
  restricted: { light: restricted, dark: restrictedDark },
  users: { light: users, dark: usersDark },
  settings: { light: settings, dark: settingsDark },
  'login-hero': { light: loginHero, dark: loginHeroDark },
};
