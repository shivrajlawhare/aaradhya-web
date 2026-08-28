## Design Tokens — theme/ source of truth

The token table every story's **Tokens** line references, and what `src/theme/`
is built from. Values are the flat legend from
`docs/stories/Aaradhya_Story_Backlog.md` ("Design Token Legend") — this file
exists so `theme/` has one place to read them from without reaching into the
story backlog. If the two ever disagree, the story backlog is the source and
this file is stale — fix it here.

Fonts: **Fraunces** (600, wordmark/Quotation header only) and **Inter** (400/600,
everything else), loaded via Google Fonts in `index.html`.

### Color

| Token | Value | Role |
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

### Typography

| Token | Spec | Role |
|---|---|---|
| `type-display` | Fraunces 600 | Wordmark, Quotation header only |
| `type-title-l` | Inter 600, 22px | Screen titles |
| `type-title-m` | Inter 600, 17px | Section titles |
| `type-body-l` | Inter 400, 15px | Body copy |
| `type-body-m` | Inter 400, 13px | Body copy (secondary/dense) |
| `type-label-s` | Inter 600, 11px, uppercase, tracked | Eyebrows, tab labels |

### Spacing & shape

| Token | Value |
|---|---|
| `space-*` | 4 / 8 / 12 / 16 / 24 / 32 (px) |
| `radius-sm` / `-md` / `-lg` | 8 / 12 / 20 (px) |
