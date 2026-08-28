# aaradhya-web

React frontend for the Aaradhya Event Management System — TypeScript, React 19,
MUI, ts-rest/react-query, Vite. See `docs/Aaradhya_Tech_Architecture.md` for the
full rationale and `.claude/CLAUDE.md` for the working rules.

## Requirements

- Node 24 LTS (`.nvmrc` pins it)
- `aaradhya-api` running (default `http://localhost:4000`) for anything that
  calls the backend

## Setup

```
nvm use          # Node 24
npm install
cp .env.example .env   # then set VITE_API_BASE_URL if not the default
npm run dev
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | `tsc -p tsconfig.json --noEmit` |
| `npm test` | Vitest + @testing-library/react (jsdom) |

## Layout

`src/` follows `docs/directory-structure.md`: `api/client.ts` (typed
ts-rest/react-query hooks), `contract/` (see below), `theme/` (MUI theme built
from `docs/design/theme-tokens.md`), `pages/` (one folder per screen),
`components/ui/` (shared controls — check here before building a new one),
`stores/` (client state beyond TanStack Query's server cache). `tests/` mirrors
`src/`.

## Setup decisions

- **`src/contract/` is a temporary, hand-kept duplicate of aaradhya-api's
  contract**, not an import of a shared `@aaradhya/contracts` package —
  aaradhya-api and aaradhya-web are separate repos and that package's home is
  still an open item in aaradhya-api's `docs/directory-structure.md`. Only the
  routes this app actually calls are mirrored (currently: `POST /auth/login`).
  Keep it in sync by hand with `aaradhya-api/src/contract/` until the shared
  package question is settled — this is exactly the drift risk ts-rest was
  chosen to avoid, so don't let it grow past what's actually consumed.
- **Zod pinned to v3**, matching aaradhya-api — `@ts-rest/core@3.52.1`'s peer
  is `zod@^3.22.3`.
- **`@ts-rest/react-query/v5`** (the TanStack Query v5 entry point, via
  `initTsrReactQuery`), not the classic `initQueryClient` API — this repo is
  on `@tanstack/react-query` v5. Its mutation hooks resolve `onSuccess` only
  for 2xx and route everything else (declared error responses or a network
  failure) to `onError`, which is what STORY-004's uniform-401 handling
  relies on.
- **`react-router-dom`** — not in the architecture doc's library table (a
  genuine gap, not a documented decision); added as the conventional router
  for a Vite + React SPA. Currently two routes: `/login` and `/dashboard`
  (placeholder). No route guard yet — visiting `/dashboard` unauthenticated
  just renders the placeholder without a user's name; add a guard when a
  story actually needs one.
- **Session storage**: `localStorage`, no refresh-token rotation — the SRS
  (FR-AUTH-4) calls session mechanics "standard and not further specified."
  `src/stores/auth-context.tsx` is a plain React Context, not a new state
  library — nothing beyond it is documented as the pick.
- **Typography variants** (`display`, `titleL`, `titleM`, `bodyL`, `bodyM`,
  `labelS`) are added to the MUI theme as real `Typography` variants in
  `src/theme/theme.ts`, matching the six `type-*` tokens the story backlog
  names on nearly every screen — write `variant="titleL"`, not a per-component
  `sx` override. `display`'s font size isn't specified in
  `docs/design/theme-tokens.md` yet; 28px is a placeholder.
- **Fonts** load via a Google Fonts `<link>` in `index.html` (Fraunces 600,
  Inter 400/600) — not self-hosted yet.
- **Component files are kebab-case** (`login-page.tsx`, not `LoginPage.tsx`) —
  `docs/naming-conventions.md`'s file-name rule is written with no stated
  exception for components, so it's followed literally here, even though
  PascalCase-matching-the-component is the more common React convention. The
  exported component itself stays PascalCase (`export default LoginPage`).
  Worth an explicit call in the doc if that's not actually the intent.
