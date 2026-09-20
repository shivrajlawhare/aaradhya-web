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
 * updateDocumentsChecklist, updateEventExtras, getQuotationSummary,
 * getQuotationPdf, createSession, updateSession, listMenuItems,
 * createMenuItem, createItem, updateItem, deleteItem, getCalendar,
 * listEventManagers, getDashboard, listVenues, createVenue, updateVenue,
 * listEventTypes, createEventType, updateEventType, listRoomTypes,
 * createRoomType, updateRoomType).
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
  // STORY-081 — absent on any entry written before this field existed; the
  // frontend renders such an entry as its own single-item group.
  groupId: z.string().optional(),
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

// Every field optional (PATCH semantics) — same shape as createEventBodySchema
// otherwise, including clientContacts still needing at least one row (STORY-014
// rejects removing the last remaining Client Contact).
export const updateEventBodySchema = z.object({
  eventFamilyType: z.string().trim().min(1).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  eventManager: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event_manager id.').optional(),
  clientContacts: z.array(clientContactSchema).min(1).optional(),
  // STORY-072 — mirrors aaradhya-api's own updateEventBodySchema.
  foodGstRatePercent: z.number().min(0).optional(),
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
// Rooms tab's own form state is already a 'YYYY-MM-DD' string (STORY-057's
// DatePicker converts to/from one at its own value/onChange boundary, same
// format the native <input type="date"> it replaced always produced), so
// there's nothing to coerce.
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

// Role-filtered variants, mirroring aaradhya-api's own filteredRoomLineResultSchema/
// filteredAccommodationResultSchema (STORY-046/050) — tariff/totalInclGst/
// totalCharges are `.optional()` (undefined, not just missing from the
// type), since money is stripped from the accommodation block even for a
// role permitted to see rooms-booked detail at all (Housekeeping/
// Reception). Used by GET /events/:id's own filteredEventResultSchema
// (STORY-052) and the dashboard's own row shape (STORY-050) — the same
// relaxed shape either place a role-filtered accommodation object appears.
export const filteredRoomLineResultSchema = roomLineSchema.extend({
  tariff: z.number().optional(),
  totalInclGst: z.number().optional(),
});

export const filteredAccommodationResultSchema = accommodationResultSchema.extend({
  roomLines: z.array(filteredRoomLineResultSchema),
  totalCharges: z.number().optional(),
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

// One numeric field per fixed key — same "fixed, closed set of named keys"
// shape documentsChecklistResultSchema above uses, mirroring aaradhya-api's
// own extrasFieldsSchema (STORY-040).
const extrasFieldsSchema = z.object({
  decoration: z.number().min(0).optional(),
  photographer: z.number().min(0).optional(),
  bhatji: z.number().min(0).optional(),
});

export const updateEventExtrasBodySchema = extrasFieldsSchema.strict();

// Every Event always has all three amounts (defaulted to 0), same "always
// instantiated" convention payment/documentsChecklist already use.
export const extrasResultSchema = extrasFieldsSchema.required();

// SRS FR-QUO-9a / Assumption A13 — mirrors aaradhya-api's own
// manualLineItemFieldsSchema/manualLineItemResultSchema (STORY-068): an
// open-ended manual line item for the Total Cost Summary, additive
// alongside decoration/photographer/bhatji above, not a replacement.
export const manualLineItemSchema = z.object({
  name: z.string().trim().min(1),
  note: z.string().trim().min(1).optional(),
  amount: z.number().min(0),
});

export const manualLineItemResultSchema = z.object({
  name: z.string(),
  note: z.string().nullable(),
  amount: z.number(),
});

// The exact 6 fields aaradhya-api's computeTotalCostSummary produces
// (STORY-039) — mirrors quotationSummaryResultSchema field-for-field.
export const quotationSummaryResultSchema = z.object({
  venueTotal: z.number(),
  foodSubtotal: z.number(),
  foodTotalInclGst: z.number(),
  accommodationTotal: z.number(),
  extrasTotal: z.number(),
  grandTotal: z.number(),
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

// Exported (not local) — STORY-050's dashboard schema, further down this
// file, reuses it verbatim for Housekeeping's own "setup" column, same
// reasoning aaradhya-api's own STORY-050 export of this schema gives.
export const sessionSetupResultSchema = z.object({
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

// defaultCostPerPlate optional, falling back to the backend schema's own
// default (0) — mirrors aaradhya-api's own createMenuItemBodySchema.
// Item entry never calls this route itself (menu-item-search.tsx's own
// find-or-create chip resolves server-side, via createItem/updateItem's
// menuItemRefSchema); this is Settings' (STORY-062) own "+ Add" on the
// Menu Item section, a second entry point onto the same master list.
export const createMenuItemBodySchema = z.object({
  name: z.string().trim().min(1),
  defaultCostPerPlate: z.number().min(0).optional(),
});

// Mirrors aaradhya-api's own updateMenuItemBodySchema — no `active` (that
// section still has no such field), editing name/cost is a separate
// capability from deactivating one.
export const updateMenuItemBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  defaultCostPerPlate: z.number().min(0).optional(),
});

export const menuItemIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid menu item id.'),
});

// STORY-061's three master lists — Venue/EventType/RoomType. No `active`
// on Menu Item (above) since aaradhya-api's own MenuItem model has never
// had one — Settings still has no deactivate toggle for that section, but
// name/cost are editable (updateMenuItemBodySchema above), a genuinely
// separate capability from deactivating one.
export const venueResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultVenueCost: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createVenueBodySchema = z.object({
  name: z.string().trim().min(1),
  defaultVenueCost: z.number().min(0),
});

export const updateVenueBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  defaultVenueCost: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export const venueIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid venue id.'),
});

export const eventTypeResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createEventTypeBodySchema = z.object({
  name: z.string().trim().min(1),
});

export const updateEventTypeBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
});

