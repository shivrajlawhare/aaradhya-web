import { useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/app-shell/app-shell';
import RequireRole from './components/ui/require-role';
import { Role } from './contract';
import CalendarPage from './pages/calendar/calendar-page';
import DashboardPage from './pages/dashboard/dashboard-page';
import AccommodationStep from './pages/event-creation/accommodation-step';
import ClientDetailsStep from './pages/event-creation/client-details-step';
import EventDetailsStep from './pages/event-creation/event-details-step';
import EventWizardShell from './pages/event-creation/event-wizard-shell';
import ReviewStep from './pages/event-creation/review-step';
import SessionsItemsStep from './pages/event-creation/sessions-items-step';
import { WIZARD_STEPS } from './pages/event-creation/wizard-steps';
import EventDetailPage from './pages/event-detail/event-detail-page';
import EventListPage from './pages/event-list/event-list-page';
import LoginPage from './pages/login/login-page';
import QuotationPreviewPage from './pages/quotation-preview/quotation-preview-page';
import SettingsPage from './pages/settings/settings-page';
import UserManagementPage from './pages/user-management/user-management-page';
import {
  CALENDAR_PATH,
  DASHBOARD_PATH,
  EVENT_CREATE_PATH,
  EVENT_DETAIL_PATH_PATTERN,
  EVENT_LIST_PATH,
  LOGIN_PATH,
  QUOTATION_PREVIEW_PATH_PATTERN,
  SETTINGS_PATH,
  USER_MANAGEMENT_PATH,
} from './routes';

const App = () => {
  // The shared wizard footer's "Generate Quotation" button (event-wizard-
  // shell.tsx's own onNext hook, STORY-063) is wired one layer above
  // ReviewStep's own EventWizardProvider, with no access to that step's
  // local state (manual line items, GST%, Event Type) — ReviewStep
  // registers its own latest submit closure into this ref every render
  // instead, so the route-level onNext below always calls through to it.
  const reviewSubmitRef = useRef<() => void>(() => {});

  return (
    <Routes>
      <Route path="/" element={<Navigate to={LOGIN_PATH} replace />} />
      <Route path={LOGIN_PATH} element={<LoginPage />} />
      {/* No RequireRole — GET /dashboard (STORY-047) has no role
          restriction either; it varies its own response by role
          server-side (STORY-046), so the same DashboardPage renders
          correctly for all four roles (STORY-048/049/050/051). */}
      <Route
        path={DASHBOARD_PATH}
        element={
          <AppShell title="Dashboard">
            <DashboardPage />
          </AppShell>
        }
      />
      <Route
        path={USER_MANAGEMENT_PATH}
        element={
          <AppShell title="User Management">
            <RequireRole roles={[Role.EventManager]}>
              <UserManagementPage />
            </RequireRole>
          </AppShell>
        }
      />
      {/* No RequireRole — GET /events (STORY-013) has no role restriction;
          every authenticated caller sees the same unfiltered list. */}
      <Route
        path={EVENT_LIST_PATH}
        element={
          <AppShell title="Events">
            <EventListPage />
          </AppShell>
        }
      />
      {/* STORY-063 — a 5-step wizard replaces the old single-page form.
          A bare /events/new visit redirects to the first step; each real
          step path (e.g. /events/new/client-details) is its own route so
          deep-linking works, per this story's own AC. Each step's real
          content landed in its own dedicated story (STORY-064 through
          068) and replaced only its own <Route>'s element below — all
          five (Client Details, Event Details, Accommodation, Sessions &
          Items, Review & Quotation) are done; WizardStepPlaceholder no
          longer backs any route here, though it's still used by several
          of these steps' own tests as a stand-in for a sibling step not
          under test. No title on EventWizardShell's routes — it renders
          its own "New Event" h1 already, same "AppShell doesn't render a
          second one" precedent EVENT_CREATE_PATH's route used before. */}
      <Route path={EVENT_CREATE_PATH} element={<Navigate to={WIZARD_STEPS[0]?.path ?? EVENT_CREATE_PATH} replace />} />
      <Route
        path={WIZARD_STEPS[0]!.path}
        element={
          <AppShell>
            <RequireRole roles={[Role.EventManager]}>
              <EventWizardShell step="client-details">
                <ClientDetailsStep />
              </EventWizardShell>
            </RequireRole>
          </AppShell>
        }
      />
      <Route
        path={WIZARD_STEPS[1]!.path}
        element={
          <AppShell>
            <RequireRole roles={[Role.EventManager]}>
              <EventWizardShell step="event-details">
                <EventDetailsStep />
              </EventWizardShell>
            </RequireRole>
          </AppShell>
        }
      />
      <Route
        path={WIZARD_STEPS[2]!.path}
        element={
          <AppShell>
            <RequireRole roles={[Role.EventManager]}>
              <EventWizardShell step="accommodation">
                <AccommodationStep />
              </EventWizardShell>
            </RequireRole>
          </AppShell>
        }
      />
      <Route
        path={WIZARD_STEPS[3]!.path}
        element={
          <AppShell>
            <RequireRole roles={[Role.EventManager]}>
              <EventWizardShell step="sessions-items">
                <SessionsItemsStep />
              </EventWizardShell>
            </RequireRole>
          </AppShell>
        }
      />
      <Route
        path={WIZARD_STEPS[4]!.path}
        element={
          <AppShell>
            <RequireRole roles={[Role.EventManager]}>
              <EventWizardShell step="review" onNext={() => reviewSubmitRef.current()}>
                <ReviewStep registerSubmit={(submit) => (reviewSubmitRef.current = submit)} />
              </EventWizardShell>
            </RequireRole>
          </AppShell>
        }
      />
      {/* No RequireRole — GET /events/:id (STORY-013) has no role
          restriction either; every role legitimately opens this screen,
          just seeing a different subset of tabs. EventDetailPage itself
          gates editing, the Activity sub-tab, and (STORY-052) the Rooms/
          Sessions tabs and each one's own Setup/Menu detail per role. */}
      <Route
        path={EVENT_DETAIL_PATH_PATTERN}
        element={
          // No title — the h1 here is the Event's own eventId (dynamic,
          // not one of STORY-053's four static-title screens), so AppShell
          // leaves it entirely to EventDetailPage, unchanged.
          <AppShell>
            <EventDetailPage />
          </AppShell>
        }
      />
      {/* RequireRole([EventManager]) as of STORY-052 — this screen shows the
          exact same full financial breakdown (Grand Total, extras,
          accommodation/session costs) that story scoped to Event Manager
          only everywhere else on Event Detail. The previous "no RequireRole"
          reasoning ("every field this screen shows is already visible to
          any authenticated caller via the Overview/Rooms/Sessions tabs")
          stopped being true the moment those tabs became role-filtered —
          leaving this route open would have been a direct bypass of the
          very gating STORY-052 exists to add. Not wrapped in AppShell —
          STORY-053's own AC never lists this screen among the ones the
          shell wraps, and it exists to mirror the reference quotation PDFs
          (STORY-069+) rather than sit alongside app chrome. */}
      <Route
        path={QUOTATION_PREVIEW_PATH_PATTERN}
        element={
          <RequireRole roles={[Role.EventManager]}>
            <QuotationPreviewPage />
          </RequireRole>
        }
      />
      {/* No RequireRole — GET /calendar (STORY-034) has no role restriction
          either, same as GET /events. */}
      <Route
        path={CALENDAR_PATH}
        element={
          <AppShell title="Calendar">
            <CalendarPage />
          </AppShell>
        }
      />
      {/* Event Manager only (STORY-062's own AC), matching New Event/User
          Management's own RequireRole convention — the nav row itself
          (nav-items.ts) already only renders for that role, this is the
          route-level enforcement for a direct URL visit. */}
      <Route
        path={SETTINGS_PATH}
        element={
          <AppShell title="Settings">
            <RequireRole roles={[Role.EventManager]}>
              <SettingsPage />
            </RequireRole>
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to={LOGIN_PATH} replace />} />
    </Routes>
  );
};

export default App;
