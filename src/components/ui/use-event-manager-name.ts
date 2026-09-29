import { tsr } from '../../api/client';

// Shared with the calendar's Event Manager filter, so both read one cached
// GET /event-managers response.
export const EVENT_MANAGERS_QUERY_KEY = ['event-managers'];

// An Event's `eventManager` is a user id (API doc: references stay ids).
// Falls back to the id itself while names load, or if the account is gone.
export const resolveEventManagerName = (namesById: ReadonlyMap<string, string>, managerId: string): string =>
  namesById.get(managerId) ?? managerId;

// GET /event-managers is open to every role (unlike GET /users), so every
// Events-list viewer can resolve names; it includes deactivated managers,
// who can still own historical Events.
export const useEventManagerName = (): ((managerId: string) => string) => {
  const eventManagersQuery = tsr.listEventManagers.useQuery({ queryKey: EVENT_MANAGERS_QUERY_KEY });
  const namesById = new Map((eventManagersQuery.data?.body ?? []).map((manager) => [manager.id, manager.name]));
  return (managerId) => resolveEventManagerName(namesById, managerId);
};
