import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

/**
 * TEMPORARY duplicate of aaradhya-api's src/contract/{index,schemas/*}.ts.
 * aaradhya-api and aaradhya-web are separate repos with no shared
 * @aaradhya/contracts package yet — that's an open item in aaradhya-api's
 * docs/directory-structure.md. Until it's settled, this file has to be kept
 * in sync by hand with the backend contract for every route this app calls;
 * only routes this app actually consumes are mirrored (currently: login,
 * createUser, listUsers, updateUser, listChangeLog, createEvent, listEvents,
 * getEvent, updateEvent, updateEventAccommodation, updateEventPayment,
 * updateDocumentsChecklist, createSession, updateSession, listMenuItems,
 * createItem, updateItem, deleteItem, getCalendar, listEventManagers).
 */
export enum Role {
  EventManager = 'EventManager',
  FnBHead = 'FnBHead',
  Housekeeping = 'Housekeeping',
  Reception = 'Reception',
}

// The one place a role picker (New user form, row-level role change) reads
// its option list from — never free text, never redeclared per component.
export const ROLE_OPTIONS: Role[] = Object.values(Role);

export const loginBodySchema = z.object({
  username: z.string().trim().toLowerCase(),
  password: z.string(),
});

export const loginResultSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    role: z.nativeEnum(Role),
  }),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  }),
});

export const createUserBodySchema = z.object({
  name: z.string().trim().min(1),
  username: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
  role: z.nativeEnum(Role),
});

// The public User Account shape. createdAt/updatedAt arrive over the wire as
// ISO strings, not Date objects — unlike the backend's schema (which types
// them z.date() because the server hands the response real Date instances
// before serialising), this is what a JSON body actually contains.
export const userResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  role: z.nativeEnum(Role),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const userIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user id.'),
});

export const updateUserBodySchema = z.object({
  active: z.boolean().optional(),
  role: z.nativeEnum(Role).optional(),
});

// {id, name} only — GET /event-managers (STORY-037 dependency) is
// deliberately narrower than userResultSchema, any authenticated caller.
export const eventManagerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const listChangeLogQuerySchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
});

// oldValue/newValue are whatever JSON-serialisable shape the changed field
// held (STORY-008) — not a fixed shape here either. timestamp is a string
// over the wire, same reasoning as createdAt/updatedAt above.
export const changeLogEntryResultSchema = z.object({
  id: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  field: z.string(),
  oldValue: z.unknown(),
  newValue: z.unknown(),
  changedBy: z.string(),
  timestamp: z.string(),
});

// SRS §5.1 FR-EVT-6 — the only four states an Event can be in.
export enum EventStatus {
  Tentative = 'Tentative',
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

// SRS §5.3 — the default rows a Client Contact can be, plus a free-form one.
export enum ClientContactRole {
  Bride = 'Bride',
  Groom = 'Groom',
  POC = 'POC',
  Custom = 'Custom',
}

export const CLIENT_CONTACT_ROLE_OPTIONS: ClientContactRole[] = Object.values(ClientContactRole);

// Exported (not local) — the one place a Client Contact row's shape is
// defined, so any form editing rows (create or edit) derives its row type
// from here instead of a hand-declared duplicate (typescript-rules rule 3).
export const clientContactSchema = z.object({
  name: z.string().trim().min(1),
  contactNumber: z.string().trim().min(1),
  role: z.nativeEnum(ClientContactRole),
});

export const eventIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event id.'),
});

export const createEventBodySchema = z.object({
  eventFamilyType: z.string().trim().min(1),
  status: z.nativeEnum(EventStatus).optional(),
  eventManager: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event_manager id.'),
  clientContacts: z.array(clientContactSchema).min(1),
});

// Every field optional (PATCH semantics) — same shape as createEventBodySchema
// otherwise, including clientContacts still needing at least one row (STORY-014
// rejects removing the last remaining Client Contact).
export const updateEventBodySchema = z.object({
  eventFamilyType: z.string().trim().min(1).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  eventManager: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event_manager id.').optional(),
  clientContacts: z.array(clientContactSchema).min(1).optional(),
});

// Exported for the same reason as clientContactSchema — one place a Room
// Line's input shape is defined, so the Rooms tab form derives its row type
// from here instead of a hand-declared duplicate.
export const roomLineSchema = z.object({
  roomType: z.string().trim().min(1),
  occupancy: z.number().min(0),
  tariff: z.number().min(0),
  // A no_of_rooms of 0 is a valid placeholder row (STORY-018's decision,
  // mirrored here) — min(0), not min(1).
  noOfRooms: z.number().min(0),
});

