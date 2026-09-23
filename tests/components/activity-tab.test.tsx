import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import ActivityTab from '../../src/components/ui/activity-tab';
import { theme } from '../../src/theme/theme';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

// STORY-081 — ActivityTab now also calls GET /users (changedBy resolution)
// and GET /menu-items (menuItems diff resolution) alongside GET /change-log,
// so the old single vi.fn().mockReturnValue(...) (every fetch call gets the
// same canned response) no longer works — routed by URL instead, same
// pattern this codebase's own multi-endpoint mocks (e.g. event-detail-page.
// test.tsx's mockEventDetailApi) already establish.
const mockActivityApi = ({
  changeLog = [],
  users = [],
  menuItems = [],
}: {
  changeLog?: unknown[];
  users?: unknown[];
  menuItems?: unknown[];
} = {}) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/change-log')) {
        return jsonResponse(200, changeLog);
      }
      if (url.includes('/users')) {
        return jsonResponse(200, users);
      }
      if (url.includes('/menu-items')) {
        return jsonResponse(200, menuItems);
      }
      throw new Error(`Unhandled request: ${url}`);
    })
  );
};

const renderActivityTab = (entityType = 'Event', entityId = 'event-1') => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <ActivityTab entityType={entityType} entityId={entityId} />
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  mockActivityApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ActivityTab', () => {
  it('requests the change log for the given entityType/entityId', async () => {
    mockActivityApi();

    renderActivityTab('Event', 'event-42');

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const changeLogCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).includes('/change-log'));
    expect(String(changeLogCall?.[0])).toContain('entityType=Event');
    expect(String(changeLogCall?.[0])).toContain('entityId=event-42');
  });

  it('renders "No changes yet" for an empty result, not a blank panel', async () => {
    mockActivityApi();

    renderActivityTab();

    expect(await screen.findByText('No changes yet')).toBeInTheDocument();
  });

  it('renders a humanized field label and old → new, resolving changedBy to a name when known and falling back to the raw id when not (deleted account)', async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    mockActivityApi({
      changeLog: [
        {
          id: 'entry-1',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'status',
          oldValue: 'Tentative',
          newValue: 'Confirmed',
          changedBy: 'user-1',
          timestamp: fiveMinutesAgo,
        },
        {
          id: 'entry-2',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'eventFamilyType',
          oldValue: 'Wedding',
          newValue: 'Engagement',
          changedBy: 'user-deleted',
          timestamp: fiveMinutesAgo,
        },
      ],
      users: [
        {
          id: 'user-1',
          name: 'Priya Nair',
          username: 'priya',
          role: 'EventManager',
          active: true,
          createdAt: '',
          updatedAt: '',
        },
      ],
    });

    renderActivityTab();

    expect(await screen.findByText('Status: Tentative → Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Priya Nair')).toBeInTheDocument();
    expect(screen.queryByText('user-1')).not.toBeInTheDocument();
    expect(screen.getAllByText('5 minutes ago')).toHaveLength(2);
    expect(screen.getByText('Event type: Wedding → Engagement')).toBeInTheDocument();
    // No matching User account (STORY-081's own defensive edge case) — falls
    // back to the raw id rather than hiding the entry or crashing.
    expect(screen.getByText('user-deleted')).toBeInTheDocument();
  });

  it('renders a leading "—" for a null oldValue, not the word "null", for an unmapped field label', async () => {
    mockActivityApi({
      changeLog: [
        {
          id: 'entry-1',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'notes',
          oldValue: null,
          newValue: 'First note',
          changedBy: 'user-1',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    renderActivityTab();

    expect(await screen.findByText('notes: — → First note')).toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });

  it('formats compound values helpfully instead of raw JSON: Setup diffs only changed sub-fields, menuItems resolves names, roomLines summarizes counts', async () => {
    mockActivityApi({
      changeLog: [
        {
          id: 'entry-setup',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'sessions[Wedding].setup',
          oldValue: {
            seating: null,
            tableCount: 0,
            chairCount: 0,
            stage: false,
            buffet: false,
            registrationDesk: false,
            vipSeating: false,
            brideGroomSeating: false,
            notes: null,
          },
          newValue: {
            seating: 'RoundTables',
            tableCount: 20,
            chairCount: 0,
            stage: false,
            buffet: false,
            registrationDesk: false,
            vipSeating: false,
            brideGroomSeating: false,
            notes: null,
          },
          changedBy: 'user-1',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'entry-menu',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'sessions[Wedding].items[Hi Tea].menuItems',
          oldValue: ['menu-item-1'],
          newValue: ['menu-item-1', 'menu-item-2'],
          changedBy: 'user-1',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'entry-rooms',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'roomLines',
          oldValue: [{ roomType: 'Deluxe', occupancy: 2, tariff: 2500, noOfRooms: 2 }],
          newValue: [
            { roomType: 'Deluxe', occupancy: 2, tariff: 2500, noOfRooms: 2 },
            { roomType: 'Suite', occupancy: 2, tariff: 5000, noOfRooms: 1 },
          ],
          changedBy: 'user-1',
          timestamp: new Date().toISOString(),
        },
      ],
      menuItems: [
        { id: 'menu-item-1', name: 'Paneer Tikka', active: true, createdAt: '', updatedAt: '' },
        { id: 'menu-item-2', name: 'Gulab Jamun', active: true, createdAt: '', updatedAt: '' },
      ],
    });

    renderActivityTab();

    expect(
      await screen.findByText('Wedding session — Setup: Seating: — → Round Tables, Tables: 0 → 20')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Wedding session — Hi Tea — Menu items: Paneer Tikka → Paneer Tikka, Gulab Jamun')
    ).toBeInTheDocument();
    expect(screen.getByText('Room Lines: 1 → 2 room lines (1 added)')).toBeInTheDocument();
  });

  it('groups every entry sharing one groupId into a single block, keeping an entry with no groupId as its own separate block', async () => {
    const now = new Date().toISOString();
    mockActivityApi({
      changeLog: [
        {
          id: 'entry-a',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'sessions[Wedding].pax',
          oldValue: 100,
          newValue: 120,
          changedBy: 'user-1',
          groupId: 'req-1',
          timestamp: now,
        },
        {
          id: 'entry-b',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'sessions[Wedding].venue',
          oldValue: 'Lawn',
          newValue: 'Poolside',
          changedBy: 'user-1',
          groupId: 'req-1',
          timestamp: now,
        },
        {
          id: 'entry-c',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'status',
          oldValue: 'Tentative',
          newValue: 'Confirmed',
          changedBy: 'user-1',
          timestamp: now,
        },
      ],
    });

    renderActivityTab();

    // Each group renders its own bulleted <ul> of changes — one list per
    // group is itself the grouping proof, independent of the bullet count.
    const groupLists = await screen.findAllByRole('list');
    expect(groupLists).toHaveLength(2);

    const groupedBullets = within(groupLists[0]!).getAllByRole('listitem');
    expect(groupedBullets).toHaveLength(2);
    expect(groupedBullets[0]).toHaveTextContent('Wedding session — Pax: 100 → 120');
    expect(groupedBullets[1]).toHaveTextContent('Wedding session — Venue: Lawn → Poolside');

    const standaloneBullets = within(groupLists[1]!).getAllByRole('listitem');
    expect(standaloneBullets).toHaveLength(1);
    expect(standaloneBullets[0]).toHaveTextContent('Status: Tentative → Confirmed');
  });
});
