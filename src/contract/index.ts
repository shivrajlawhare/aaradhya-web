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
 * getEvent, updateEvent).
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

// The public Event shape. createdAt/updatedAt are wire-format strings, same
// reasoning as userResultSchema above.
export const eventResultSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventFamilyType: z.string(),
  status: z.nativeEnum(EventStatus),
  eventManager: z.string(),
  clientContacts: z.array(clientContactSchema),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
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
});