export const eventTypeIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event type id.'),
});

export const roomTypeResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultTariff: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createRoomTypeBodySchema = z.object({
  name: z.string().trim().min(1),
  defaultTariff: z.number().min(0),
});

export const updateRoomTypeBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  defaultTariff: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export const roomTypeIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid room type id.'),
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
  limitedSeating: z.boolean().optional(),
  menuItems: z.array(menuItemRefSchema).optional(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
});

// STORY-071 — eventName/venue relaxed from required to optional, mirroring
// aaradhya-api's own eventItemBodySchema: both reference quotations
// (aaradhya-api's docs/example_quatations/) print Ceremony/Event Items with
// no venue at all, and one has a Ceremony Item with every field left blank.
const eventItemBodySchema = z.object({
  type: z.literal(ItemType.Event),
  eventName: z.string().trim().optional(),
  venue: z.string().trim().optional(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
});

export const createItemBodySchema = z.discriminatedUnion('type', [mealItemBodySchema, eventItemBodySchema]);

// STORY-068 — a Session as it's nested inside createEventBodySchema below,
// mirroring aaradhya-api's own createEventSessionInputSchema: identical to
// createSessionBodySchema except it also accepts its own `items` up front.
const createEventSessionInputSchema = z.object({
  sessionType: z.string().trim().min(1),
  venue: z.string().trim().min(1),
  venueCost: z.number().min(0).optional(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
  pax: z.number().min(0).optional(),
  setup: sessionSetupSchema.optional(),
  items: z.array(createItemBodySchema).optional(),
});

// STORY-068 — the wizard's own "Generate Quotation" submits the entire
// accumulated flow (Client Contacts, Sessions with their own Items,
// Accommodation, and the Total Cost Summary's manual line items) as this
// single call, mirroring aaradhya-api's own extended createEventBodySchema
// (FR-EVT-8: "exactly one data-entry flow," never a sequence of partial
// per-step writes).
export const createEventBodySchema = z.object({
  eventFamilyType: z.string().trim().min(1),
  status: z.nativeEnum(EventStatus).optional(),
  eventManager: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event_manager id.'),
  clientContacts: z.array(clientContactSchema).min(1),
  sessions: z.array(createEventSessionInputSchema).optional(),
  accommodation: updateAccommodationBodySchema.optional(),
  extras: extrasFieldsSchema.optional(),
  extraLineItems: z.array(manualLineItemSchema).optional(),
  // STORY-072 — defaults to 5 server-side when omitted (mirrors
  // aaradhya-api's own createEventBodySchema).
  foodGstRatePercent: z.number().min(0).optional(),
});

// Every field optional (PATCH semantics) — a caller sends only what
// changed. No `type` — switching an Item between Meal/Event isn't
// offered, mirroring aaradhya-api's own updateItemBodySchema.
// eventName/venue no longer require min(1) (STORY-071, mirroring
// aaradhya-api) — an explicit "" clears a previously-set value back to
// blank rather than being rejected.
export const updateItemBodySchema = z.object({
  mealName: z.string().trim().min(1).optional(),
  pax: z.number().min(0).optional(),
  costPerPlate: z.number().min(0).optional(),
  limitedSeating: z.boolean().optional(),
  menuItems: z.array(menuItemRefSchema).optional(),
  eventName: z.string().trim().optional(),
  venue: z.string().trim().optional(),
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
  limitedSeating: z.boolean().nullable(),
  menuItems: z.array(z.string()),
  eventName: z.string().nullable(),
  venue: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  totalCost: z.number().nullable(),
});

// Mirrors aaradhya-api's own filteredItemResultSchema (STORY-046) —
// costPerPlate/totalCost are `.optional()` on top of their existing
// `.nullable()`, since a role that can see an Item at all (F&B Head only)
// still doesn't see its cost.
export const filteredItemResultSchema = itemResultSchema.extend({
  costPerPlate: z.number().nullable().optional(),
  totalCost: z.number().nullable().optional(),
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

// Mirrors aaradhya-api's own filteredSessionResultSchema (STORY-046) —
// venueCost (money) is `.optional()` for everyone but Event Manager;
// setup is `.optional()`, present only for Housekeeping; items is
// `.optional()`, present (Meal Items only) only for F&B Head. Used by
// filteredEventResultSchema below, GET /events/:id's own response shape
// (STORY-052) — every non-EventManager role now genuinely reaches this
// screen, so the type has to reflect what the wire actually sends them,
// not what an EventManager always gets.
export const filteredSessionResultSchema = sessionResultSchema.extend({
  venueCost: z.number().optional(),
  setup: sessionSetupResultSchema.optional(),
  items: z.array(filteredItemResultSchema).optional(),
});

// The public Event shape. createdAt/updatedAt are wire-format strings, same
// reasoning as userResultSchema above. accommodation added STORY-020,
// payment added STORY-023, documentsChecklist added STORY-025, sessions
// added STORY-029, extras added STORY-042 — GET /events/:id returned none
// of them until the screen that needed to read current state on first
// render actually landed (see aaradhya-api's STORY-020/STORY-023/
// STORY-025/STORY-028/STORY-042 Decisions for why these live on
// eventResultSchema and not a dedicated GET each).
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
  extras: extrasResultSchema,
  extraLineItems: z.array(manualLineItemResultSchema),
  // STORY-072 — mirrors aaradhya-api's own eventResultSchema.
  foodGstRatePercent: z.number(),
  sessions: z.array(sessionResultSchema),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Mirrors aaradhya-api's own filteredEventResultSchema (STORY-046) — this
// is what GET /events/:id actually returns for every caller (STORY-052):
// clientContacts/accommodation/payment/extras are `.optional()`, undefined
// entirely for a role STORY-046's own filterEventForRole doesn't grant
// them to (documentsChecklist stays required — every role sees it, per
// that story's own decision). Until STORY-052, only an Event Manager ever
// actually opened Event Detail, so nothing forced this repo's own mirror
// to catch up with the backend's role-filtered shape sooner — `eventResultSchema`
// itself is kept as-is (still used by createEvent/updateEvent, both
// EventManager-only routes that always return the full, unfiltered shape).
export const filteredEventResultSchema = eventResultSchema.extend({
  clientContacts: z.array(clientContactSchema).optional(),
  accommodation: filteredAccommodationResultSchema.optional(),
  payment: paymentResultSchema.optional(),
  extras: extrasResultSchema.optional(),
  extraLineItems: z.array(manualLineItemResultSchema).optional(),
  // STORY-072 — hidden for every non-EventManager role, mirrors
  // aaradhya-api's own filteredEventResultSchema.
  foodGstRatePercent: z.number().optional(),
  sessions: z.array(filteredSessionResultSchema),
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

// One row per qualifying Event (its soonest upcoming Session), per SRS
// FR-ROLE-2's own named columns: "date, event, client, venue, pax,
// status." clientContacts is `.optional()`, same "genuinely absent, not
// null" convention aaradhya-api's own filteredEventResultSchema already
// established (STORY-046) — this list reuses that same role-based
// filtering server-side, so a role that can't see client names never gets
// this key at all. date is a wire-format string, same reasoning every
// other date field in this file already uses.
// meals: STORY-049's own "menu/meal-timing information" — one entry per
// Meal Item on this row's soonest upcoming Session, `.optional()` on the
// same "genuinely absent, not null" convention as clientContacts. Present
// only for F&B Head (aaradhya-api's own role gate); `[]`, not absent, when
// F&B Head can see it but the session has no Meal Items yet. Scoped to
// mealName + start/end time only, not the resolved menuItems dish names
// (aaradhya-api's own STORY-049 Decisions record why that join is out of
// scope for a dashboard summary row).
export const dashboardUpcomingMealResultSchema = z.object({
  mealName: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
});

// setup/accommodation: STORY-050's own "setup/rooms detail visible"
// (Housekeeping), SRS §3.3 — setup reuses sessionSetupResultSchema verbatim
// for the row's soonest upcoming Session (Housekeeping only); accommodation
// reuses filteredAccommodationResultSchema (Housekeeping AND Reception —
// also directly covers STORY-051's own "rooms, check-in/out visible"
// bullet). Both `.optional()`, undefined for every role that can't see
// them, including Event Manager — same "extra column vs. the Event
// Manager view" framing as `meals`.
export const dashboardUpcomingEventResultSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventFamilyType: z.string(),
  status: z.nativeEnum(EventStatus),
  date: z.string(),
  venue: z.string(),
  pax: z.number(),
  clientContacts: z.array(clientContactSchema).optional(),
  meals: z.array(dashboardUpcomingMealResultSchema).optional(),
  setup: sessionSetupResultSchema.optional(),
  accommodation: filteredAccommodationResultSchema.optional(),
});

// Counts are identical across roles (STORY-047's own AC) — nothing about a
// count number itself is sensitive, only the per-event field detail in
// upcomingEvents is.
export const dashboardResultSchema = z.object({
  counts: z.object({
    todaysEvents: z.number(),
    upcoming: z.number(),
    tentative: z.number(),
    confirmed: z.number(),
  }),
  upcomingEvents: z.array(dashboardUpcomingEventResultSchema),
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
      200: filteredEventResultSchema,
      404: apiErrorSchema,
    },
    summary: 'Get one Event by id, fields filtered per the caller role (any authenticated caller)',
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
  updateEventExtras: {
    method: 'PATCH',
    path: '/events/:id/extras',
    pathParams: eventIdParamsSchema,
    body: updateEventExtrasBodySchema,
    responses: {
      200: extrasResultSchema,
      404: apiErrorSchema,
    },
    summary: "Edit an Event's Quotation extras — Decoration/Photographer/Bhatji (Event Manager only)",
  },
  getQuotationSummary: {
    method: 'GET',
    path: '/events/:id/quotation-summary',
    pathParams: eventIdParamsSchema,
    responses: {
      200: quotationSummaryResultSchema,
      404: apiErrorSchema,
    },
    summary: "Get an Event's live Total Cost Summary rollup (any authenticated caller)",
  },
  // c.otherResponse — mirrors aaradhya-api's own binary route exactly,
  // except body is c.type<Blob>() here, not <Buffer> — the browser fetch
  // client this app uses has no Buffer; ts-rest's own default fetch client
  // (src/api/client.ts's tsr) already branches on Content-Type and calls
  // response.blob() for anything that isn't JSON/text, so no hand-written
  // fetch is needed to consume this route.
  getQuotationPdf: {
    method: 'GET',
    path: '/events/:id/quotation.pdf',
    pathParams: eventIdParamsSchema,
    responses: {
      200: c.otherResponse({ contentType: 'application/pdf', body: c.type<Blob>() }),
      404: apiErrorSchema,
    },
    summary: 'Generate the client-facing Quotation PDF from live Event data (Event Manager only)',
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
  createMenuItem: {
    method: 'POST',
    path: '/menu-items',
    body: createMenuItemBodySchema,
    responses: {
      201: menuItemResultSchema,
      409: apiErrorSchema,
    },
    summary: 'Add a Menu Item to the shared master list (any authenticated caller)',
  },
  updateMenuItem: {
    method: 'PATCH',
    path: '/menu-items/:id',
    pathParams: menuItemIdParamsSchema,
    body: updateMenuItemBodySchema,
    responses: {
      200: menuItemResultSchema,
      404: apiErrorSchema,
      409: apiErrorSchema,
    },
    summary: 'Edit name/default cost on a Menu Item (any authenticated caller)',
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
  getDashboard: {
    method: 'GET',
    path: '/dashboard',
    responses: {
      200: dashboardResultSchema,
    },
    summary:
      'Role-filtered dashboard aggregate: today/upcoming/tentative/confirmed counts + upcoming-events list (any authenticated caller)',
  },
  // STORY-061's three master lists, consumed by Settings (STORY-062). Every
  // GET is any-authenticated-caller; every write is Event Manager only —
  // Settings itself is RequireRole-gated to Event Manager, so this app
  // never actually calls a write route as anyone else, but the contract
  // still mirrors the backend's real gate rather than assuming its own caller.
  listVenues: {
    method: 'GET',
    path: '/venues',
    responses: {
      200: z.array(venueResultSchema),
    },
    summary: 'List every Venue, active and inactive (any authenticated caller)',
  },
  createVenue: {
    method: 'POST',
    path: '/venues',
    body: createVenueBodySchema,
    responses: {
      201: venueResultSchema,
      409: apiErrorSchema,
    },
    summary: 'Add a Venue to the master list (Event Manager only)',
  },
  updateVenue: {
    method: 'PATCH',
    path: '/venues/:id',
    pathParams: venueIdParamsSchema,
    body: updateVenueBodySchema,
    responses: {
      200: venueResultSchema,
      404: apiErrorSchema,
      409: apiErrorSchema,
    },
    summary: 'Edit name/default cost and/or toggle active on a Venue (Event Manager only)',
  },
  listEventTypes: {
    method: 'GET',
    path: '/event-types',
    responses: {
      200: z.array(eventTypeResultSchema),
    },
    summary: 'List every Event Type, active and inactive (any authenticated caller)',
  },
  createEventType: {
    method: 'POST',
    path: '/event-types',
    body: createEventTypeBodySchema,
    responses: {
      201: eventTypeResultSchema,
      409: apiErrorSchema,
    },
    summary: 'Add an Event Type to the master list (Event Manager only)',
  },
  updateEventType: {
    method: 'PATCH',
    path: '/event-types/:id',
    pathParams: eventTypeIdParamsSchema,
    body: updateEventTypeBodySchema,
    responses: {
      200: eventTypeResultSchema,
      404: apiErrorSchema,
      409: apiErrorSchema,
    },
    summary: 'Edit name and/or toggle active on an Event Type (Event Manager only)',
  },
  listRoomTypes: {
    method: 'GET',
    path: '/room-types',
    responses: {
      200: z.array(roomTypeResultSchema),
    },
    summary: 'List every Room Type, active and inactive (any authenticated caller)',
  },
  createRoomType: {
    method: 'POST',
    path: '/room-types',
    body: createRoomTypeBodySchema,
    responses: {
      201: roomTypeResultSchema,
      409: apiErrorSchema,
    },
    summary: 'Add a Room Type to the master list (Event Manager only)',
  },
  updateRoomType: {
    method: 'PATCH',
    path: '/room-types/:id',
    pathParams: roomTypeIdParamsSchema,
    body: updateRoomTypeBodySchema,
    responses: {
      200: roomTypeResultSchema,
      404: apiErrorSchema,
      409: apiErrorSchema,
    },
    summary: 'Edit name/default tariff and/or toggle active on a Room Type (Event Manager only)',
  },
});
