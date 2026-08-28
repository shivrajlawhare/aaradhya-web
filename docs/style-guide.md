## Styling Rules

Carried over verbatim from the Voyager rules export — genuinely MUI-generic, no framework-specific change needed.

- Always use a `.ts` file for keeping styles.
- Export each style individually, e.g. `export const eventListStyles = ...`, instead of grouping everything at the bottom of the file.
- Leverage MUI's existing components rather than building equivalents from scratch.
- Avoid inline styles — create a `styles.ts` file per component and use that instead.
- Do not overuse custom CSS; MUI is built on CSS variables/the `sx` prop and theme, so most styling needs are met without it.
- Colors, typography, and spacing come from `theme/` (built from `docs/design/theme-tokens.md`) — never a hardcoded hex or px value in a component.
