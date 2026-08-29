import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tsr } from '../../src/api/client';
import ActivityTab from '../../src/components/ui/activity-tab';
import { theme } from '../../src/theme/theme';

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );

const renderActivityTab = (entityType = 'Event', entityId = 'event-1') => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <ActivityTab entityType={entityType} entityId={entityId} />
        </ThemeProvider>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ActivityTab', () => {
  it('requests the change log for the given entityType/entityId', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(200, []));

    renderActivityTab('Event', 'event-42');

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const [url] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(String(url)).toContain('entityType=Event');
    expect(String(url)).toContain('entityId=event-42');
  });

  it('renders "No changes yet" for an empty result, not a blank panel', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(200, []));

    renderActivityTab();

    expect(await screen.findByText('No changes yet')).toBeInTheDocument();
  });

  it('renders field, old → new, changedBy, and a relative timestamp per row', async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    vi.mocked(fetch).mockReturnValue(
      jsonResponse(200, [
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
      ]),
    );

    renderActivityTab();

    expect(await screen.findByText('status: Tentative → Confirmed')).toBeInTheDocument();
    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
  });

  it('renders a leading "—" for a null oldValue, not the word "null"', async () => {
    vi.mocked(fetch).mockReturnValue(
      jsonResponse(200, [
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
      ]),
    );

    renderActivityTab();

    expect(await screen.findByText('notes: — → First note')).toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });

  it('renders an array/object value as JSON rather than breaking', async () => {
    vi.mocked(fetch).mockReturnValue(
      jsonResponse(200, [
        {
          id: 'entry-1',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'client_contacts',
          oldValue: [{ name: 'Bride' }],
          newValue: [{ name: 'Bride' }, { name: 'Groom' }],
          changedBy: 'user-1',
          timestamp: new Date().toISOString(),
        },
      ]),
    );

    renderActivityTab();

    expect(
      await screen.findByText('client_contacts: [{"name":"Bride"}] → [{"name":"Bride"},{"name":"Groom"}]'),
    ).toBeInTheDocument();
  });

  it('renders one row per entry, in the order the API returns them', async () => {
    vi.mocked(fetch).mockReturnValue(
      jsonResponse(200, [
        {
          id: 'entry-2',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'pax',
          oldValue: 100,
          newValue: 120,
          changedBy: 'user-1',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'entry-1',
          entityType: 'Event',
          entityId: 'event-1',
          field: 'status',
          oldValue: 'Tentative',
          newValue: 'Confirmed',
          changedBy: 'user-1',
          timestamp: new Date().toISOString(),
        },
      ]),
    );

    renderActivityTab();

    const rows = await screen.findAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('pax: 100 → 120');
    expect(rows[1]).toHaveTextContent('status: Tentative → Confirmed');
  });
});
