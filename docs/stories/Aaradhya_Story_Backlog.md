# Aaradhya Event Management System — Development Story Backlog

**Source spec:** `Aaradhya_SRS_v1.1.md` (folds in `Spec_Amendment_MultiDate_Sessions.md`)
**Source theme:** the token set from the Aaradhya UI Concept mockup (Prompt 3) — the live Figma build stalled on the Starter-plan MCP rate limit before its Theme page could be created, so token names/values below are taken from the published HTML mockup instead. They are otherwise final and map 1:1 to Figma variables whenever that build resumes.
**Build order:** Auth → Change History (foundational service) → Event Management → Session & Calendar Management → Quotation Generation → Role-Based Dashboards & Views. This follows §8 of the SRS, with Change History promoted earlier because every later module's acceptance criteria depends on it existing. Client Management (§5.3 of the SRS) has no stories of its own — Client Contacts are embedded fields on Event, built inside the Event Management module (STORY-011/014/015).

Each story is scoped to one of: a schema/model (no endpoint, no UI), one or two closely related endpoints against an existing schema (no UI), or one screen/panel against existing endpoints — never more than one of these three at once, per the build constraint. "System flow" describes what happens end-to-end even when a story only implements one leg of it, so the next story's starting point is clear.

## Design Token Legend

Referenced by short name in each story's **Tokens** line.

| Short name | Value | Role |
|---|---|---|
| `bg` | `#F5EEE1` (ivory) | Page ground |
| `surface` | `#FFFFFF` | Card / screen surface |
| `surface-2` | `#FBF6EC` | App bar, summary card fill |
| `text` | `#322D28` | Primary text (ink) |
| `text-soft` | `#6F675C` | Secondary text |
| `text-faint` | `#A79C8C` | Captions, placeholders |
| `line` | `#E6DAC4` | Hairline borders/dividers |
| `accent` | `#E4630C` (ember) | Single primary-action color |
| `accent-deep` | `#B84607` | Accent pressed/dark state |
| `accent-tint` | `#FBE3D0` | Accent chip/badge fill |
| `status-tentative` / `-tint` | `#B8862B` / `#F3E4BE` | Tentative status |
| `status-confirmed` / `-tint` | `#B5442F` / `#F1D9D0` | Confirmed status |
| `status-completed` / `-tint` | `#8B8377` / `#EAE5DA` | Completed status |
| `status-cancelled` / `-tint` | `#4A443C` / `#DFDACF` | Cancelled / Session Cancelled status |
| `type-display` | Fraunces 600 | Wordmark, Quotation header only |
| `type-title-l` / `-m` | Inter 600, 22px / 17px | Screen and section titles |
| `type-body-l` / `-m` | Inter 400, 15px / 13px | Body copy |
| `type-label-s` | Inter 600, 11px, uppercase, tracked | Eyebrows, tab labels |
| `space-*` | 4 / 8 / 12 / 16 / 24 / 32 | Layout spacing scale |
| `radius-sm` / `-md` / `-lg` | 8 / 12 / 20px | Corner radius scale |

---

## Module: Authentication & User Management (SRS §5.6)

### STORY-001: User Account schema
**Flow:** No user-facing flow yet — this defines the persisted shape every later Auth story builds on: a User Account with a name, unique username, salted password hash, one of the four Role values, and an `active` flag.
**Acceptance Criteria:**
- [ ] Schema rejects a document missing `name`, `username`, `passwordHash`, or `role`.
- [ ] `role` accepts only `EventManager | FnBHead | Housekeeping | Reception`; any other value is rejected.
- [ ] `username` has a uniqueness constraint enforced at the schema/index level.
- [ ] `active` defaults to `true` when not supplied.
- [ ] Unit tests cover: valid document persists, each required-field omission fails, duplicate username fails, invalid role fails.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Username differing only by case (decide and document whether uniqueness is case-insensitive); attempting to set `role` to an empty string; re-activating a previously deactivated account (schema must allow `active` to flip both ways).

### STORY-002: POST /auth/login
**Flow:** A user submits username + password; the server verifies the password hash and returns a signed session token containing the user's id and role.
**Acceptance Criteria:**
- [ ] Correct username/password returns 200 with a token and the user's `id`, `name`, `role`.
- [ ] Wrong password returns 401 with no token.
- [ ] Unknown username returns 401 (same error shape as wrong password — no username enumeration).
- [ ] `active: false` account returns 401 even with correct password.
- [ ] Password is never present in any response body.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Empty-string password; username with leading/trailing whitespace; repeated failed attempts (no lockout required for v1, but confirm this is a deliberate non-requirement, not an oversight).

### STORY-003: Auth middleware + role guard
**Flow:** Every protected request carries the token from STORY-002; middleware verifies it, attaches `req.user = {id, role}`, and a `requireRole(...roles)` guard rejects requests from the wrong role before the route handler runs.
**Acceptance Criteria:**
- [ ] A request with no token to a protected test route returns 401.
- [ ] A request with a valid token attaches `req.user` and reaches the handler.
- [ ] A request with a valid token but a role not in `requireRole(...)`'s allow-list returns 403.
- [ ] A tampered/invalid-signature token returns 401.
- [ ] Middleware and guard are covered by tests against a throwaway test route, independent of any real feature route.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Expired token; token for a user later deactivated (decide: does an active session stay valid until it expires, or is it invalidated on deactivation? — document the v1 answer at the top of this story before starting it).

### STORY-004: Login screen UI
**Flow:** A user opens the app, sees the login screen, enters username/password, and on success is routed to their role's dashboard (dashboard itself doesn't exist yet — route to a placeholder).
**Acceptance Criteria:**
- [ ] Username and password fields, both required before the submit control is enabled.
- [ ] Submit calls STORY-002; a 401 response shows a single inline error message ("Incorrect username or password.") without indicating which field was wrong.
- [ ] A successful login stores the token and navigates away from the login screen.
- [ ] Password field masks input.
- [ ] No console errors on load or on the error path.
**UI:** Login screen — logo mark, username field, password field, primary button, inline error slot.
**Tokens:** `bg`, `surface`, `text`, `text-faint`, `accent` (button), `type-title-l` (screen title), `type-body-m` (error text), `radius-sm` (inputs/button), `space-16`/`space-24`.
**Edge cases:** Submitting with Enter key, not just the button; double-submit while a request is in flight (button must disable); very long username input.
**Decisions (v1):**
- First real screen — this story also stands up the frontend scaffold
  (`package.json`, MUI theme, `src/contract/`, `src/api/client.ts`,
  `src/stores/auth-context.tsx`) since it hadn't been built yet. Full list of
  scaffold-level calls in `README.md`.
- No zod resolver on the login form — `loginBodySchema` deliberately allows an
  empty password (STORY-002's uniform-401 design), so it can't drive the
  "both fields required before submit enables" UI rule. Enablement is derived
  directly from the watched field values instead.
- `@ts-rest/react-query/v5`'s mutation hooks route every non-2xx (declared
  error responses and network failures alike) to `onError`, not `onSuccess` —
  that split is what the uniform-401 handling here relies on.
- `react-router-dom` added — a gap in the architecture doc, not a documented
  pick; the standard choice for a Vite + React SPA. No route guard yet.