// Every field optional (PATCH semantics) — a caller sends only what
// changed. checkIn/checkOut are plain strings here, not coerced dates: the
// Rooms tab never constructs a JS Date at all (native <input type="date">
// values are already 'YYYY-MM-DD' strings), so there's nothing to coerce.
export const updateAccommodationBodySchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  roomLines: z.array(roomLineSchema).optional(),
});

const roomLineResultSchema = roomLineSchema.extend({
  // Derived (STORY-018) — never accepted as input, always present on output.
  totalInclGst: z.number(),
});

// checkIn/checkOut/totalDays are nullable, not just absent — an Event can
// genuinely have no accommodation entered yet. Wire-format strings, same
// reasoning as every other date field in this file.
export const accommodationResultSchema = z.object({
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable(),
  totalDays: z.number().nullable(),
  roomLines: z.array(roomLineResultSchema),
  totalOccupancy: z.number(),
  totalCharges: z.number(),
});

// Every field optional (PATCH semantics). No cross-field validation between
// advancePaidDate and advancePaid — a caller may set an expected/planned
// advance-payment date before advance_paid actually reflects a real
// payment (STORY-022's decision, mirrored here).
export const updateEventPaymentBodySchema = z.object({
  totalEstimatedAmount: z.number().min(0).optional(),
  advanceRequired: z.number().min(0).optional(),
  advancePaid: z.number().min(0).optional(),
  advancePaidDate: z.string().optional(),
  paymentMode: z.string().trim().min(1).optional(),
});

// balance is derived (STORY-021) — never accepted as input, always present
// on output. advancePaidDate/paymentMode are nullable, matching
// accommodation's checkIn/checkOut convention for "genuinely unset yet".
export const paymentResultSchema = z.object({
  totalEstimatedAmount: z.number(),
  advanceRequired: z.number(),
  advancePaid: z.number(),
  advancePaidDate: z.string().nullable(),
  paymentMode: z.string().nullable(),
  balance: z.number(),
});

// The six fixed Document Checklist item keys (STORY-024) — a server-defined
// constant on the backend; mirrored here as a literal array (not derived
// from documentsChecklistResultSchema's own keys) since this file has no
// shared-package way to introspect a zod object's key list without an `as`
// cast, and this is the one place a stable render order for the tab's
// toggles is defined.
export const DOCUMENT_CHECKLIST_ITEM_KEYS = [
  'aadharCard',
  'panCard',
  'leavingBirthCertificate',
  'rationCard',
  'passportPhotos',
  'weddingCard',
] as const;

export const updateDocumentsChecklistBodySchema = z.object({
  aadharCard: z.boolean().optional(),
  panCard: z.boolean().optional(),
  leavingBirthCertificate: z.boolean().optional(),
  rationCard: z.boolean().optional(),
  passportPhotos: z.boolean().optional(),
  weddingCard: z.boolean().optional(),
});

// Every item always present, always a boolean — STORY-024's "always
// instantiated with false defaults" shape, not accommodation's "may be
// entirely absent" shape.
export const documentsChecklistResultSchema = z.object({
  aadharCard: z.boolean(),
  panCard: z.boolean(),
  leavingBirthCertificate: z.boolean(),
  rationCard: z.boolean(),
  passportPhotos: z.boolean(),
  weddingCard: z.boolean(),
});

// SRS §4.2 — Session Status, independent of the parent Event's own status.
export enum SessionStatus {
  Active = 'Active',
  Cancelled = 'Cancelled',
}

// SRS §4.2's setup.seating — a closed list with an Other catch-all member
// (no "+ custom" wording, unlike sessionType/venue below), mirrored from
// aaradhya-api's own SeatingArrangement enum.
export enum SeatingArrangement {
  Theatre = 'Theatre',
  RoundTables = 'RoundTables',
  Classroom = 'Classroom',
  UShape = 'UShape',
  Cluster = 'Cluster',
  Other = 'Other',
}

export const SEATING_ARRANGEMENT_OPTIONS: SeatingArrangement[] = Object.values(SeatingArrangement);

