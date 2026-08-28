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
 * createUser, listUsers, updateUser).
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
});
