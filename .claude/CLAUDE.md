# Aaradhya Web — Rules

Read before any change:
@docs/coding-guidelines.md
@docs/typescript-rules.md
@docs/naming-conventions.md
@docs/git-guidelines.md
@docs/directory-structure.md
@docs/react-guidelines.md
@docs/style-guide.md
@docs/design/theme-tokens.md

## Spec is the source of truth
- Full spec: docs/spec/Aaradhya_SRS_v1.1.md (+ docs/spec/Spec_Amendment_MultiDate_Sessions.md)
- Work is sliced into stories: docs/stories/Aaradhya_Story_Backlog.md
- Never implement beyond what the current story's Acceptance Criteria asks for.
  If the spec and the story conflict, or the story is ambiguous, stop and ask -
  don't guess and don't silently expand scope.

## Every change is scoped to one story
- State the STORY-ID you're implementing at the start of the session.
- Commits reference it - see docs/git-guidelines.md for the exact format.

## Before building a component
Check src/components/ui/ first - do not build a new common control that
already exists there.

## Data fetching
Use the @ts-rest/react-query hooks built against @aaradhya/contracts in
src/api/client.ts - never a hand-written fetch call for anything the
contract already covers. See docs/react-guidelines.md.

## Styling
One .ts style file per component, exported consts, MUI utilities over
inline styles - see docs/style-guide.md. Colors/type/spacing come from
theme/ (built from docs/design/theme-tokens.md), never hardcoded hex or
px values in a component.

## Stack
TypeScript, React 19, MUI, Vite, @ts-rest/react-query + TanStack Query,
React Hook Form + Zod. No GraphQL, no Apollo Client, no module federation
- that's Voyager's stack, not this one. Full rationale and pinned
versions: docs/Aaradhya_Tech_Architecture.md.

## Before committing
Run the review-standards skill against the diff (see
.claude/skills/review-standards/SKILL.md) - catches naming, layering, and
smell issues against the docs above before they reach review.