// Exported for the same reason as clientContactSchema/roomLineSchema — the
// one place a Session's own setup shape is defined, so the Session form
// derives its form-value type from here instead of a hand-declared
// duplicate. Every field optional, matching aaradhya-api's own
// sessionSetupInputSchema — a caller sends only what it's chosen so far.
export const sessionSetupSchema = z.object({
  seating: z.nativeEnum(SeatingArrangement).optional(),
  tableCount: z.number().min(0).optional(),
  chairCount: z.number().min(0).optional(),
  stage: z.boolean().optional(),
  buffet: z.boolean().optional(),
  registrationDesk: z.boolean().optional(),
  vipSeating: z.boolean().optional(),
  brideGroomSeating: z.boolean().optional(),
  notes: z.string().trim().min(1).optional(),
});

// sessionType/venue required, matching aaradhya-api's own
// createSessionBodySchema; startDate/endDate are plain strings, same
// "native <input type=date> already gives 'YYYY-MM-DD', nothing to coerce"
// reasoning updateAccommodationBodySchema already established. No
// session_status — a new Session always starts Active.
export const createSessionBodySchema = z.object({
  sessionType: z.string().trim().min(1),
  venue: z.string().trim().min(1),
  venueCost: z.number().min(0).optional(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
  pax: z.number().min(0).optional(),
  setup: sessionSetupSchema.optional(),
});

// Every field optional (PATCH semantics), unlike createSessionBodySchema —
// a caller sends only what changed. session_status IS accepted here,
// mirroring aaradhya-api's own updateSessionBodySchema — cancelling an
// existing Session is an edit, not something a brand-new Session starts as.
export const updateSessionBodySchema = z.object({
  sessionType: z.string().trim().min(1).optional(),
  venue: z.string().trim().min(1).optional(),
  venueCost: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
  pax: z.number().min(0).optional(),
  sessionStatus: z.nativeEnum(SessionStatus).optional(),
  setup: sessionSetupSchema.optional(),
});

const sessionSetupResultSchema = z.object({
  seating: z.nativeEnum(SeatingArrangement).nullable(),
  tableCount: z.number(),
  chairCount: z.number(),
  stage: z.boolean(),
  buffet: z.boolean(),
  registrationDesk: z.boolean(),
  vipSeating: z.boolean(),
  brideGroomSeating: z.boolean(),
  notes: z.string().nullable(),
});

export const eventSessionParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event id.'),
  sid: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session id.'),
});

export const eventSessionItemParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event id.'),
  sid: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session id.'),
  iid: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item id.'),
});

// SRS §4.5 — a single line within a Session: either a Meal Item or an
// Event Item, mirrored from aaradhya-api's own ItemType enum.
export enum ItemType {
  Meal = 'Meal',
  Event = 'Event',
}

export const listMenuItemsQuerySchema = z.object({
  search: z.string().trim().optional(),
});