### STORY-005: POST /users
**Flow:** An Event Manager creates a new User Account (name, username, initial password, role) from the not-yet-built User Management screen.
**Acceptance Criteria:**
- [ ] Only a caller with role `EventManager` (via STORY-003's guard) can call this endpoint; others get 403.
- [ ] Valid payload creates a User Account per STORY-001's schema and returns it without the password hash.
- [ ] Duplicate username returns 409 with a clear error code/message.
- [ ] Missing required field returns 400 listing which field(s).
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Creating a user with role `EventManager` itself (must be allowed — nothing in the spec caps the count at exactly 3, that's a current headcount, not a system limit); empty-string password.

### STORY-006: GET /users, PATCH /users/:id
**Flow:** An Event Manager lists all User Accounts and can deactivate one or change its role.
**Acceptance Criteria:**
- [ ] `GET /users` (EventManager-only, 403 otherwise) returns all accounts, passwords excluded.
- [ ] `PATCH /users/:id` can toggle `active` and change `role`; both are independently settable.
- [ ] Response reflects the update; a subsequent `GET /users` shows the new state.
- [ ] Attempting to deactivate or edit a non-existent `:id` returns 404.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** An Event Manager deactivating their own account (decide and document: allowed but they lose access immediately, or blocked — this is a real product decision, flag it back to the user if not already answered).

### STORY-007: User Management screen UI
**Flow:** An Event Manager opens User Management, sees the account list from STORY-006, and creates or edits accounts via a form calling STORY-005/006.
**Acceptance Criteria:**
- [ ] Screen is unreachable (route-guarded) for any role other than EventManager, verified by attempting navigation as a non-EventManager session.
- [ ] Table lists name, username, role, active/inactive state for every account.
- [ ] "New user" form requires name, username, password, role before submit is enabled; success adds a row without a full page reload.
- [ ] Deactivate control flips `active` via STORY-006 and the row updates in place.
- [ ] Role change control updates via STORY-006 and the row updates in place.
**UI:** User Management screen — table + "New user" form (name, username, password, role dropdown), row-level deactivate toggle and role dropdown.
**Tokens:** `surface`, `line` (table rows), `text`, `text-soft`, `status-tentative`/`status-completed` tints repurposed as active/inactive indicators, `type-title-l`, `type-label-s` (column headers), `radius-md` (cards).
**Edge cases:** Deactivating the account that is currently logged in and viewing this exact screen; role list must exactly match the four SRS roles, no free text.
**Decisions (v1):**
- Route guard is a reusable `<RequireRole roles={[...]}>` (`src/components/ui/`):
  no session → `/login`; wrong role → `/dashboard`. Neither branch renders the
  guarded screen, even briefly.
- Self-deactivation while viewing this screen (the flagged edge case) is
  handled generically, not with page-specific logic: a global
  `handleAuthError` wired into `QueryClient`'s `queryCache`/`mutationCache`
  (`src/api/handle-auth-error.ts`) clears the session and hard-redirects to
  `/login` on any 401 from a call that started with a session — covers this
  screen and every future authenticated page the same way, for free.
- Token/role dropdowns (both the "New user" form and the row-level control)
  render only `Object.values(Role)` — never free text, satisfying the "must
  match the four SRS roles" edge case by construction.
- `status-tentative`/`status-completed` tints → active/inactive is one
  reasonable reading of an ambiguous Tokens line (active = tentative's warm
  amber = "currently live"; inactive = completed's muted grey = "done").
  Flagged in code for easy correction if that's not the intended mapping.
- The contract mirror (`src/contract/index.ts`) now also duplicates
  aaradhya-api's `createUser`/`listUsers`/`updateUser` — same "local until
  @aaradhya/contracts is settled" caveat as STORY-004, growing.

---

## Module: Change History (SRS §5.7)

Built early because every write in every later module needs it. Placed here, not after Event Management, so it exists before the first Event write story.

### STORY-008: Change Log Entry schema + write helper
**Flow:** No direct user flow — this is the shared service every future PATCH endpoint calls: given `(entityType, entityId, field, oldValue, newValue, changedByUserId)`, it persists one Change Log Entry.
**Acceptance Criteria:**
- [ ] Schema stores `entityType`, `entityId`, `field`, `oldValue`, `newValue`, `changedBy`, `timestamp` (server-set, not client-supplied).
- [ ] The write helper is a single importable function; calling it twice with different `field` values for the same `entityId` produces two separate entries, not one overwritten entry.
- [ ] Calling the helper with `oldValue === newValue` still writes an entry (the helper doesn't decide whether a change is "real" — the caller does that before invoking it, so behavior stays predictable).
- [ ] Unit-tested directly, with no HTTP layer involved.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Very large `oldValue`/`newValue` (e.g. a whole embedded array like `client_contacts`) — decide and document whether the log stores the full before/after array or a diff; storing the full value is the simpler v1 choice, note it as such.

### STORY-009: GET /change-log
**Flow:** An Event Manager viewing an Event's Activity tab requests all Change Log Entries for that Event.
**Acceptance Criteria:**
- [ ] `GET /change-log?entityType=Event&entityId=:id` returns entries for that entity, EventManager-only (403 otherwise, per STORY-003).
- [ ] Entries are sorted newest-first.
- [ ] Empty result set returns `200` with an empty array, not a 404.
- [ ] Verified against fixture data seeded directly via STORY-008's helper — no dependency on any Event Management story existing yet.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Requesting logs for an `entityId` that was never logged (empty array, not an error); pagination is out of scope for v1 given the data scale, but note that as a deliberate choice if the list could ever grow large within one event's lifetime.

### STORY-010: Activity tab UI (reusable component)
**Flow:** An Event Manager opens an Event's Activity sub-tab and sees a chronological list of every field change on that Event.
**Acceptance Criteria:**
- [ ] Component takes an `entityType`/`entityId` prop, calls STORY-009, and renders `field`, `old → new`, `changedBy`, relative timestamp per row.
- [ ] Empty state renders a plain "No changes yet" message, not a blank panel.
- [ ] Component is tested standalone against fixture API responses (does not require a real Event to exist).
- [ ] Component is not visible to non-EventManager roles when embedded later (verified once embedded — flag as a re-check item on STORY-017).
**UI:** Activity list — one row per entry (field name, old→new values, actor, timestamp).
**Tokens:** `surface`, `line` (row dividers), `text`, `text-faint` (timestamps), `type-body-m`, `space-8`.
**Edge cases:** A change where `oldValue` is empty/null (new field being set for the first time — render as "— → value", not "null → value").
**Decisions (v1):**
- Lives in `src/components/ui/` (not `pages/`) — it's meant to be embedded into
  multiple future screens, not tied to one. Flat files (`activity-tab.tsx` +
  `.styles.ts`), matching `require-role.tsx`'s existing precedent for a
  single reusable component, not the `pages/user-management/`-style folder
  (that's for a group of page-specific sub-components).
- No role-gating inside the component itself — deliberately, per the AC:
  visibility is the embedding page's job, re-checked once STORY-017 actually
  embeds it (added as an explicit AC there).
- `changedBy` renders the raw User id from the API — STORY-008/009 kept it a
  plain string with no name resolution. Renders whatever it's given; a later
  story can resolve it to a display name once the API returns one.
- Non-primitive `oldValue`/`newValue` (e.g. `client_contacts`, an array)
  render via `JSON.stringify` — no diffing, matching STORY-008's own "full
  value, not a diff" choice carried through to display.
- Relative timestamps use the browser's native `Intl.RelativeTimeFormat` —
  no date library needed for this.

---

## Module: Event Management (SRS §5.1) — includes Client Contacts (§5.3)

### STORY-011: Event core schema
**Flow:** No user flow yet — defines the Event document: auto-generated `event_id` (`ARD-EVT-2026-001` format), `event_family_type`, `status`, `event_manager` (ref to a User Account with that role), `created_by`/`created_at`, and embedded `client_contacts[]` (each with `name`, `contactNumber`, `role` — Bride/Groom/POC/Custom).
**Acceptance Criteria:**
- [ ] `event_id` is generated server-side in the documented format and is unique; client-supplied `event_id` is ignored.
- [ ] `status` accepts only `Tentative | Confirmed | Completed | Cancelled`.
- [ ] `event_manager` must reference an existing User Account whose role is `EventManager`; referencing any other user's id is rejected.
- [ ] `client_contacts[]` accepts zero or more rows at the schema level (the "at least one" rule is enforced at the create-endpoint level in STORY-012, not the schema, so the schema stays reusable).
- [ ] Unit tests cover id-format generation, id uniqueness across repeated creation, and rejection of an invalid `event_manager` reference.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Two Events created in the same millisecond (id-generation must not collide under concurrent creation — test with parallel calls, not just sequential); `event_family_type` custom values (schema must accept a free-text value alongside the enum, per FR-EVT-1's "dropdown + custom").

### STORY-012: POST /events
**Flow:** An Event Manager creates a new Event, choosing family type, assigning an Event Manager, and entering at least one Client Contact (Bride, Groom, and/or POC).
**Acceptance Criteria:**
- [ ] EventManager-only (403 otherwise).
- [ ] Request with zero `client_contacts` rows (or all rows with an empty `name`) returns 400.
- [ ] Valid request creates the Event via STORY-011's schema, `status` defaults to `Tentative`, and returns the created document including its generated `event_id`.
- [ ] `created_by` is set from `req.user.id`, never from the request body.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** A `client_contacts` row with a name but no `contactNumber` (decide: allowed or required — document the choice); assigning `event_manager` to a user account that is `active: false`.

### STORY-013: GET /events, GET /events/:id
**Flow:** Any authenticated user retrieves the full Event list or a single Event by id (role-based field filtering is a separate later story — this one returns the full document to any authenticated caller, as the foundation those filters wrap).
**Acceptance Criteria:**
- [ ] `GET /events` returns all Events with core fields (no sessions/accommodation detail required yet if not built — extend as those stories land).
- [ ] `GET /events/:id` returns 404 for a non-existent id.
- [ ] Both require a valid token (401 with none) but impose no role restriction yet.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Malformed `:id` (not a valid ObjectId/format) returns 400, not a 500.

### STORY-014: PATCH /events/:id (core fields + Client Contacts)
**Flow:** An Event Manager edits an Event's family type, status, assigned manager, or adds/edits/removes Client Contact rows; each changed field is logged via STORY-008.
**Acceptance Criteria:**
- [ ] EventManager-only (403 otherwise).
- [ ] Changing `status` (including to `Cancelled` from any prior status) succeeds and is reflected on the next GET.
- [ ] Editing one field writes exactly one Change Log Entry with the correct `field`/`oldValue`/`newValue`, verifiable via STORY-009.
- [ ] Editing `client_contacts` (add a row, remove a row, edit a name) writes a Change Log Entry for that change.
- [ ] Removing the last remaining Client Contact row is rejected with 400 (an Event must always retain at least one contact, mirroring the create-time rule).
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** A PATCH that changes nothing (identical values submitted) — decide whether this still writes a Change Log Entry, and be consistent with STORY-008's documented behavior; concurrent edits to the same Event by two Event Managers (last-write-wins is acceptable for v1 — document it as a deliberate non-requirement, not a bug).

### STORY-015: Event Creation screen UI
**Flow:** An Event Manager taps "New Event," fills family type, assigns themself or another manager, adds Client Contact rows, and submits.
**Acceptance Criteria:**
- [ ] Family type is a dropdown with a "Custom…" option that reveals a free-text field.
- [ ] Client Contact rows default to Bride/Groom/POC with add/remove controls; submit is disabled until at least one row has a non-empty name.
- [ ] Successful submit (via STORY-012) navigates to the new Event's detail screen (STORY-017).
- [ ] A 400 from the server (e.g. zero valid contacts) surfaces as an inline form error, not a silent failure.
**UI:** Event Creation form — family type dropdown+custom, event manager picker, Client Contact row list with add/remove, submit button.
**Tokens:** `surface`, `line`, `text`, `accent` (submit button), `type-title-l`, `radius-sm`, `space-12`/`space-16`.
**Edge cases:** Removing a row that has unsaved text in it (must not silently keep it in the submitted payload); rapid add/remove clicking (row identity/order must stay correct).

**Decisions (v1):**
- **STORY-017 doesn't exist yet, so `/events/:id` gets a minimal `EventDetailPlaceholderPage`** — mirrors exactly what `DashboardPlaceholderPage` already did for STORY-004's login flow ("only needs a real navigation target to prove ... routes away"). This isn't STORY-017's work pulled forward; it's the same interim-stand-in pattern this codebase already established, needed so this story's own "navigates to the new Event's detail screen" AC is actually true rather than falling through to the `*` → `/login` catch-all.
- **Family type dropdown = Wedding/Corporate/Birthday/Other (SRS §5.1's fixed list) + a distinct "Custom…" entry** (not reusing "Other" as the trigger) — the story's own AC names "Custom…" explicitly. Selecting "Other" submits the literal string "Other"; only "Custom…" reveals the free-text field.
- **Only the "at least one named Client Contact row" gate disables submit**, exactly as the AC states — `eventFamilyType`/`eventManager` being effectively empty isn't separately blocked in the UI; either would simply 400 and surface via the same inline-error path AC bullet 4 already requires. No invented extra gate.
- **Event manager picker defaults to the caller's own account**, lists every *active* `EventManager` account (fetched via the already-mirrored `GET /users`, filtered client-side — no new endpoint). Filtering to `active` is a UI-only judgement call: the backend itself allows assigning an inactive manager (STORY-012), but that allowance exists for not breaking data that already points at one, not for steering a brand-new Event onto one.
- **The event manager Select uses RHF's `Controller`, not `register`** — its options load asynchronously (the `GET /users` response), and an uncontrolled `register`-bound select can't attach a default value to a `MenuItem` that doesn't exist in the DOM yet at mount. `Controller` keeps it bound live so the default (self) renders correctly once the account list arrives. The family-type select stays `register`-bound since its options are static and always present at mount — no such race there.
- **A Client Contact row with a blank name is silently dropped from the payload**, not sent as an empty row — the backend requires every submitted row to have a non-empty `name` (STORY-012), so a still-blank default row (e.g. an unused POC placeholder) would otherwise 400 the whole request for a row the caller never touched.
- Row add/remove is built on `useFieldArray`, keyed by its own generated `field.id` rather than array index — this is what keeps a removed row's text from leaking into another row's slot, and keeps order correct, under rapid add/remove (both edge cases the story calls out).

### STORY-016: Event List screen UI
**Flow:** Any user opens the Event list and sees every Event they're permitted to see (role filtering lands in the Role Dashboards module — this story shows the unfiltered list for EventManager, the only role built so far with a landing screen).
**Acceptance Criteria:**
- [ ] Renders `event_id`, family type, status (as a colored chip using status tokens), assigned manager, and the Bride/Groom names from `client_contacts`, from STORY-013's list endpoint.
- [ ] Status chip color maps 1:1 to the four status tokens — verified by asserting the rendered color/class per status value, not just that a chip exists.
- [ ] Empty list (no Events yet) renders a plain empty state, not a blank screen.
- [ ] Tapping a row navigates to that Event's detail screen (STORY-017).
**UI:** Event list — one row per Event (id, status chip, family type, manager, client names).
**Tokens:** `surface`, `line`, `status-tentative/confirmed/completed/cancelled` + tints, `text`, `text-faint`, `type-body-m`, `space-8`.
**Edge cases:** An Event with a very long custom family-type value (must truncate, not break the row layout).

**Decisions (v1):**
- **Assigned manager renders as the raw `eventManager` id**, not a resolved name — STORY-013's list endpoint returns only the id (no populate/join), and this repeats the exact call STORY-010's `ActivityTab` already made for `changedBy`: render whatever the API gives, don't add a name-resolution behavior the story didn't ask for. Resolving names would also need `GET /users`, which is EventManager-only on the backend — a real risk for a screen this story's own Flow says any role can reach.
- **The route (`/events`) itself is *not* wrapped in `RequireRole`**, unlike the Event Creation and User Management screens — `GET /events` (STORY-013) has no backend role restriction, and the Flow explicitly frames this as "any user ... sees every Event they're permitted to see," so the UI shouldn't impose a restriction the API doesn't have. The dashboard's new "Events" link is shown to every logged-in role for the same reason (the two existing dashboard links stay EventManager-only, since *those* screens really are EventManager-only).
- **Status chip color is applied via the Chip's `style` prop, not `sx`**, even though every other colored element in this codebase uses `sx`. `sx` generates an emotion class, and jsdom's `getComputedStyle` doesn't reliably resolve emotion-injected background-color rules in this test setup — confirmed by a genuinely failing assertion, not a guess. The color values still live centrally in `events-table.styles.ts` (`STATUS_CHIP_COLORS`, referencing the same tokens every other `styles.ts` file does) — only the application mechanism changed, specifically so this story's own AC ("verified by asserting the rendered color ... not just that a chip exists") is actually checkable.
- Bride/Groom names join as `"<Bride> & <Groom>"`; an Event with neither role present (e.g. Corporate, POC-only) renders `"—"`, matching the `ActivityTab` precedent for "nothing here yet."
- A row is the whole click target (`role="link"`, `tabIndex={0}`, `onClick`/`onKeyDown` for Enter/Space) rather than a separate link/button per row — simplest way to satisfy "tapping a row navigates," and matches the accessibility pattern react-guidelines.md already asks for (paired `onClick`/`onKeyDown`).

### STORY-017: Event Detail — Overview tab UI
**Flow:** A user opens a single Event and sees/edits its core fields and status on the Overview tab; the Activity sub-tab (STORY-010) is embedded here for the first time.
**Acceptance Criteria:**
- [ ] Header shows `event_id`, status chip, family type per STORY-013's GET.
- [ ] Status control lets an Event Manager move to any of the four statuses (not just the "next" one in sequence) and persists via STORY-014.
- [ ] Client Contact rows are editable in place and persist via STORY-014.
- [ ] Activity sub-tab (STORY-010) renders real log entries after an edit is made on this screen — confirms the two stories actually connect, not just pass their own isolated tests.
- [ ] Re-check item from STORY-010: the embedded Activity sub-tab is not visible/reachable for a non-EventManager session (STORY-010 built the component with no role-gating of its own, deliberately — this is the first and only place that matters until it's checked here).
- [ ] Screen is reachable by navigating from both STORY-016's list and (later) STORY-031's calendar chip.
**UI:** Event Detail shell (header + tab strip) with Overview tab content; Activity sub-tab embedded.
**Tokens:** `surface`, `text`, status tokens (header chip), `type-title-l` (event name/id), `type-label-s` (tab labels), `line` (tab underline), `radius-md`.
**Edge cases:** Navigating directly to an Event Detail URL for an id that doesn't exist (404 state, not a crash); switching status to `Cancelled` and back — must remain fully editable, no lock-out.

**Decisions (v1):**
- **STORY-010's flagged re-check is resolved by conditionally rendering the "Activity" tab itself** (`user?.role === Role.EventManager`), not by any change inside `ActivityTab`. `GET /change-log` is EventManager-only on the backend, so a non-EventManager session would only ever see a 403 there — hiding the tab is honest, not just decorative.
- **The route itself (`/events/:id`) is not `RequireRole`-gated**, same reasoning as STORY-016's list — `GET /events/:id` has no backend role restriction. Editing controls and the Activity tab are gated *inside* the page instead, matching what the underlying endpoints actually allow: `canEdit`/`canSeeActivity` both resolve to `user?.role === Role.EventManager`, since STORY-014's PATCH and STORY-009's `GET /change-log` are both EventManager-only.
- **A non-EventManager sees Client Contacts as plain read-only text**, not disabled form controls — showing an input a 403 would immediately reject felt more misleading than just not rendering it as editable in the first place. The Status control has no read-only equivalent at all for non-EventManager; the header's status chip already covers "seeing" the status.
- **Status changes persist immediately on selection** (no separate save step), matching `UsersTable`'s existing role/active-toggle pattern; **Client Contact edits persist via an explicit "Save contacts" button**, matching the create form's batch-then-submit shape — editing several rows and firing a PATCH per keystroke would be excessive.
- **`ClientContactRows` (STORY-015) was generalized and moved to `components/ui/`** on hitting a second real consumer — "extract once a pattern genuinely repeats." It's fully decoupled from react-hook-form now: it takes plain `rows`/`onRowChange`/`onAddRow`/`onRemoveRow` instead of `Control`/`register`, since generalizing over RHF's own generic field-array typing would have needed an `as` cast to satisfy `Path<T>`/`FieldArrayPath<T>` — banned by typescript-rules rule 1. Each caller keeps its own `useFieldArray` call (still fully, concretely typed) and just hands the resulting `fields` + callbacks down.
- **`StatusChip` (the color-per-status Chip) was similarly hoisted to `components/ui/`** for the same reason — the Event list and the Event Detail header both needed the exact same status-color mapping.
- **`getEvent`'s query sets `retry: false`** — TanStack Query's default retries every failed query up to 3 times; a 404 for a fixed id is permanent, not transient, so retrying just delays the "not found" state for no benefit. Found this via a test that hung past its timeout, not by inspection.
- **The Activity tab's freshness after an edit relies on it unmounting/remounting on tab switch** (only the active tab's panel is rendered) rather than any explicit cache invalidation — TanStack Query's default `staleTime: 0` already refetches on every mount, which this app already implicitly relies on everywhere else; no new mechanism was added.
- The 404 state includes a "Back to Events" link — a one-line addition so the story's own required dead-end state isn't actually a dead end.

### STORY-018: Accommodation schema + computation functions
**Flow:** No user flow yet — extends the Event schema with one Accommodation Block (`check_in`, `check_out`, `room_lines[]` of `room_type`/`occupancy`/`tariff`/`no_of_rooms`), and defines the pure functions that compute `total_days`, each room line's `total_incl_gst`, `total_occupancy`, and `total_charges`.
**Acceptance Criteria:**
- [ ] Given fixed `check_in`/`check_out`, `total_days` computation is unit-tested against exact expected values (including a same-day case = 1 day, not 0).
- [ ] Given a fixed set of room lines, `total_occupancy` and `total_charges` sum correctly, tested with 0, 1, and multiple room lines.
- [ ] Per-line `total_incl_gst` applies the org GST rate correctly against `tariff × no_of_rooms`, tested with a known rate and known inputs.
- [ ] Functions are pure (no DB access), independently unit-tested with no HTTP layer.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** `check_out` equal to `check_in` (must not produce a negative or zero day count that breaks downstream cost math); a room line with `no_of_rooms = 0` (decide: allowed as a placeholder row, or rejected — document the choice).

### STORY-019: PATCH /events/:id/accommodation
**Flow:** An Event Manager edits the Accommodation Block; the server persists the input fields and recomputes every derived field via STORY-018, discarding any derived value the client tried to submit.
**Acceptance Criteria:**
- [ ] EventManager-only (403 otherwise).
- [ ] Submitting a `total_charges` (or any other derived field) in the request body has no effect — the response always reflects the server-computed value.
- [ ] Adding/removing/editing a room line writes a Change Log Entry per changed field via STORY-008.
- [ ] Response includes all derived fields freshly computed, not stale values from before the edit.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Submitting `room_lines` as an empty array (Accommodation with zero rooms — allowed, since not every Event needs guest rooms; totals should compute to zero, not error).

### STORY-020: Accommodation (Rooms) tab UI
**Flow:** An Event Manager opens the Rooms tab, edits check-in/out and room lines, and sees every derived total update live from the server response — no client-side math.
**Acceptance Criteria:**
- [ ] Room line rows are editable (room type, occupancy, tariff, count); totals shown are exactly what STORY-019's response returned, never independently calculated in the UI.
- [ ] `total_days`, `total_occupancy`, `total_charges`, and each line's `total_incl_gst` render as read-only, non-editable fields.
- [ ] Adding a room line and saving reflects the new row and updated totals without a full page reload.
**UI:** Rooms tab — check-in/out fields, room-line table (editable inputs + read-only computed columns), footer totals.
**Tokens:** `surface-2` (footer totals band), `text`, `type-body-m`, `type-label-s` (column headers), tabular-nums for all numeric columns, `space-12`.
**Edge cases:** Editing a field, then navigating away before saving (must prompt or discard cleanly, not leave the record in an inconsistent local state).

**Decisions (v1):**
- **A real backend gap surfaced while building this**: `GET /events/:id` never returned `accommodation`, and no story had added a dedicated GET for it (STORY-019 only added the PATCH). Fixed on the aaradhya-api side (its own STORY-020 Decisions entry) by adding `accommodation` to the already-public `eventResultSchema`/`toPublicEvent()` — purely additive, verified against the full existing backend suite before this frontend work continued.
- **"Discard cleanly" (the AC's own sanctioned alternative to prompting) is satisfied by the existing tab-unmount mechanism**, not a new one — switching away from the Rooms tab (or navigating off the page entirely) unmounts the form, which naturally discards any unsaved local edits since nothing is persisted until "Save accommodation" is clicked. No `useBlocker`/confirmation dialog was added; nothing is ever partially written, so there's no "inconsistent local state" to actually guard against.
- **Read-only computed values (`total_incl_gst` per row, the footer totals) are driven by local `savedAccommodation` state, updated directly from the mutation's own response** — not solely by waiting for the parent's `eventQuery.refetch()` to resolve. This makes totals refresh the instant a save succeeds, rather than after a second network round-trip, while `onEventChanged()` still keeps the rest of the page in sync. Verified this split holds even mid-edit: changing `tariff` locally without saving leaves the displayed total and footer completely unchanged (a dedicated test for this).
- **Rooms is visible to every role, not just Event Manager** — unlike Activity. `GET /events/:id` has no role restriction, and SRS §3.4 explicitly lists "rooms booked" as something Reception sees; only the actual edit controls (`canEdit`) are Event-Manager-gated, mirroring Overview's existing status/Client-Contacts split exactly.
- **Check-in/check-out use a native `<input type="date">`, and the frontend never constructs a JS `Date` at all** — the input's own value is already `'YYYY-MM-DD'`, sent as a plain string; the backend's `z.coerce.date()` parses it. This sidesteps timezone-conversion ambiguity entirely on the frontend side, and is the first date-editing UI in this app.
- **`RoomLineRows` stays page-local** (`pages/event-detail/`), not generalized to `components/ui/` — unlike `ClientContactRows`, there's only one consumer so far; extracting now would be pre-abstracting ahead of an actual second use.
- Each room-line input gets an explicit `aria-label` (`"Tariff for room line 1"`, etc.) — the table's column headers alone don't give screen-reader users a per-field name, and it's what makes the fields reliably targetable in tests without relying on DOM position.

### STORY-021: Payment schema + balance computation
**Flow:** No user flow yet — extends Event with a Payment Record (`total_estimated_amount`, `advance_required`, `advance_paid`, `advance_paid_date`, `payment_mode`) and the pure `balance` function.
**Acceptance Criteria:**
- [ ] `balance = total_estimated_amount − advance_paid`, unit-tested against fixed inputs including `advance_paid = 0` and `advance_paid > total_estimated_amount` (a negative balance must be representable, not clamped or errored).
- [ ] Schema fields default to `0`/unset appropriately for a brand-new Event with no payment activity yet.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Negative `advance_paid` input (reject at the schema/endpoint level — money in can't be negative).

### STORY-022: PATCH /events/:id/payment
**Flow:** An Event Manager records/updates payment fields; `balance` is recomputed server-side on every write.
**Acceptance Criteria:**
- [ ] EventManager-only — verified this is enforced by role, distinctly from every other role getting 403 (not just "not logged in").
- [ ] Submitting a `balance` value in the request body is ignored; response always reflects server computation.
- [ ] Each changed field writes a Change Log Entry via STORY-008.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Setting `advance_paid_date` without `advance_paid` being set yet (decide and document whether this is allowed).

### STORY-023: Payments tab UI (Event Manager only)
**Flow:** An Event Manager opens the Payments tab (invisible to every other role) and records/edits payment fields, seeing the computed balance update.
**Acceptance Criteria:**
- [ ] Tab is not rendered in the DOM at all for a non-EventManager session (not just visually hidden — verify via DOM query, since a hidden-but-present field is a real data leak here).
- [ ] Balance field is read-only and always matches STORY-022's response.
- [ ] Saving a field change reflects immediately without a full reload.
**UI:** Payments tab — total estimated amount, advance fields, payment mode, read-only balance.
**Tokens:** `surface-2`, `accent-deep` (balance emphasis when negative/outstanding), `type-title-m`, tabular-nums, `space-12`.
**Edge cases:** A very large amount value (formatting must not overflow the card on a narrow viewport).

**Decisions (v1):**
- **A real backend gap surfaced again, same as STORY-020**: `GET /events/:id` never returned `payment`, and no story had added a dedicated GET for it (STORY-022 only added the PATCH). Fixed on the aaradhya-api side (its own STORY-023 Decisions entry) by adding `payment` to the already-public `eventResultSchema`/`toPublicEvent()` — purely additive, verified against the full existing backend suite. That fix also surfaces (not resolves) a real spec gap: the SRS states Payment is "Event Manager only" visibility, but `GET /events/:id` still imposes no role restriction at all — this story's own UI hides the tab, but the raw API doesn't yet. That's Module 5.5 (Role-Based Dashboards & Views)'s job, explicitly deferred, not silently ignored.
- **The Payments tab has no `canEdit` prop, unlike Overview/Rooms** — there's no read-only fallback to build, because the *entire tab* is only ever mounted for an Event Manager (`EventDetailPage` doesn't render the `<Tab>` or the panel at all for anyone else). This is a materially different visibility model than Rooms (visible-to-all, edit-gated) or Overview (visible-to-all, edit-gated) — Payments matches Activity's stricter model instead, and for a genuinely different reason (Activity is gated because the backend endpoint itself is EventManager-only; Payments is gated because the SRS states outright that the *data* is Event-Manager-only visibility, independent of which endpoint serves it). Kept as its own named `canSeePayments` flag rather than reusing `canSeeActivity`, even though both currently evaluate identically — they're separate rules that happen to coincide today.
- **Balance is driven by local state updated directly from the mutation's own response**, the same pattern `RoomsTab` (STORY-020) already established — refreshes the instant a save succeeds, not only once the parent's `eventQuery.refetch()` resolves.
- **All five fields are resubmitted together on every save**, not diffed/tracked individually on the frontend — the backend's own PATCH already no-ops any field that didn't actually change (STORY-022), so there's no need to duplicate that tracking client-side; simpler to just always send current form state.
- **An empty date/payment-mode field sends `undefined` (no change), not a clear request** — same convention the Rooms tab's dates already use; STORY-022's PATCH has no clearing capability to call into.
- **The large-amount overflow edge case is handled with `overflowWrap: break-word` on the balance card**, not a truncation/ellipsis approach — a payment amount losing digits to an ellipsis would be actively misleading, unlike a long family-type string (STORY-016) where truncation is harmless.

### STORY-024: Documents Checklist schema + PATCH endpoint
**Flow:** An Event Manager toggles each of the six fixed Document Checklist items (Aadhar, PAN, Leaving/Birth Certificate, Ration Card, passport photos, Wedding Card) to Yes/No.
**Acceptance Criteria:**
- [ ] The set of checklist item keys is a server-defined constant; the endpoint rejects any key not in that fixed list (no ad hoc items via the API).
- [ ] Each item persists as a boolean; toggling one writes one Change Log Entry.
- [ ] EventManager-only (403 otherwise).
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** A new Event with no checklist state yet (all items should read as `false`/not-received by default, not error or return `null`).

### STORY-025: Documents Checklist tab UI
**Flow:** An Event Manager opens the Documents tab and checks off items as they're physically received.
**Acceptance Criteria:**
- [ ] Renders exactly the six fixed items, in a stable order, each as a Yes/No toggle bound to STORY-024.
- [ ] No "add item" control exists anywhere on this screen (matches the fixed-list, no-file-upload scope).
- [ ] Toggling an item persists immediately and survives a page reload.
**UI:** Documents tab — fixed checklist with toggles.
**Tokens:** `surface`, `line`, `accent` (checked state), `type-body-l`, `space-8`.
**Edge cases:** None beyond the fixed-list constraint already covered — flagged here explicitly because a screen this simple is where scope creep ("just let them add one more document type") is most tempting; don't.

**Decisions (v1):**
- **A real backend gap surfaced again, same as STORY-020/STORY-023**: `GET /events/:id` never returned `documentsChecklist`, and no story had added a dedicated GET for it (STORY-024 only added the PATCH). Fixed on the aaradhya-api side (its own STORY-024 Decisions entry) by adding `documentsChecklist` to the already-public `eventResultSchema`/`toPublicEvent()` — purely additive, verified against the full existing backend suite. Unlike `payment`, no SRS-level role-filtering gap is surfaced by this fix — the spec never states Documents Checklist visibility is restricted the way it explicitly does for the Payment Record.
- **The Documents tab has no `canEdit` prop, same reasoning as `PaymentsTab` (STORY-023)** — the entire tab is only ever mounted for an Event Manager, so there's no read-only fallback branch to build. Gated as EventManager-only because the SRS names Documents Checklist under the Event Manager's full-access scope (§3.1) but never once under F&B Head/Housekeeping/Reception's own "Sees:" lists (§3.2-3.4) — the same "not listed for any other role" pattern that made Payment Record's restriction explicit, even though the SRS phrasing here is less direct. Kept as its own named `canSeeDocuments` flag, not reused from `canSeePayments`, matching how `canSeePayments`/`canSeeActivity` are already kept separate despite currently coinciding.
- **Each toggle persists on its own `onChange`, not batched behind a Save button** — unlike Rooms/Payments/Overview, this story's own AC says "toggling an item persists immediately," so there's no form/submit step to build; every `Switch` calls `updateDocumentsChecklist.useMutation` directly with just the one key that changed.
- **The switch's checked state is flipped optimistically in `onMutate`, with a snapshot restored in `onError`** — a plain "wait for the response, then flip" approach would make every toggle visibly lag by a full round trip, which reads as broken for a control this simple; the standard TanStack Query optimistic-update pattern (`onMutate` returns `{ previousChecklist }`, `onError` rolls back to it) keeps the toggle itself instant while still correcting the display if the request genuinely fails.
- **The six-key label map lives only in this file, keyed off the same `DOCUMENT_CHECKLIST_ITEM_KEYS` array both repos already mirror** — no story has asked for a shared `@aaradhya/contracts` package yet (see aaradhya-api's `directory-structure.md`), so this is the same "duplicate the shape by hand, one file mirrors the other" convention already used for every field in `src/contract/index.ts`.
- **MUI's default `Switch` (`color="primary"`)** already renders its checked state in `accent` — `theme.ts` maps `palette.primary.main` to `colorTokens.accent`, so no extra `sx` override was needed to hit this story's own accent token.

---

## Module: Session & Calendar Management (SRS §5.2)

### STORY-026: Session schema + derived-field functions
**Flow:** No user flow yet — extends Event with `sessions[]`: `session_type`, `venue`, `venue_cost`, `start_date`/`end_date`, `start_time`/`end_time`, `pax`, `session_status` (`Active`/`Cancelled`, default `Active`), and the `setup` sub-object. Also defines the pure `duration_days`/`is_multi_day` functions from the finalized multi-day amendment.
**Acceptance Criteria:**
- [ ] Schema rejects `end_date < start_date` at the validation level.
- [ ] `start_date === end_date` (single-day session) is valid and is the same code path as a multi-day range — no separate "single day mode" flag exists.
- [ ] `duration_days` and `is_multi_day` are unit-tested pure functions, covering a 1-day session (`is_multi_day = false`) and a 3-day session (`duration_days = 3`).
- [ ] `session_status` defaults to `Active` when not supplied.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** A session spanning a month boundary (e.g. `2026-09-29` to `2026-10-01`) — `duration_days` must compute correctly across the boundary using real date arithmetic, not string comparison.

### STORY-027: POST /events/:id/sessions
**Flow:** An Event Manager adds a Session to an Event, choosing type, venue (with cost auto-fill), date range, times, pax, and setup fields.
**Acceptance Criteria:**
- [ ] EventManager-only (403 otherwise).
- [ ] Valid payload creates a Session via STORY-026's schema, returned with its generated sub-id.
- [ ] `end_date < start_date` returns 400 with a clear message (re-confirms schema-level validation is actually reachable through the endpoint, not just in isolated unit tests).
- [ ] `venue_cost` submitted by the client is accepted as-is at creation (it's editable, auto-filled client-side from a venue→cost lookup — this endpoint doesn't own that lookup).
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Adding a Session to an Event that is `Cancelled` at the Event level (decide: blocked or allowed — document the choice, since it affects STORY-029's form).

### STORY-028: PATCH/DELETE /events/:id/sessions/:sid
**Flow:** An Event Manager edits a Session's fields (including its date range) or removes it entirely.
**Acceptance Criteria:**
- [ ] Editing `start_date`/`end_date` re-validates `end_date >= start_date` on every update, not just at creation.
- [ ] Each changed field writes a Change Log Entry scoped with the session's identity in the `field` name (e.g. `sessions[Wedding].end_date`) so the Activity tab can distinguish which session changed.
- [ ] Setting `session_status` to `Cancelled` succeeds independently of the parent Event's `status` (a Confirmed Event can have one Cancelled Session).
- [ ] DELETE removes the session from the array; a subsequent GET no longer includes it.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Deleting the only Session an Event has (allowed — an Event with zero Sessions is a valid, if incomplete, draft state; it simply won't appear on the calendar per STORY-034's exclusion rule).

### STORY-029: Session Creation/Edit form UI
**Flow:** An Event Manager adds or edits a Session: picks type and venue (cost auto-fills, editable), sets the date range and times, enters pax, and fills the setup fields — all on one mobile-first form.
**Acceptance Criteria:**
- [ ] Date range is presented as two explicit date fields (or a single range picker) — never a single date input; this is the story that most directly exercises the finalized multi-day model, so a reviewer must be able to see two dates on screen, not one.
- [ ] Venue selection auto-fills `venue_cost` from a lookup table; the field remains editable afterward.
- [ ] Setup section renders the seating dropdown, table/chair number inputs, five boolean toggles (stage/buffet/registration desk/VIP/bride-groom seating), and exactly one free-text notes field — no second free-text field anywhere on this screen.
- [ ] Submit calls STORY-027 (create) or STORY-028 (edit) depending on entry point; a 400 (bad date range) surfaces inline on the date fields specifically, not as a generic banner.
**UI:** Session form — type dropdown+custom, venue dropdown+custom with cost auto-fill, start/end date fields, start/end time fields, pax, setup section, notes field.
**Tokens:** `surface`, `line`, `text`, `accent-tint` (active toggle state), `type-title-m`, `type-label-s` (setup toggle labels), `radius-sm`, `space-12`.
**Edge cases:** Picking an end date before the currently-selected start date in the UI (must block or auto-correct before submit, not rely solely on the server 400); toggling a boolean off after turning it on (must actually persist `false`, not omit the field).

**Decisions (v1):**
- **A real backend gap surfaced again, same as STORY-020/STORY-023/STORY-025**: `GET /events/:id` never returned `sessions`, and no story had added a dedicated GET for it (STORY-027 added POST, STORY-028 added PATCH/DELETE). Fixed on the aaradhya-api side (its own STORY-028 Decisions entry) by adding `sessions` to the already-public `eventResultSchema`/`toPublicEvent()` — purely additive, verified against the full existing backend suite. No SRS-level role-filtering gap surfaced by this fix — Session data is visible to every role.
- **`session_type`/`venue` reuse `EventCreationForm`'s (STORY-015) "preset select + reveal a Custom… text field" pattern** — the SRS phrases both exactly like `event_family_type` ("dropdown + custom"), the same reasoning that made `event_family_type` free text rather than a closed enum. `setup.seating` is a real `TextField select` bound to the closed `SeatingArrangement` enum instead, matching its own closed-list SRS phrasing.
- **`venue_cost`'s lookup table is illustrative placeholder data** (`session-form-options.ts`) — the SRS names the venue presets but gives no actual pricing; the field stays fully editable regardless (this story's own AC), so a wrong placeholder is never a dead end. Same "placeholder until the business supplies real data" spirit as aaradhya-api's `config.gstRatePercent` default.
- **The Session form is a single reusable component (`session-form.tsx`) taking an optional `session` prop** — absent means create (calls `createSession`, STORY-027), present means edit (calls `updateSession`, STORY-028) and pre-fills every field, including reversing the dropdown+custom split (a stored value matching a preset re-selects that preset; anything else falls back to the Custom… option carrying the stored value). This is what makes "submit calls STORY-027 or STORY-028 depending on entry point" true without duplicating the form.
- **The date-order edge case is blocked entirely client-side** (a plain `'YYYY-MM-DD' < 'YYYY-MM-DD'` string comparison — lexicographic ordering matches chronological ordering for ISO dates, no `Date` construction needed) **before the mutation is ever called** — the same field-level `setError('endDate', ...)` call handles both this client-side block and a genuine server 400, so both paths render identically as inline `helperText` on the End date field, never a page-level `Alert`.
- **`required` was dropped from the date `TextField`s** — it's a purely visual asterisk cue (this app's forms all use `noValidate`, so it never blocks native submission) that also gets folded into the label's own text content, breaking exact-string `getByLabelText('Start date')` queries. Not worth keeping for a cosmetic-only prop nothing else in this codebase's forms uses either.
- **Each of the five setup toggles is its own `ToggleButton`, not a `Switch`/`Checkbox`** — this story's own Tokens line names `accent-tint` for "active toggle state," a tinted background rather than a saturated on/off track color, which reads naturally as a toggle-button selected state (`sx` background swap) rather than a `Switch`'s thumb/track coloring (`DocumentsTab`'s own STORY-025 pattern).
- **`sessions-tab.tsx` is genuinely new UI beyond this story's own literal AC** (which only specifies the form itself) — a minimal list-plus-Add/Edit-entry-points host was necessary for "submit calls create or edit depending on entry point" to have any real entry points to depend on; kept deliberately minimal (type/venue/dates/pax summary row, one Edit button) since a richer Sessions list is not this story's job. Visible-to-all/edit-gated, matching Rooms tab's own precedent — every role's own SRS "Sees:" list includes venue/pax/date(s), and Housekeeping's explicitly includes "seating/setup requirements."

### STORY-030: Menu Item master list schema + endpoints
**Flow:** No standalone user flow — this is the shared, org-wide list that STORY-033's item-adding flow searches and appends to. `GET /menu-items?search=` finds existing items; `POST /menu-items` adds a new one.
**Acceptance Criteria:**
- [ ] Schema: `name` (unique), `default_cost_per_plate`.
- [ ] `GET /menu-items?search=paneer` returns case-insensitive substring matches.
- [ ] `POST /menu-items` with a `name` that already exists (case-insensitive) returns 409 rather than creating a duplicate.
- [ ] Any authenticated user (not just EventManager) can search and add — the spec describes this as growing organically from any manager's entry, not gated by role.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Searching with an empty query string (return the full list or a 400 — pick one and document it, don't leave it undefined behavior).

### STORY-031: Item schema + total_cost computation
**Flow:** No user flow yet — extends Session with `items[]`, each either a Meal Item (`meal_name`, times, `pax`, `cost_per_plate`, `menu_items[]` refs, computed `total_cost`) or an Event Item (`event_name`, times, `venue`).
**Acceptance Criteria:**
- [ ] `total_cost = pax × cost_per_plate`, unit-tested as a pure function against fixed inputs.
- [ ] Schema enforces `type: "Meal" | "Event"` and requires the correct field set for whichever type is set (an Event Item must not require `cost_per_plate`, and vice versa).
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** `pax = 0` on a Meal Item (valid — `total_cost` computes to 0, e.g. a placeholder row being filled in); `cost_per_plate` as a decimal (must not round incorrectly in the multiplication).

### STORY-032: POST/PATCH/DELETE /events/:id/sessions/:sid/items
**Flow:** An Event Manager adds a Meal or Event Item to a Session, searching/adding Menu Items inline for Meal Items via STORY-030.
**Acceptance Criteria:**
- [ ] `total_cost` submitted by the client is ignored; response always reflects server-computed value from STORY-031.
- [ ] Adding a Menu Item that doesn't yet exist in the master list (by name) creates it via STORY-030's POST as part of this flow, then references it — verified by then finding it via `GET /menu-items?search=`.
- [ ] Editing `pax` or `cost_per_plate` on an existing item recomputes `total_cost` and writes a Change Log Entry for each changed field.
- [ ] DELETE removes the item; Session's item list no longer includes it on a subsequent GET.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Referencing a `menu_items[]` id that doesn't exist (400, not a silent no-op).

### STORY-033: Items UI within Session form
**Flow:** Within the Session form (STORY-029), an Event Manager adds Meal/Event item cards, searching the shared Menu Item list and adding new items inline when needed.
**Acceptance Criteria:**
- [ ] Meal Item card shows a searchable menu-item field (STORY-030); selecting an existing result attaches it, and submitting a not-found name offers "Add '<name>' as a new menu item" which calls STORY-032's create-and-attach flow.
- [ ] `total_cost` is displayed read-only and always matches the server response — never computed client-side and shown before save.
- [ ] Removing an item card removes it on save (via STORY-032's DELETE), not just from local view state.
**UI:** Item card list (Meal/Event toggle, fields per type, menu-item search+add-new for Meal Items).
**Tokens:** `accent-tint` (selected menu-item chip), `text-faint` (search placeholder), `type-body-m`, tabular-nums for cost fields, `space-8`.
**Edge cases:** Adding the same menu item twice to one Meal Item's `menu_items[]` (decide: de-dupe or allow — document the choice).

### STORY-034: GET /calendar (overlap query)
**Flow:** The calendar screen requests all Sessions active on any date within a given month; this is the endpoint that makes the finalized overlap rule real, not just documented.
**Acceptance Criteria:**
- [ ] `GET /calendar?month=9&year=2026` returns every Active session where `start_date <= monthEnd AND end_date >= monthStart` — verified with a fixture 3-day session (e.g. Sept 12–14) and a query for September, confirming it's returned even though the query itself never names the 13th specifically.
- [ ] A session spanning a month boundary (e.g. Sept 29–Oct 1) is returned by both the September and the October query.
- [ ] A `session_status: "Cancelled"` session is excluded even if its dates fall in range.
- [ ] A session missing `start_date` or `end_date` (an incomplete draft) is excluded.
- [ ] Each returned session includes enough of its parent Event's data (id, name/family type, status) for the calendar to render a chip without a second round-trip per session.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** A month query with zero matching sessions returns `200` with an empty array; two sessions of the same Event both active on the same day (both are returned raw — dedup for display is a client-side rendering concern, handled in STORY-035, not this endpoint).

### STORY-035: Calendar Month View UI
**Flow:** A user opens the calendar, sees the current month, and every Session's chip appears on every date it spans — including continuing visually across a week-row break — per the finalized overlap rule.
**Acceptance Criteria:**
- [ ] For a fixture 3-day session, a chip is visibly present on all three of its dates, including when that means two different calendar rows (week 1 showing days 1–2 of the span, week 2 showing day 3).
- [ ] Two sessions of the same Event active on the same day render as one chip for that Event on that day (dedup happens here, per STORY-034's note).
- [ ] Two different Events both active on the same day render as two separate stacked chips.
- [ ] Chip color matches the parent Event's status token.
- [ ] Tapping any chip is wired to navigate to that Event's detail screen (implementation may be a stub pointing at STORY-017's route if that story hasn't landed yet — confirm the route target once it has).
**UI:** Month calendar grid — day-of-week header, day cells with date numbers, event chip strip per day (supporting multi-day visual continuation).
**Tokens:** `surface`, `line`, `text-soft` (day numbers), `text-faint` (out-of-month days), status tokens (chip fills), `type-title-m` (month label), tabular-nums (day numbers).
**Edge cases:** A month with a session spanning in from the previous month and one spanning out to the next (both boundary directions in the same visible grid); five-week vs. six-week months (grid must not assume a fixed row count).

### STORY-036: GET /events/search (date range + filters)
**Flow:** A user searches/filters Events by a date range plus status, venue, event manager, or event type.
**Acceptance Criteria:**
- [ ] Date-range matching uses the same interval-overlap logic as STORY-034 (`sessions.start_date <= to AND sessions.end_date >= from`), not equality.
- [ ] Each additional filter (`status`, `venue`, `event_manager`, `event_type`) narrows results with AND semantics when combined.
- [ ] Omitting the date range entirely returns all Events matching the other filters (date range is optional, not required).
- [ ] Verified with a fixture session spanning a range that only partially overlaps the query range — it must still be returned (overlap, not containment).
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** A filter combination that matches zero Events (200, empty array); `event_type` filtering on a custom (non-enum) value entered at creation time.

### STORY-037: Calendar filter chips UI
**Flow:** On the calendar screen, a user taps a filter chip (All/Tentative/Confirmed/Venue/Event Manager/Event Type) to narrow what's shown, calling STORY-036.
**Acceptance Criteria:**
- [ ] Selecting a status filter re-renders the grid showing only chips matching that status; "All" clears all filters.
- [ ] Venue/Event Manager/Event Type filters open a selectable list sourced from actual existing values (not a hardcoded list), via STORY-036's endpoint or a lightweight distinct-values endpoint if one is needed — flag that dependency if it doesn't exist yet.
- [ ] Active filter chip is visually distinguished (not just color — also a checked/selected state, for accessibility) from inactive ones.
**UI:** Filter chip row above the calendar grid.
**Tokens:** `text`, `surface` (inactive chip), `text` fill / `surface` text (active chip, inverted), `type-label-s`, `radius-lg` (pill shape), `space-8`.
**Edge cases:** Combining two filters that together match nothing (grid renders genuinely empty, with a message, not a loading spinner stuck forever).

### STORY-038: Calendar-to-detail navigation
**Flow:** A user taps any calendar chip or an event row anywhere in the app and lands on that exact Event's detail screen.
**Acceptance Criteria:**
- [ ] Tapping a calendar chip (STORY-035) navigates to `/events/:id` and the correct Event renders.
- [ ] Tapping a row in the Event list (STORY-016) does the same.
- [ ] Browser/app back navigation from the detail screen returns to the calendar or list, whichever was the entry point, preserving any active filter state from STORY-037.
**UI:** None new — this story is the navigation wiring between existing screens.
**Tokens:** N/A (routing story, no new visual surface).
**Edge cases:** Deep-linking directly to `/events/:id` without having come from the calendar or list (must still work, per STORY-017's existing acceptance criteria — this story just confirms the two entry points funnel into the same place correctly).

---

## Module: Quotation Generation (SRS §5.4)

### STORY-039: Total Cost Summary computation function
**Flow:** No user flow yet — the pure function that turns an Event's sessions, items, accommodation, and extras into the rollup: venue total, food subtotal, food-with-GST, accommodation total, extras total, grand total.
**Acceptance Criteria:**
- [ ] Given a fixed fixture Event (2 sessions, known venue costs, known item costs, known GST%, known accommodation total, known extras), every output field matches an exact expected number.
- [ ] Function takes no DB dependency — pure input object in, totals object out — independently unit-testable.
- [ ] GST is applied only to the food subtotal, per the SRS's documented assumption (A9) — verified by a fixture where venue/accommodation/extras are non-zero and confirming GST doesn't touch them.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** An Event with zero sessions (all totals compute to 0, not `NaN` or an error); a GST rate of 0% (grand total should just equal the pre-GST food subtotal plus everything else, sanity-checking the formula isn't hardcoded to a nonzero rate).

### STORY-040: PATCH /events/:id/extras
**Flow:** An Event Manager enters the three optional simple line-item amounts — Decoration, Photographer, Bhatji — that feed into the Total Cost Summary.
**Acceptance Criteria:**
- [ ] Exactly three fields accepted (`decoration`, `photographer`, `bhatji`); any other key in the payload is ignored or rejected (pick one, document it).
- [ ] Each is a plain numeric amount, no computation applied to it.
- [ ] EventManager-only (403 otherwise); each changed field writes a Change Log Entry.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Negative amount input (reject — these are costs, not adjustments, in v1's model).

### STORY-041: GET /events/:id/quotation-summary
**Flow:** The Quotation Preview and Event Detail screens request the live rollup for one Event, combining STORY-039's function with that Event's actual session/accommodation/extras data.
**Acceptance Criteria:**
- [ ] Returns every field STORY-039 produces, computed from the Event's current live data (not cached from an earlier request).
- [ ] Changing any input (e.g. editing a session's `venue_cost` via STORY-028) and calling this endpoint again reflects the change immediately — confirms there is no separate stored "quotation" object per Assumption A2.
- [ ] Any authenticated role can call this (not EventManager-only — F&B/Housekeeping/Reception may need partial visibility into totals later, and restricting it here would block that without adding value now; document this as the deliberate choice).
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** Calling this before any Session or Accommodation data exists on a brand-new Event (all-zero summary, not an error).

### STORY-042: Total Cost Summary UI panel
**Flow:** An Event Manager (or anyone viewing the Overview tab) sees the live rollup, and edits the three extras fields inline.
**Acceptance Criteria:**
- [ ] Every line except Decoration/Photographer/Bhatji renders as read-only text — no input control exists for venue total, food subtotal, GST, or accommodation total anywhere on this panel.
- [ ] Editing an extras field calls STORY-040 and the Grand Total visibly updates on save, sourced from a fresh STORY-041 call (not recalculated client-side).
- [ ] Grand Total is visually the most prominent number on the panel (largest type / display font per the theme).
**UI:** Total Cost Summary panel — line items, three editable extras fields, emphasized grand total.
**Tokens:** `surface-2`, `type-display` (grand total, Fraunces), `type-body-m` (line items), `accent-deep` (grand total color), tabular-nums throughout, `space-12`.
**Edge cases:** A grand total large enough to need thousands-grouping (must render correctly, not just as a raw digit string).

### STORY-043: Quotation PDF generation endpoint
**Flow:** An Event Manager requests the client-facing PDF; the server renders the Aaradhya template (Client Details → Event Details per Session → Accommodation → F&B per Session → Total Cost Summary → static T&C/Documents/Bank footer) from the Event's current live data.
**Acceptance Criteria:**
- [ ] `GET /events/:id/quotation.pdf` returns `Content-Type: application/pdf` and a non-empty byte stream.
- [ ] PDF text content (verified via a PDF text-extraction step in the test) includes the Event's client names, at least one session's venue, and the computed grand total from STORY-039/041 — confirming the render actually pulls live data rather than a hardcoded template.
- [ ] Regenerating after an edit (e.g. changing `pax` on a session) produces a PDF with the updated numbers — no caching of a stale render.
- [ ] The static T&C/Documents/Bank footer text is present and identical across two different Events' PDFs (confirms it's the shared static block, not per-event content).
**UI:** None (backend only).
**Tokens:** N/A (backend only — the PDF has its own print-oriented styling, out of scope for the web theme tokens; flag as a follow-up whether the PDF should visually echo the theme, since the spec doesn't currently require it).
**Edge cases:** An Event with a Session that has zero Items (PDF must render that Session's section without a broken/empty table); very long custom venue or menu-item names (must wrap, not overflow the page).

### STORY-044: "Generate Quotation PDF" button
**Flow:** On the Event Detail screen, an Event Manager taps "Generate Quotation PDF," triggering STORY-043 and downloading/opening the result.
**Acceptance Criteria:**
- [ ] Button is visible only on the Event Manager's view of the Overview tab (matches STORY-052's later per-role tab gating — flag for re-check once that story lands).
- [ ] Tapping it calls STORY-043 and the resulting PDF opens or downloads without a full page navigation away from the Event.
- [ ] Button shows a loading state while the request is in flight and re-enables on completion or error.
- [ ] A failed generation (e.g. server error) surfaces an inline error, not a silent failure.
**UI:** Primary button on the Event Detail Overview tab.
**Tokens:** `accent` (button fill), `type-label-s` (button text), `radius-sm`, `space-16` (button padding).
**Edge cases:** Double-tapping the button while a generation is already in flight (must not fire two requests).

### STORY-045: Quotation Preview screen UI
**Flow:** Before generating the PDF, an Event Manager can open an in-app preview mirroring the same data — a mobile screen, not the PDF itself — to sanity-check the numbers.
**Acceptance Criteria:**
- [ ] Renders Client Details, per-Session details, Accommodation, and the Total Cost Summary (reusing STORY-042's panel) from STORY-041's live endpoint.
- [ ] Uses the display typeface prominently for the header, per the theme's rule that Fraunces appears only where the app is "speaking as Aaradhya" — this is one of those places.
- [ ] Every number on this screen matches the PDF's numbers exactly for the same Event at the same point in time (cross-check against STORY-043 in the same test run).
- [ ] A "Share PDF" action on this screen triggers the same flow as STORY-044.
**UI:** Quotation Preview screen — header (crest/wordmark, event name, dates), Client Details, per-session list, accommodation summary, Total Cost Summary panel, Share action.
**Tokens:** `type-display` (header), `surface`, `line`, `type-body-m`, tabular-nums, `accent-deep` (grand total).
**Edge cases:** An Event with no Accommodation entered at all (section should render as "None" or be omitted cleanly, not show a broken empty table).

---

## Module: Role-Based Dashboards & Views (SRS §5.5)

### STORY-046: Role-based field-filtering serializer
**Flow:** No new user-facing screen — wraps the existing `GET /events/:id` (STORY-013) so the fields returned depend on `req.user.role`, per the SRS §3 visibility table.
**Acceptance Criteria:**
- [ ] Calling the endpoint as `EventManager` returns every field (no regression from STORY-013's current behavior).
- [ ] Calling as `FnBHead` returns event name, date(s), POC name/contact, venue, pax, menu/meal timing/food instructions — and the response body genuinely omits `payment` and non-food `setup` fields (not just hides them client-side — verify by inspecting the raw JSON).
- [ ] Calling as `Housekeeping` omits `payment` and menu/item fields, includes setup/rooms.
- [ ] Calling as `Reception` omits `payment` and menu fields, includes client names, rooms, check-in/out.
- [ ] The same fixture Event, requested with four different role tokens in the same test run, produces four different (and independently asserted) response shapes.
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** A field that's borderline between two roles' allow-lists (e.g. `venue` — confirm it's genuinely visible to all four roles per the SRS table, not accidentally filtered for one).

### STORY-047: GET /dashboard (role-filtered aggregate)
**Flow:** Any user opens their dashboard; the endpoint returns counts (today's events, upcoming, tentative, confirmed) and an upcoming-events list, filtered to that role's permitted fields via STORY-046.
**Acceptance Criteria:**
- [ ] Counts are computed from real Event/Session data (today's events = at least one Active session overlapping today's date, per the same overlap logic as STORY-034), not a naive `status` count alone.
- [ ] The upcoming-events list applies STORY-046's field filtering per the caller's role.
- [ ] Called by four different role tokens against the same fixture data, each gets correctly scoped fields in the list portion; counts themselves are identical across roles (counts aren't sensitive data, only per-event field detail is).
**UI:** None (backend only).
**Tokens:** N/A (backend only).
**Edge cases:** "Today" boundary — an event whose session ends exactly at midnight (confirm which side of the boundary it falls on, and that this matches STORY-034's overlap semantics for consistency).

### STORY-048: Event Manager Dashboard UI
**Flow:** An Event Manager logs in and lands on their dashboard: aggregate counts plus the upcoming-events table.
**Acceptance Criteria:**
- [ ] Renders the four count tiles (today/upcoming/tentative/confirmed) from STORY-047.
- [ ] Renders the upcoming-events table with date, event, client, venue, pax, status — matching the SRS §6 mock layout.
- [ ] This is the screen a successful STORY-004 login now actually routes to (close the placeholder-routing gap from that earlier story).
**UI:** Event Manager Dashboard — count tiles row, upcoming-events table.
**Tokens:** `surface`, `accent-tint` (count tile emphasis), `type-display` or `type-title-l` (count numbers), status tokens (table status column), tabular-nums.
**Edge cases:** Zero upcoming events (table renders an empty state, tiles still render with `0`, not blank).

### STORY-049: F&B Head Dashboard UI
**Flow:** An F&B Head logs in and sees the same dashboard structure as STORY-048, restricted to their permitted fields.
**Acceptance Criteria:**
- [ ] Reuses STORY-048's layout component, fed by STORY-047 called with an F&B Head token.
- [ ] The rendered table has no payment column and no non-food setup column — verified by DOM inspection, not just "the design doesn't show it."
- [ ] Menu/meal-timing information is visible where the layout has room for it (may extend the table with an extra column vs. the Event Manager view, if that's how the F&B-specific detail is surfaced — decide and document).
**UI:** F&B Head Dashboard (shared layout, role-filtered data).
**Tokens:** Same as STORY-048.
**Edge cases:** An event with a Cancelled session that would otherwise have been an F&B Head's only reason to see that event (confirm it's excluded per STORY-034/047's Active-only rule, consistently).

### STORY-050: Housekeeping Head Dashboard UI
**Flow:** Same pattern as STORY-049, for the Housekeeping role.
**Acceptance Criteria:**
- [ ] Reuses STORY-048's layout, fed by STORY-047 with a Housekeeping token.
- [ ] No payment column, no menu column; setup/rooms detail visible.
**UI:** Housekeeping Dashboard (shared layout, role-filtered data).
**Tokens:** Same as STORY-048.
**Edge cases:** Same boundary/Cancelled-session case as STORY-049, re-verified for this role.

### STORY-051: Reception Desk Dashboard UI
**Flow:** Same pattern again, for Reception.
**Acceptance Criteria:**
- [ ] Reuses STORY-048's layout, fed by STORY-047 with a Reception token.
- [ ] No payment column, no menu column; Bride/Groom names, rooms, check-in/out visible.
**UI:** Reception Dashboard (shared layout, role-filtered data).
**Tokens:** Same as STORY-048.
**Edge cases:** Same as STORY-049/050.

### STORY-052: Event Detail tab-visibility gating by role
**Flow:** A non-Event-Manager role opens an Event Detail screen and sees only their relevant tab(s), pre-filtered; the Event Manager still sees all seven tabs built across this backlog (Overview, Client, Sessions & Menu, Setup, Rooms, Payments, Documents).
**Acceptance Criteria:**
- [ ] F&B Head sees only Overview (filtered) and Sessions & Menu; Payments and Setup tabs are absent from the DOM, not just unclickable.
- [ ] Housekeeping sees Overview (filtered), Setup, and Rooms; Payments and Sessions & Menu (the menu part specifically) are absent.
- [ ] Reception sees Overview (filtered), Client, and Rooms; Payments and Sessions & Menu are absent.
- [ ] Event Manager's view is unchanged by this story (regression check against STORY-017 and every tab story since).
- [ ] Every earlier "verify this once role gating lands" flag from STORY-010, STORY-023, and STORY-044 is re-checked here and confirmed correct.
**UI:** Tab strip visibility logic on the existing Event Detail shell — no new visual surface, but real behavioral change.
**Tokens:** N/A (reuses existing tab tokens from STORY-017).
**Edge cases:** A role navigating directly to a tab URL they shouldn't see (e.g. an F&B Head hitting `/events/:id/payments` directly) — must redirect or 403-render, not just hide the tab button while leaving the route open.
