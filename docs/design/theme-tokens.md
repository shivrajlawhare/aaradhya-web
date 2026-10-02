## Design Tokens — theme/ source of truth

What `src/theme/` is built from. Since the UI redesign (CR-1, DEV-01) the
source is the Figma file's variable collections, published on the **📦 30
Handoff** page (boards 02–06). If a value changes, update Figma first, then
`src/theme/tokens.ts`, then this file.

- `src/theme/tokens.ts` — palettes (light + dark), scale, shadows, focus, motion,
  font stacks, and the compatibility names (`colorTokens`, `spaceTokens`,
  `radiusTokens`) older page styles import.
- `src/theme/typography.ts` — MUI typography variants.
- `src/theme/components.ts` — `theme.components` overrides.
- `src/theme/theme.ts` — `createTheme` with CSS variables and both colour schemes.

Fonts: **Bricolage Grotesque** (600/700/800 — display and headings), **Inter**
(400/600/700 — UI) and **Material Symbols Rounded** (icons, weight 500), loaded
via Google Fonts in `index.html`.

### Colour schemes

`createTheme({ cssVariables: { colorSchemeSelector: 'data-theme' }, colorSchemes: { light, dark } })`.
The mode is set with `useColorScheme().setMode()` and persisted in localStorage
under `aaradhya-theme` (default `light`). Styles read colours through the palette
CSS variables (`var(--mui-palette-…)`), so they follow the scheme.

| Palette key | Light | Dark | Role |
| --- | --- | --- | --- |
| `background.default` | `#FFF9EB` | `#200F07` | Page canvas |
| `background.paper` | `#FFFDF7` | `#2E1A10` | Cards, surfaces |
| `text.primary` / `.secondary` / `.disabled` | `#200F07` / `#5C4234` / `#9A8475` | `#FFF9EB` / `#D9CBBE` / `#9A8475` | Text |
| `divider` | `#EDE3D6` | `#432A1D` | Hairlines, input borders |
| `primary` | `#F77331` (light `#F88849`, dark `#E0591A`) | same | Primary action (label `#200F07`) |
| `error` | `#C93A46` (dark `#A52D38`) | same | Destructive |
| `brand.*` | subtle, raised, inverse, onInverse, accentSubtle, link, tertiary, borderStrong, borderHover, focus, tonal, onTonal, destructiveText | per scheme | Brand surfaces and states |
| `brand.focus` | `#E0591A` | `#F88849` | Focus border and ring. Light was `#F77331` (2.77:1 on paper); DEV-16 moved it to orange/600 (3.68:1) for the 3:1 non-text minimum. |
| `brand.borderHover` | `#9A8475` | `#9A8475` | Input hover border. Dark was `#7A6152` (2.88:1); DEV-16 raised it to 4.67:1. |
| `brand.tertiary` | `#7A6152` | `#9A8475` | Also every input placeholder (theme `MuiInputBase`), 5.64 / 4.67:1 — `text.disabled` (3.48:1 in light) is kept for disabled text only. |
| `status.{tentative,confirmed,completed,cancelled}.{fg,bg}` | | | Status chips |
| `nav.*` / `tab.*` | | | Sidebar and tab pill |
| `feedback.{success,error,warning,info}{Bg,Fg}` | | | Alerts and toasts |
| `skeleton.{base,highlight}`, `shadowHard`, `scrim` | | | Loading, hard shadows, dialog scrim |

Full values: `lightPalette` / `darkPalette` in `src/theme/tokens.ts`.

### Typography (MUI variants)

| Variant | Spec (desktop · below `md`) |
| --- | --- |
| `displayXl` | Bricolage 800 · 72/76 · 44/48 |
| `display` | Bricolage 800 · 56/60 · 36/40 |
| `h1` | Bricolage 700 · 40/48 · 28/34 |
| `titleL` (= `h2`) | Bricolage 700 · 28/36 · 22/28 |
| `titleM` (= `h3`) | Bricolage 600 · 22/28 · 18/24 |
| `titleS` | Inter 600 · 18/26 · 16/24 |
| `bodyL` / `bodyM` (= `body1`) / `bodyS` (= `body2`) | Inter 400 · 16/24 · 14/22 · 12/18 |
| `labelL` / `labelM` (= `button`) | Inter 600 · 15/20 · 13/18 |
| `labelS` | Inter 700 · 11/16 · +12% · uppercase |
| `numeric` | Inter 600 · 16/24 · tabular-nums |

### Scale

| Group | Values |
| --- | --- |
| Spacing | 0 · 2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 — `theme.spacing(n)` = n × 4px |
| Radius | xs 6 · sm 10 · md 14 (`shape.borderRadius`) · lg 20 (cards) · xl 28 (dialogs) · pill 999 |
| Stroke | hair 1 · default 1.5 · bold 2 |
| Controls | S 32 · M 40 · L 48 · touch min 44 |
| Shadows | soft sm/md/lg; hard sm `3px 3px 0` · md `6px 6px 0` in `shadowHard` |
| Motion | fast 120 ease-out · base 220 `(0.2,0,0,1)` · slow 320 `(0.4,0,0.2,1)` · spring 400 `(0.34,1.56,0.64,1)` · exit `(0.4,0,1,1)` · travel 8 px |

### Motion (Figma Motion Spec, page `1:10`; DEV-15)

- **Theme durations:** `enteringScreen` = slow 320, `leavingScreen` = base 220 — dialogs, drawers and bottom sheets enter at 320 and exit at 220.
- **Components:** Button / Icon Button hover and press at fast (press `scale(0.97)`); input focus border + glow, Chip, ToggleButton, Tab (active pill cross-fades) and Switch at base; Skeleton wave 1.6 s linear; spinner 720 ms; dialog paper scales 0.96 → 1 at slow (bottom sheet moves in from the bottom below `md`); toast enters with spring, exits 220 with `exit`; wizard connector fill scaleX at slow; route content fades in and rises 8 px at slow (`components/ui/page-transition.tsx`); stat count-up 600 ms.
- Everything animates **opacity and transform only** — no layout shift.
- **`prefers-reduced-motion`** (`theme/motion.ts`): `AppThemeProvider` swaps in `reducedMotionTheme` (every duration 0, `transitions.create` → `none`), the page transition and count-up are skipped, and a global `CssBaseline` rule zeroes CSS animations/transitions.

### Contrast (DEV-16, computed from the tokens)

Every text pair the app uses meets WCAG AA (4.5:1) in both schemes, and focus / input borders meet 3:1. Lowest pairs: light `brand.link` on `brand.accentSubtle` 4.88, light `error.contrastText` on `error.main` 5.03, dark `brand.tertiary` on paper 4.67, dark `nav.textMuted` 5.54. Text on `brand.tonal` uses `brand.onTonal` (9.73 / 11.12), not `brand.link` (4.27 in light). Known deviation: resting input / card borders use `divider`, a decorative hairline under 3:1 — fields are identified by their labels and fills.

> **Figma follow-up:** `brand.focus` (light) and `brand.borderHover` (dark) changed in code in DEV-16; update the Theme collection variables to match.

The Quotation and Banquet Event Order papers (`quotation-document.tsx`,
`banquet-event-order-document.tsx`) keep their own fixed colours
(`PAPER_COLORS`) and never read the palette, so they print identically in both
schemes.