// The public Menu Item shape (STORY-030's master list).
export const menuItemResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultCostPerPlate: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Each entry either references an existing Menu Item by id (a search
// result the user picked), or a name to find-or-create (the user typed a
// name with no match and chose "Add '<name>' as a new menu item") —
// mirrors aaradhya-api's own menuItemRefInputSchema exactly; STORY-032's
// endpoint resolves either shape server-side, so this UI never has to
// call POST /menu-items itself.
export const menuItemRefSchema = z.union([
  z.object({ id: z.string() }),
  z.object({ name: z.string().trim().min(1) }),
]);

const mealItemBodySchema = z.object({
  type: z.literal(ItemType.Meal),
  mealName: z.string().trim().min(1),
  pax: z.number().min(0),
  costPerPlate: z.number().min(0),
  menuItems: z.array(menuItemRefSchema).optional(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
});

const eventItemBodySchema = z.object({
  type: z.literal(ItemType.Event),
  eventName: z.string().trim().min(1),
  venue: z.string().trim().min(1),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
});

export const createItemBodySchema = z.discriminatedUnion('type', [mealItemBodySchema, eventItemBodySchema]);

// Every field optional (PATCH semantics) — a caller sends only what
// changed. No `type` — switching an Item between Meal/Event isn't
// offered, mirroring aaradhya-api's own updateItemBodySchema.
export const updateItemBodySchema = z.object({
  mealName: z.string().trim().min(1).optional(),
  pax: z.number().min(0).optional(),
  costPerPlate: z.number().min(0).optional(),
  menuItems: z.array(menuItemRefSchema).optional(),
  eventName: z.string().trim().min(1).optional(),
  venue: z.string().trim().min(1).optional(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
});

// total_cost is derived (STORY-031) — never accepted as input, always
// present on output; null for an Event Item, where the concept doesn't
// apply. This story's own AC: total_cost is never computed client-side,
// only ever displayed from this field.
export const itemResultSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(ItemType),
  mealName: z.string().nullable(),
  pax: z.number().nullable(),
  costPerPlate: z.number().nullable(),
  menuItems: z.array(z.string()),
  eventName: z.string().nullable(),
  venue: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  totalCost: z.number().nullable(),
});

// durationDays/isMultiDay are derived (STORY-026) — never accepted as
// input, always present on output. startTime/endTime/startDate/endDate are
// wire-format strings, same reasoning as every other date field in this
// file. items added STORY-033 — GET /events/:id returned it only once the
// Session form actually needed to read/edit current Item data (same
// retroactive-addition pattern accommodation/payment/documentsChecklist/
// sessions itself already went through).
export const sessionResultSchema = z.object({
  id: z.string(),
  sessionType: z.string(),
  venue: z.string(),
  venueCost: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  pax: z.number(),
  sessionStatus: z.nativeEnum(SessionStatus),
  durationDays: z.number(),
  isMultiDay: z.boolean(),
  setup: sessionSetupResultSchema,
  items: z.array(itemResultSchema),
});

// The public Event shape. createdAt/updatedAt are wire-format strings, same
// reasoning as userResultSchema above. accommodation added STORY-020,
// payment added STORY-023, documentsChecklist added STORY-025, sessions
// added STORY-029 — GET /events/:id returned none of them until the screen
// that needed to read current state on first render actually landed (see
// aaradhya-api's STORY-020/STORY-023/STORY-025/STORY-028 Decisions for why
// these live on eventResultSchema and not a dedicated GET each).
export const eventResultSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventFamilyType: z.string(),
  status: z.nativeEnum(EventStatus),
  eventManager: z.string(),
  clientContacts: z.array(clientContactSchema),
  accommodation: accommodationResultSchema,
  payment: paymentResultSchema,
  documentsChecklist: documentsChecklistResultSchema,
  sessions: z.array(sessionResultSchema),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const getCalendarQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1970).max(2100),
});

// A slim summary of the parent Event — id/eventFamilyType/status, enough
// for the calendar to render one chip without a second round-trip per
// session (STORY-034's own AC).
// eventManager added STORY-037 — the calendar's own Event Manager filter
// chip filters the already-fetched month's data client-side.
export const calendarEventSummarySchema = z.object({
  id: z.string(),
  eventFamilyType: z.string(),
  status: z.nativeEnum(EventStatus),
  eventManager: z.string(),
});

export const calendarSessionResultSchema = sessionResultSchema.extend({
  event: calendarEventSummarySchema,
});

