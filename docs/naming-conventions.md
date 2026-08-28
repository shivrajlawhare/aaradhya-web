## Naming Conventions

Carried over from the Voyager rules export (`docs/naming-conventions.md`) per `docs/Aaradhya_Dev_Process_and_Structure.md` §0 — the `Queries`/`Mutations` field-naming lines were GraphQL-schema-specific and are struck; everything else is stack-agnostic and kept as-is.

- `Boolean`: Start with `is`, `can`, `are` (e.g., `isActive`).
- `Date`: End with `At` (e.g., `createdAt`).
- `Array`: Use plural form (e.g., `invoices`).
- `Object`: Use plural or `Map` suffix (e.g., `invoiceMap`).
- `File Names`: Use lowercase with dashes (e.g., `jobs.ts` or `jobs-utils.ts`).
- `Directories`: Use lowercase with dashes (e.g., `user-documents`).
- `Enums`: Use TitleCase (e.g., `EventStatus`).

### REST-specific naming (new — replaces the struck GraphQL rules)

- **Routes** (as called from this app): plural nouns, kebab-case path segments — `GET /events`, `GET /events/:id`, `POST /events/:id/sessions`.
- **`@ts-rest/react-query` hook usage**: hooks are named after the contract's verb+noun key (`useCreateEvent`, `useListEvents`) — don't rename them locally.
- Full route-naming/response-shape/error-format/pagination convention lives in `aaradhya-api`'s `docs/api-conventions.md` (currently a stub) — this app consumes whatever that settles on.
