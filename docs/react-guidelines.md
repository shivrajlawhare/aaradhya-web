## React Guidelines

Ported from the Voyager rules export's "React Specific Guidelines" (`docs/coding-guidelines.md`, frontend file) and "React guidelines" (`docs/general-code-patterns.md`, frontend file) per `docs/Aaradhya_Dev_Process_and_Structure.md` §0. Apollo/GraphQL-bound bullets are struck and replaced with their ts-rest/TanStack Query equivalents; everything else is kept because it's genuinely React-generic.

### Data fetching (replaces the Apollo/GraphQL-codegen bullets)

- Use the typed hooks generated at the type level by `@ts-rest/react-query` against `@aaradhya/contracts` — never a hand-written `fetch`/`axios` call for anything the contract already covers.
- Prefer a direct `useQuery` with the `enabled` option over manually triggering a fetch — the ts-rest/TanStack Query equivalent of "use direct `Query` instead of `LazyQuery`."
- Import request/response types straight from `@aaradhya/contracts` — don't hand-declare a matching interface locally (the equivalent of "prefer generated Fragments over manually defining types," minus the GraphQL fragment machinery).
- TanStack Query owns cache invalidation and refetching; there's no `refetchAndAwaitQueries`-style helper to reach for — invalidate the relevant query key after a mutation instead.

### Everything else (kept, stack-generic)

- Avoid using `useEffect` where TanStack Query or React Hook Form already hold the state — derive values from state instead of re-syncing it into a `useEffect`.
- Avoid using `useEffect` to listen for `open`/`isOpen` and trigger a side effect. Do the work directly in the `setOpen`/`setIsOpen` call site instead.
- Keep pages lean; break large components into smaller, independently loadable chunks.
- Components are exported as `export default Component`; no return type annotation is needed on a component.
- The type for a component's props is defined in the same file, directly above the component.
- Use `const { showToast } = useToast()` to show toasts.
- Add an open check before rendering a modal rather than passing `open` as a prop and checking inside it — e.g. `{isModalOpen && <SessionModal event={event} />}`.
- Avoid using `?.` on an object you know exists.
- Prefer arrow functions — `const exampleFunc = () => {}` — over `function exampleFunc() {}`, for consistency.
- Define components as arrow functions: `const Component = ({ prop1, prop2 }: ComponentProps) => {`.
- Use descriptive variable/function names; event handlers get a `handle` prefix (`handleClick`, `handleKeyDown`).
- Implement responsive design with MUI (current major — see `docs/Aaradhya_Tech_Architecture.md` for the pinned version).
- Use React Hook Form for form state. Use Zod for validation — and where a form maps directly to a contract's input, reuse that schema from `@aaradhya/contracts` via `@hookform/resolvers` rather than redefining it.
- Use `const` bindings over function declarations, e.g. `const toggle = () => {}`; define a type for it where useful.
- Implement accessibility attributes on interactive elements (`tabIndex="0"`, `aria-label`, `onClick`/`onKeyDown` pairs, etc.).
- Common UI elements (buttons, inputs, etc.) live in `src/components/ui` — check there before building a new one. (Voyager's cross-app `@allmysons/shared-ui` package doesn't apply; there's one app, so one local `components/ui`.)
- Use `React.lazy` for components that don't need to load on first paint — don't overuse it.
- Avoid `any` or `as` type assertions unless absolutely necessary.
