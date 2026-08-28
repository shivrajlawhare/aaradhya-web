## Directory Structure — aaradhya-web

Written fresh for Aaradhya per `docs/Aaradhya_Dev_Process_and_Structure.md` §0 — Voyager's micro-frontend/module-federation layout (`apps/*`, webpack module-federation config, per-app `bootstrap.tsx`, a Zustand cross-app store in `packages/store`) doesn't apply. Aaradhya's frontend is one React app, not a shell-plus-micro-frontends setup. The one principle that did carry over: this repo doesn't reach into `aaradhya-api`'s files by path, and vice versa.

**Note:** per `docs/Aaradhya_Tech_Architecture.md` §3, the originally-planned `src/generated/` folder ("output of the REST codegen step") is superseded — Aaradhya's chosen approach (ts-rest) has no codegen step at all, so there's no `generated/` folder; typed API hooks come from `src/api/client.ts` built directly against the `@aaradhya/contracts` package. See `aaradhya-api`'s `docs/directory-structure.md` for the open question of where that shared contracts package actually lives, given `aaradhya-api` and `aaradhya-web` are two separate repos rather than the single npm-workspaces monorepo the planning docs assumed.

```
aaradhya-web/
├── .claude/
│   ├── CLAUDE.md                 # root rules for this repo — always loaded
│   └── skills/
│       └── review-standards/
│           └── SKILL.md
├── docs/
│   ├── spec/                     # Aaradhya_SRS_v1.1.md, Spec_Amendment_MultiDate_Sessions.md
│   ├── stories/                  # Aaradhya_Story_Backlog.md (STORY-001-052)
│   ├── design/
│   │   └── theme-tokens.md       # token table from the UI Concept mockup
│   ├── coding-guidelines.md
│   ├── typescript-rules.md
│   ├── naming-conventions.md
│   ├── git-guidelines.md
│   ├── directory-structure.md    # this file
│   ├── react-guidelines.md
│   └── style-guide.md
├── package.json
├── tsconfig.json
├── src/
│   ├── api/
│   │   ├── client.ts              # @ts-rest/react-query client built from the contract
│   │   └── handle-auth-error.ts   # QueryClient-wide 401 handler — forces logout+redirect
│   ├── contract/                  # local, hand-kept mirror of aaradhya-api's contract until @aaradhya/contracts is settled — only routes this app calls
│   ├── components/
│   │   └── ui/                    # shared/common components — check here before building a new one
│   ├── pages/                     # one folder per screen from the story backlog
│   ├── theme/                     # MUI theme built from docs/design/theme-tokens.md
│   ├── stores/
│   ├── routes.ts                  # route path constants, so App.tsx and navigate() calls can't drift
│   ├── App.tsx (app.tsx)          # kebab-case on disk per naming-conventions.md; PascalCase component name
│   └── main.tsx                    # Vite entry — providers (QueryClient, ts-rest, theme, auth, router) + <App />
└── tests/                          # mirrors src/ — Vitest + @testing-library/react
```

Notes on this layout vs. Voyager's:

- No `config/` (webpack module-federation), no `bootstrap.tsx`/`index.ts` split, no per-app `packages/shared-ui` import — this is a single Vite app, not a shell-loaded micro-frontend.
- `stores/` still exists but there's no cross-app shared store package to reach into (Voyager's `packages/store`); if Aaradhya ever needs global client state beyond TanStack Query's server-state cache, it's local to this app.