export const contract = c.router({
  login: {
    method: 'POST',
    path: '/auth/login',
    body: loginBodySchema,
    responses: {
      200: loginResultSchema,
      401: apiErrorSchema,
    },
    summary: 'Exchange username + password for a session token',
  },
  createUser: {
    method: 'POST',
    path: '/users',
    body: createUserBodySchema,
    responses: {
      201: userResultSchema,
      409: apiErrorSchema,
    },
    summary: 'Create a User Account (Event Manager only)',
  },
  listUsers: {
    method: 'GET',
    path: '/users',
    responses: {
      200: z.array(userResultSchema),
    },
    summary: 'List all User Accounts (Event Manager only)',
  },
  updateUser: {
    method: 'PATCH',
    path: '/users/:id',
    pathParams: userIdParamsSchema,
    body: updateUserBodySchema,
    responses: {
      200: userResultSchema,
      404: apiErrorSchema,
    },
    summary: 'Toggle active and/or change role on a User Account (Event Manager only)',
  },
  listEventManagers: {
    method: 'GET',
    path: '/event-managers',
    responses: {
      200: z.array(eventManagerSummarySchema),
    },
    summary: 'List {id, name} for every Event Manager account (any authenticated caller)',
  },
  listChangeLog: {
    method: 'GET',
    path: '/change-log',
    query: listChangeLogQuerySchema,
    responses: {
      200: z.array(changeLogEntryResultSchema),
    },
    summary: 'List Change Log Entries for one entity (Event Manager only)',
  },
  createEvent: {
    method: 'POST',
    path: '/events',
    body: createEventBodySchema,
    responses: {
      201: eventResultSchema,
      400: apiErrorSchema,
    },
    summary: 'Create an Event (Event Manager only)',
  },
  listEvents: {
    method: 'GET',
    path: '/events',
    responses: {
      200: z.array(eventResultSchema),
    },
    summary: 'List all Events (any authenticated caller)',
  },
  getEvent: {
    method: 'GET',
    path: '/events/:id',
    pathParams: eventIdParamsSchema,
    responses: {
      200: eventResultSchema,
      404: apiErrorSchema,
    },
    summary: 'Get one Event by id (any authenticated caller)',
  },
  updateEvent: {
    method: 'PATCH',
    path: '/events/:id',
    pathParams: eventIdParamsSchema,
    body: updateEventBodySchema,
    responses: {
      200: eventResultSchema,
      400: apiErrorSchema,
      404: apiErrorSchema,
    },
    summary: 'Edit core fields and/or Client Contacts on an Event (Event Manager only)',
  },
  updateEventAccommodation: {
    method: 'PATCH',
    path: '/events/:id/accommodation',
    pathParams: eventIdParamsSchema,
    body: updateAccommodationBodySchema,
    responses: {
      200: accommodationResultSchema,
      404: apiErrorSchema,
    },
    summary: "Edit an Event's Accommodation Block (Event Manager only)",
  },
  updateEventPayment: {
    method: 'PATCH',
    path: '/events/:id/payment',
    pathParams: eventIdParamsSchema,
    body: updateEventPaymentBodySchema,
    responses: {
      200: paymentResultSchema,
      404: apiErrorSchema,
    },
    summary: "Edit an Event's Payment Record (Event Manager only)",
  },
  updateDocumentsChecklist: {
    method: 'PATCH',
    path: '/events/:id/documents',
    pathParams: eventIdParamsSchema,
    body: updateDocumentsChecklistBodySchema,
    responses: {
      200: documentsChecklistResultSchema,
      404: apiErrorSchema,
    },
    summary: "Toggle items on an Event's Documents Checklist (Event Manager only)",
  },
  createSession: {
    method: 'POST',
    path: '/events/:id/sessions',
    pathParams: eventIdParamsSchema,
    body: createSessionBodySchema,
    responses: {
      201: sessionResultSchema,
      400: apiErrorSchema,
      404: apiErrorSchema,
    },
    summary: 'Add a Session to an Event (Event Manager only)',
  },
  updateSession: {
    method: 'PATCH',
    path: '/events/:id/sessions/:sid',
    pathParams: eventSessionParamsSchema,
    body: updateSessionBodySchema,
    responses: {
      200: sessionResultSchema,
      400: apiErrorSchema,
      404: apiErrorSchema,
    },
    summary: "Edit one of an Event's Sessions (Event Manager only)",
  },
  listMenuItems: {
    method: 'GET',
    path: '/menu-items',
    query: listMenuItemsQuerySchema,
    responses: {
      200: z.array(menuItemResultSchema),
    },
    summary: 'Search the shared Menu Item master list (any authenticated caller)',
  },
  createItem: {
    method: 'POST',
    path: '/events/:id/sessions/:sid/items',
    pathParams: eventSessionParamsSchema,
    body: createItemBodySchema,
    responses: {
      201: itemResultSchema,
      400: apiErrorSchema,
      404: apiErrorSchema,
    },
    summary: 'Add a Meal or Event Item to a Session (Event Manager only)',
  },
  updateItem: {
    method: 'PATCH',
    path: '/events/:id/sessions/:sid/items/:iid',
    pathParams: eventSessionItemParamsSchema,
    body: updateItemBodySchema,
    responses: {
      200: itemResultSchema,
      400: apiErrorSchema,
      404: apiErrorSchema,
    },
    summary: "Edit one of a Session's Items (Event Manager only)",
  },
  deleteItem: {
    method: 'DELETE',
    path: '/events/:id/sessions/:sid/items/:iid',
    pathParams: eventSessionItemParamsSchema,
    responses: {
      204: c.noBody(),
      404: apiErrorSchema,
    },
    summary: "Remove one of a Session's Items (Event Manager only)",
  },
  getCalendar: {
    method: 'GET',
    path: '/calendar',
    query: getCalendarQuerySchema,
    responses: {
      200: z.array(calendarSessionResultSchema),
    },
    summary: 'Active Sessions overlapping any date within a given month (any authenticated caller)',
  },
});
