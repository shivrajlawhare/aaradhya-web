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
| Motion | fast 120 ease-out · base 220 `(0.2,0,0,1)` · slow 320 `(0.4,0,0.2,1)` · spring 400; all motion is off under `prefers-reduced-motion` |

The Quotation paper (`quotation-document.tsx`) keeps its own fixed colours and
never reads the palette, so it prints identically in both schemes.
