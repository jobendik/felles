---
name: FELLES
description: Calm, precise booking app for a small office community. Custom component set on CSS custom properties; light mode only in v1. This file owns how FELLES looks; EXPERIENCE.md owns how it behaves.
status: final
created: 2026-10-19
updated: 2026-10-19
sources:
  - _bmad-output/planning-artifacts/prds/prd-felles-pilot-2026-10-18/prd.md
  - docs/requirements.md
colors:
  # Surfaces
  surface-base: '#F5F7FA'
  surface-raised: '#FFFFFF'
  surface-sunken: '#EDF0F4'
  surface-overlay: '#171B22'        # used at 48% alpha behind dialogs and sheets
  surface-today: '#FAFBFF'          # today's column wash in the week grid
  # Ink
  ink-primary: '#171B22'
  ink-secondary: '#596273'
  ink-muted: '#626D7F'
  ink-inverse: '#FFFFFF'
  # Lines
  border: '#DCE1E8'
  border-strong: '#7B8594'
  # Brand / action
  primary: '#2452D9'
  primary-hover: '#1E46BD'
  primary-active: '#1A3CA3'
  primary-subtle: '#E9EEFC'
  on-primary-subtle: '#1A3FA8'
  focus-ring: '#2452D9'
  # On dark (toast) surfaces
  success-on-dark: '#7EE2A8'
  danger-on-dark: '#FF9B93'
  link-on-dark: '#FFFFFF'
  focus-ring-on-dark: '#FFFFFF'
  # Status
  success: '#1D7A46'
  success-subtle: '#E2F4E8'
  on-success-subtle: '#135C34'
  warning: '#9A5600'
  warning-subtle: '#FFF0D4'
  on-warning-subtle: '#7A4300'
  danger: '#B3261E'
  danger-hover: '#981F18'
  danger-subtle: '#FCE8E6'
  on-danger-subtle: '#8C1D16'
  neutral-subtle: '#EDF0F4'
  on-neutral-subtle: '#4A5261'
  # Resource colour list (fixed, DEC-14). ink / tint pairs. Shown to users as Blå, Grønn, Lilla, Oransje, Rosa, Blågrønn, Gul, Grå.
  res-bla: '#1A3FA8'
  res-bla-tint: '#E3EAFB'
  res-gronn: '#1B6B3A'
  res-gronn-tint: '#DDF3E4'
  res-lilla: '#6B2FA0'
  res-lilla-tint: '#F0E6FA'
  res-oransje: '#A14A00'
  res-oransje-tint: '#FFE9D6'
  res-rosa: '#A6246B'
  res-rosa-tint: '#FBE3F0'
  res-teal: '#0F6B6B'
  res-teal-tint: '#DAF3F2'
  res-gul: '#7A5A00'
  res-gul-tint: '#FFF3C4'
  res-gra: '#4A5261'
  res-gra-tint: '#E8EBF0'
typography:
  display:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '34px'
    letterSpacing: '-0.02em'
  h1:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '32px'
    letterSpacing: '-0.01em'
  h1-mobile:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '28px'
    letterSpacing: '-0.01em'
  h2:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '26px'
  h3:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '24px'
  body:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '22px'
  body-strong:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 15px
    fontWeight: '500'
    lineHeight: '22px'
  body-sm:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '18px'
  label:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '16px'
  caption:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '16px'
  caption-strong:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '16px'
  tab-label:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '14px'
  numeral:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '22px'
  numeral-sm:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '20px'
  wordmark:
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '24px'
    letterSpacing: '0.08em'
rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  '10': 40px
  '12': 48px
  '16': 64px
  gutter-desktop: 32px
  gutter-mobile: 16px
  sidebar-width: 240px
  rail-width: 64px
  content-max: 1120px
  topbar-height: 56px
  tabbar-height: 64px
  sheet-width: 440px
  dialog-max-width: 440px
  control-height: 40px
  control-height-sm: 32px
components:
  # Tokenised components a theme resolver consumes. Components that appear only in the body
  # take every value from the body text; a missing entry here is a choice, not a gap.
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.ink-inverse}'
    hover: '{colors.primary-hover}'
    active: '{colors.primary-active}'
    radius: '{rounded.md}'
    height: '{spacing.control-height}'
    typography: '{typography.body-strong}'
  button-secondary:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-strong}'
    hover: '{colors.surface-sunken}'
    radius: '{rounded.md}'
    height: '{spacing.control-height}'
  button-ghost:
    background: 'transparent'
    foreground: '{colors.ink-secondary}'
    hover: '{colors.surface-sunken}'
    radius: '{rounded.md}'
  button-danger:
    background: '{colors.danger}'
    foreground: '{colors.ink-inverse}'
    hover: '{colors.danger-hover}'
    radius: '{rounded.md}'
  input:
    background: '{colors.surface-raised}'
    border: '{colors.border-strong}'
    border-focus: '{colors.primary}'
    border-error: '{colors.danger}'
    radius: '{rounded.md}'
    height: '{spacing.control-height}'
    typography: '{typography.body}'
    placeholder: '{colors.ink-muted}'
  date-field:
    background: '{colors.surface-raised}'
    border: '{colors.border-strong}'
    radius: '{rounded.md}'
    height: '{spacing.control-height}'
  switch:
    track-width: 40px
    track-height: 24px
    knob: 18px
    track-off: '{colors.border-strong}'
    track-on: '{colors.primary}'
  segmented:
    track: '{colors.surface-sunken}'
    selected-background: '{colors.surface-raised}'
    selected-border: '{colors.border-strong}'
    option-height: 28px
  card:
    background: '{colors.surface-raised}'
    border: '{colors.border}'
    radius: '{rounded.lg}'
    padding: '{spacing.5}'
    shadow: 'shadow-sm'
  badge-confirmed:
    background: '{colors.success-subtle}'
    foreground: '{colors.on-success-subtle}'
    radius: '{rounded.full}'
  badge-pending:
    background: '{colors.warning-subtle}'
    foreground: '{colors.on-warning-subtle}'
    radius: '{rounded.full}'
  badge-rejected:
    background: '{colors.danger-subtle}'
    foreground: '{colors.on-danger-subtle}'
    radius: '{rounded.full}'
  badge-cancelled:
    background: '{colors.neutral-subtle}'
    foreground: '{colors.on-neutral-subtle}'
    radius: '{rounded.full}'
  badge-expired:
    background: '{colors.surface-raised}'
    foreground: '{colors.on-warning-subtle}'
    border: '{colors.warning}'
    border-style: 'dashed'
    radius: '{rounded.full}'
  badge-approval:
    background: '{colors.primary-subtle}'
    foreground: '{colors.on-primary-subtle}'
    radius: '{rounded.full}'
  badge-archived:
    background: '{colors.neutral-subtle}'
    foreground: '{colors.on-neutral-subtle}'
    radius: '{rounded.full}'
  nav-item-active:
    background: '{colors.primary-subtle}'
    foreground: '{colors.on-primary-subtle}'
    indicator: '{colors.primary}'
    indicator-width: 3px
    font-weight-active: '600'
    radius: '{rounded.md}'
    height: '{spacing.control-height}'
  tab-active:
    foreground: '{colors.primary}'
    indicator: '{colors.primary}'
    indicator-height: 2px
    typography: '{typography.tab-label}'
  calendar:
    gutter-width: 56px
    hour-height: 48px
    half-hour-height: 24px
    today-wash: '{colors.surface-today}'
    now-line: '{colors.danger}'
  calendar-block-own-confirmed:
    background: '{colors.primary-subtle}'
    foreground: '{colors.on-primary-subtle}'
    edge: '{colors.primary}'
    outline: '{colors.primary}'          # 1px at 40% alpha; every block variant outlines in its edge colour
    radius: '{rounded.sm}'
  calendar-block-own-pending:
    background: '{colors.warning-subtle}'
    foreground: '{colors.on-warning-subtle}'
    edge: '{colors.warning}'
    edge-style: 'dashed'
    radius: '{rounded.sm}'
  calendar-block-other:
    background: '{colors.neutral-subtle}'
    foreground: '{colors.on-neutral-subtle}'
    edge: '{colors.border-strong}'
    radius: '{rounded.sm}'
  slot:
    background: '{colors.surface-raised}'
    border: '{colors.border-strong}'
    selected-background: '{colors.primary}'
    selected-foreground: '{colors.ink-inverse}'
    range-background: '{colors.primary-subtle}'
    range-border: '{colors.primary}'
    disabled-background: '{colors.surface-sunken}'
    disabled-foreground: '{colors.ink-muted}'
    radius: '{rounded.sm}'
    height: 36px
  sheet:
    background: '{colors.surface-raised}'
    width-desktop: '{spacing.sheet-width}'
    shadow: 'shadow-lg'
  dialog:
    background: '{colors.surface-raised}'
    radius: '{rounded.xl}'
    max-width: '{spacing.dialog-max-width}'
    shadow: 'shadow-lg'
  popover:
    background: '{colors.surface-raised}'
    border: '{colors.border}'
    radius: '{rounded.md}'
    shadow: 'shadow-md'
    max-width: 320px
  tooltip:
    background: '{colors.ink-primary}'
    foreground: '{colors.ink-inverse}'
    radius: '{rounded.sm}'
    typography: '{typography.body-sm}'
  toast:
    background: '{colors.ink-primary}'
    foreground: '{colors.ink-inverse}'
    link: '{colors.link-on-dark}'
    icon-success: '{colors.success-on-dark}'
    icon-error: '{colors.danger-on-dark}'
    radius: '{rounded.md}'
    shadow: 'shadow-lg'
  focus-ring:
    color: '{colors.focus-ring}'
    color-on-dark: '{colors.focus-ring-on-dark}'
    width: 2px
    offset: 2px
---

## Brand & Style

FELLES is the quiet infrastructure of a shared office: the place you go to get a room or a projector and know it is yours. The requirements spec (`docs/requirements.md` §5) asks for a visually finished, calm, modern web app that copies no particular commercial product and avoids a wall of tables; the pilot brief raises the bar to a polished commercial SaaS product, with clarity and efficiency valued above decoration.

The visual posture follows. One cool, light canvas; white cards with hairline borders; a single blue that means *action*; status told through a small, consistent badge vocabulary; and typographic hierarchy doing the work that colour and ornament would otherwise do. Nothing animates for its own sake. The product's personality is precision and ease, in the register of good Scandinavian public-service design rather than start-up exuberance.

The UI is in Norwegian bokmål. The visual system is language-neutral, but it is tuned for Norwegian strings, which run longer than English: labels never force uppercase, buttons never truncate, and the sidebar is wide enough for "Ressursadministrasjon".

Light mode only in v1. Tokens are named by role, not by value, so a dark set can be added later without renaming anything. Prose in both spines uses British spelling; token keys follow the DESIGN.md spec (`colors`).

Mocks live in `mockups/` (start at `mockups/index.html`); every surface is shown at 1440px and 375px. Mocks illustrate; this file and EXPERIENCE.md are the contract and win on any conflict.

## Colors

Every colour below was checked against WCAG 2.2 AA: text pairs at 4.5:1 or better, control boundaries at 3:1 or better. The recomputed ratios are in `review-accessibility.md` next to this file.

**Surfaces.** `surface-base` (`#F5F7FA`) is the app canvas: cool, almost white, so white cards still read as raised without shadows. `surface-raised` (`#FFFFFF`) is cards, sidebar, sheets, dialogs and inputs. `surface-sunken` (`#EDF0F4`) is table headers, hover fills, disabled slots and the segmented-control track. `surface-overlay` is `ink-primary` at 48% alpha behind any dialog or sheet. `surface-today` is the faint wash behind today's column in the week grid.

**Ink.** `ink-primary` (`#171B22`, 16:1 on the canvas) is body text and headings. `ink-secondary` (`#596273`, 5.7:1 on the canvas) is meta text, labels and secondary nav. `ink-muted` (`#626D7F`, 5.2:1 on white, 4.6:1 on `surface-sunken`) is placeholders, hour labels in the calendar gutter, struck-through taken slots and section eyebrows; it still passes AA as text because people read placeholders and hour labels. `ink-inverse` is text on primary, danger and toast backgrounds.

**Lines.** `border` (`#DCE1E8`) separates cards and rows; it is decorative, so it may sit below 3:1. `border-strong` (`#7B8594`, 3.7:1 on white) is the boundary of every input, checkbox, switch track, slot and secondary button, because WCAG 1.4.11 requires 3:1 for control boundaries.

**Primary.** One blue, `primary` (`#2452D9`, 6.4:1 with white text). It means "this is the action" and "this is where you are": primary buttons, the active nav item, links, selected slots, the current day in the calendar header, and the user's own confirmed calendar blocks. It is never used for status, decoration or large background washes. `primary-hover` and `primary-active` darken in two steps; `focus-ring` is the same hue so focus and action share one meaning.

**On dark.** The toast is the only dark surface. Text on it is `ink-inverse`; links are `link-on-dark` (white, underlined); icons are `success-on-dark` (11:1) and `danger-on-dark` (8.5:1); the focus ring is `focus-ring-on-dark`, because the blue ring would sit at 2.7:1 there.

**Status.** Four semantic families, each with a strong tone for text and icons on white and a `-subtle` tint with an `on-…-subtle` text for badges and alerts. The Norwegian labels are the canonical status vocabulary in EXPERIENCE.md → Voice and Tone.

| Family | Meaning in FELLES | Strong | Subtle / on-subtle |
|---|---|---|---|
| success | `confirmed` (Bekreftet) | `#1D7A46` | `#E2F4E8` / `#135C34` |
| warning | `pending` (Venter), expired request (Utløpt), approval counts | `#9A5600` | `#FFF0D4` / `#7A4300` |
| danger | `rejected` (Avslått), destructive actions, errors, the now-line | `#B3261E` | `#FCE8E6` / `#8C1D16` |
| neutral | `cancelled` (Avbestilt), archived, anonymous "Reservert" blocks, kind badges | `#4A5261` on `#EDF0F4` | same |

Colour is never the only carrier of status. Every badge pairs its tint with its label text and a leading dot or icon; the expired variant adds a dashed outline so it is distinguishable from Venter even in greyscale.

**Resource colours.** RES-02 gives each resource a symbol and a colour from a fixed list (DEC-14). The list is the eight `res-*` ink/tint pairs in the frontmatter, shown to users as Blå, Grønn, Lilla, Oransje, Rosa, Blågrønn, Gul and Grå; each ink is at 5:1 or better on its tint. They colour only the resource tile (icon in ink on tint), so resources are recognisable at a glance in lists, cards and the Booking sheet. They never colour calendar blocks, charts or status.

Avoid: gradients, coloured page backgrounds, a second brand hue, saturated red fills for whole cards, and any colour-only state.

## Typography

One family, **Inter**, self-hosted through npm so the app runs offline with no font request (architecture to confirm; see EXPERIENCE.md → Architecture handoff). The fallback stack is `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`, and every size is chosen to look right in either.

| Role | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 28 / 34 | 600 | Stat values on Hjem, the greeting on desktop |
| `h1` / `h1-mobile` | 24 / 32 · 22 / 28 | 600 | One page title per surface |
| `h2` | 18 / 26 | 600 | Section titles, sheet and dialog titles, the mobile top bar title |
| `h3` | 16 / 24 | 600 | Card titles, calendar title, empty-state heading |
| `body` / `body-strong` | 15 / 22 | 400 / 500 | Default UI text; strong for list titles, buttons, nav |
| `body-sm` | 13 / 18 | 400 | Meta text, hints, error text, counters |
| `label` | 13 / 16 | 500 | Form labels, table headers, chips, segmented controls |
| `caption` / `caption-strong` | 12 / 16 | 400 / 500 | Calendar block time, hour labels, section eyebrows; strong for badge text, slot times, block titles, avatar initials, the Demo pill |
| `tab-label` | 11 / 14 | 500 | Bottom tab bar labels only (paired with a 22px icon) |
| `numeral` / `numeral-sm` | 16 / 22 · 15 / 20 | 600 | Day numbers in the calendar header and the week strip |
| `wordmark` | 18 / 24 | 700, +0.08em | "FELLES" only |

Rules. Headings are sentence case; no all-caps anywhere except the tracked wordmark. Numbers that line up (times, counts, stat values) use tabular numerals (`font-variant-numeric: tabular-nums`), and time ranges use an en dash. Date and time formats are content rules and live in EXPERIENCE.md → Voice and Tone. Body text never drops below 13px; the only smaller roles are `caption`, `caption-strong` (12px) and `tab-label` (11px), and none of them carries a sentence. Every size used in Components is one of the roles in this table. Inputs render at 15px so iOS does not zoom on focus.

## Layout & Spacing

A 4px base scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Related elements sit 8–12px apart, fields 16px, cards 16–24px, sections 32px. Cards have 20px padding; sheets and dialogs 24px.

**Desktop (≥1024px, designed at 1440px).** Two-column shell: a fixed `sidebar-width` (240px) sidebar on `surface-raised` with a 1px right border, and a main column whose content is centred at `content-max` (1120px) with 32px gutters. At 1440px this leaves calm margins on both sides without stretching lists. Hjem and Ressursdetalj use a two-column grid (main 2fr, aside 1fr); the resource catalogue shows three cards per row; the Administrator stat row uses three equal columns.

**Between (768–1023px).** The sidebar collapses to a `rail-width` (64px) icon rail with tooltips; the resource grid drops to two columns; otherwise the desktop layout applies. This band is not a tested target (UI-2 names 375 and 1440) but must not break.

**Mobile (375px, applies below 768px).** Single column with 16px gutters. A `topbar-height` (56px) top bar holds the page title and the user avatar; a `tabbar-height` (64px) bottom tab bar holds five tabs. Page content has 16px padding and adds the tab bar height at the bottom so nothing hides behind it. Nothing scrolls horizontally: the week grid becomes a week strip plus a single-day timeline, tables become stacked cards, and action rows wrap.

**Control sizing (the one home for this rule).** Controls are 40px tall, which satisfies WCAG 2.5.8 target size with margin. The 32px small button variant is allowed only inside dense rows on desktop (≥1024px, pointer input). Below 1024px every control is 40px, including row actions, close buttons, the password toggle and colour swatches. Half-hour calendar cells are 24px tall, the 2.5.8 minimum, so no spacing is added between cells. Scroll padding for the sticky bars is a behaviour rule and lives in EXPERIENCE.md → Accessibility Floor.

## Elevation & Depth

Depth is mostly tonal. Cards sit on the canvas with a 1px `border` and the faintest `shadow-sm` (`0 1px 2px rgba(23,27,34,.06)`); hover on interactive cards lifts to `shadow-md` (`0 4px 12px rgba(23,27,34,.08)`) and darkens the border to `border-strong`. Only floating layers earn `shadow-lg` (`0 12px 32px rgba(23,27,34,.14)`): sheets, dialogs and toasts; popovers take `shadow-md`. Nothing else casts a shadow; hierarchy comes from layout and type, not from stacking.

Overlays behind sheets and dialogs are `surface-overlay` at 48%, enough to focus attention without hiding context.

## Shapes

Four working radii plus `full`. `rounded.sm` (6px) for slots, calendar blocks, segmented options and skeletons. `rounded.md` (8px) for buttons, inputs, nav items, popovers and toasts. `rounded.lg` (12px) for cards and the calendar container. `rounded.xl` (16px) for dialogs only, so the one surface that interrupts reads softer. `rounded.full` is for badges, chips, avatars and count pills.

The resource tile is 40px square at `rounded.md` (56px at `rounded.lg` on Ressursdetalj). Avatars are circles with initials; no photos in v1.

## Components

Visual specs, grouped by where they appear. Each entry runs anatomy and size → colour → type → states → mock pointer. Behaviour lives in EXPERIENCE.md → Component Patterns under the same names. Named overlays are capitalised (Booking sheet, Booking detail sheet, Resource form sheet, Mer sheet, Reason dialog, Confirm dialog); generic components are lowercase in running text.

### Shell and navigation

- **Sidebar** — `sidebar-width`, `surface-raised`, right `border`. Wordmark and Demo pill at the top; nav list; user block (avatar, name in `body-strong`, role in `caption`) pinned to the bottom; "Logg ut" as a ghost button on its own line beneath the user block (Norwegian names are too long for a button beside them). Nav item: 40px high, `rounded.md`, 20px icon and `body-strong` label in `ink-secondary`; hover `surface-sunken`; active `primary-subtle` fill with `on-primary-subtle` icon and text plus a 3px `primary` bar on the left edge and weight 600, so the current place is readable without colour. The Administrator section is preceded by a `caption` eyebrow "Administrasjon" in `ink-muted`. Count pill on Godkjenninger: `warning-subtle` / `on-warning-subtle`, 20px, `rounded.full`. → `mockups/key-dashboard.html`.
- **Icon rail** (768–1023px) — `rail-width`, same items as the sidebar reduced to 20px icons with tooltips; active item keeps the 3px bar and `primary-subtle` fill.
- **Top bar** (mobile) — `topbar-height`, `surface-raised`, bottom `border`; page title in `h2`, avatar at right.
- **Tab bar** (mobile) — `tabbar-height`, five equal tabs; 22px icon over a `tab-label`; active tab in `primary` with a 2px `primary` bar across the top of the tab and weight 600, others `ink-secondary`; count dot on "Mer" in `warning` with white text. "Mer" is a button that opens the Mer sheet; the other four are links.
- **Demo pill** — `caption-strong` in `on-neutral-subtle` on `neutral-subtle`, `rounded.full`, 2/8px padding, beside the wordmark.
- **Avatar** — 32px circle, `primary-subtle` with `on-primary-subtle` initials in `caption-strong`.

### Controls

- **Button** — 40px, `rounded.md`, 16px horizontal padding, `body-strong`, optional 18px leading icon. Primary: `primary` fill, white text. Secondary: white, `border-strong` border, `ink-primary` text. Ghost: transparent, `ink-secondary`. Danger: `danger` fill, white text; danger-outline for secondary destructive triggers. Disabled: 50% opacity, `not-allowed` cursor, never removed from layout. In flight: looks disabled but is implemented with `aria-disabled` so focus stays put; the label stays and a 16px spinner replaces the icon. Small variant 32px with `label` text, desktop dense rows only (see Layout & Spacing → Control sizing).
- **Input / Select / Textarea** — 40px (textarea at least 88px), white, 1px `border-strong`, `rounded.md`, 12px padding, `body` text, `ink-muted` placeholder. Label above in `label`; optional fields append "(valgfritt)" to the label. Hint below in `body-sm` `ink-secondary`. Focus: border turns `primary` and the focus ring hugs it. Error: 2px `danger` border and a `body-sm` `danger` message with a 16px alert icon beneath. Textareas with a limit show a `body-sm` counter ("17/200") right-aligned under the field.
- **Date field** (Booking sheet) — an input with an 18px calendar icon at the right. Native `<input type="date">` in v1 with `min` = today and `max` = today + 30 days (BOK-02); the browser's picker supplies keyboard and screen-reader access. A `body-sm` caption beneath repeats the chosen day in nb-NO words ("mandag 19. oktober", "i dag", "i morgen"). → `mockups/key-kalender.html` (Booking sheet).
- **Search field** — input with an 18px search icon inset left; placeholder "Søk etter rom eller utstyr".
- **Chip** (filter) — 32px, `rounded.full`, white with `border-strong`; pressed state `ink-primary` fill with white text.
- **Segmented control** — `surface-sunken` track, 3px padding, 28px options in `label`; selected option white with a 1px `border-strong` outline, weight 600 and `shadow-sm`, so the state does not rely on the faint fill alone.
- **Switch** — 40×24 track in `border-strong`, `primary` when on; 18px white knob.
- **Symbol picker / Colour picker** (Resource form sheet) — Symbol: a row of 40px `rounded.md` icon buttons with `border-strong` outline; the selected one gets a 2px `primary` outline and `primary-subtle` fill. Colour: eight 40px targets, each showing a 28px circle filled with the resource tint and a 10px ink dot in the centre; the selected one is ringed in `ink-primary` with a check mark in the dot. Options are named in Norwegian; see Resource symbols and colours below. → `mockups/key-ressursadministrasjon.html`.
- **Slot picker** (Booking sheet) — seven-column grid of 36px-high slots at `rounded.sm`; columns are at least 40px wide. Free: white with `border-strong`. Taken or past: `surface-sunken`, `ink-muted`, struck through. Selected start and end: `primary` fill, white text. Range between: `primary-subtle` with a 1px `primary` border and `on-primary-subtle` text. Every slot shows its start time in `caption-strong`. → `mockups/key-kalender.html` (Booking sheet).
- **Focus ring** — 2px solid `focus-ring`, 2px offset, on every focusable element via `:focus-visible`. Inputs use 0 offset so the ring hugs the border. On the primary button the offset leaves canvas visible between button and ring, which keeps the ring legible. On the toast the ring is `focus-ring-on-dark`.

### Data display

- **Badge** — 24px, `rounded.full`, 10px padding, `caption-strong` text, 8px leading dot in `currentColor`. Status variants: confirmed, pending, rejected, cancelled (tints in Colors) and expired (white, dashed `warning` outline, `on-warning-subtle` text). Non-status variants without the dot: approval ("Krever godkjenning", `primary-subtle`), kind ("Rom" / "Utstyr", `neutral-subtle`) and archived ("Arkivert", `neutral-subtle`, Administrator surfaces only).
- **Card** — white, 1px `border`, `rounded.lg`, 20px padding, `shadow-sm`. Interactive cards gain a pointer cursor and the hover lift. Card header: `h3` title left, action or badge right.
- **Stat tile** — card with `label` caption, `display` value, `body-sm` note; optional link in `primary`.
- **Resource tile** — 40px square, `rounded.md`, resource tint background, 20px Lucide icon in resource ink. Large variant 56px at `rounded.lg` with a 28px icon.
- **Resource card** — card: resource tile, name (`body-strong`), kind and location (`body-sm`), seats where present, then a badge row ("Krever godkjenning" when set). → `mockups/key-ressurser.html`.
- **List row** — 16px vertical padding, `border` top between rows, resource tile left, title (`body-strong`) and meta (`body-sm`), badge and actions right. On mobile the actions wrap to a second line, right-aligned. → `mockups/key-mine-bookinger.html`, `mockups/key-godkjenninger.html`.
- **Table** (Ressursadministrasjon, desktop) — `label` headers on `surface-sunken`, 12/16px cell padding, `border` row separators, no zebra striping. Becomes stacked cards below 768px. → `mockups/key-ressursadministrasjon.html`.
- **Availability strip** (Ressursdetalj) — 28 equal segments for 08:00–22:00 in one 40px row. Free: white with `border`. Taken: hatched `neutral-subtle` with a dashed `border-strong` outline (the same hatch as the other-pending calendar block). Own: `primary-subtle` with a `primary` outline. Hour labels beneath in `caption` `ink-muted`; legend "Ledig" / "Reservert" / "Din booking". Never green: success is reserved for Bekreftet. → `mockups/key-ressurser.html`.
- **Timeline** (Aktivitet, Booking detail sheet) — day eyebrow in `label`; items with a 32px round `surface-sunken` icon disc, a `body` sentence with the actor in `body-strong`, and the time in `body-sm` beneath. → `mockups/key-aktivitet.html`.
- **Bar chart** (Hjem, Administrator) — seven columns, 40px max width, stacked: confirmed in `primary`, pending as `warning-subtle` with a dashed `warning` outline; `caption` weekday labels; legend in `body-sm`. Sits beside a "Diagram | Tabell" segmented control whose table alternative is a plain table. → `mockups/key-dashboard.html`.
- **Empty state** — centred within its card or page: 40px icon in `ink-muted`, `h3` heading, one `ink-secondary` sentence (max 36ch), one button.
- **Skeleton** — `surface-sunken` bars at `rounded.sm`; shimmer only when motion is allowed; shapes mirror the real layout (tile and two lines for list rows, three stat tiles, calendar grid lines without blocks).

### Calendar

- **Calendar** (week grid) — the calendar container is a card without padding. Toolbar: resource select, week title in `h3` ("Uke 43 · 19.–25. okt. 2026"), previous / "I dag" / next buttons. Header row: weekday in `label`, day number in `numeral`; today's number in `primary` with a 2px `primary` underline. Body: a time gutter of `components.calendar.gutter-width` with hour labels in `caption` `ink-muted`; day columns with hour rows of `components.calendar.hour-height` and a lighter half-hour line; today's column washed `surface-today`. Now-line: 2px `danger` with a dot at the gutter. → `mockups/key-kalender.html`.
- **Calendar block** — absolutely positioned, 4px inset, `rounded.sm`, 3px left edge plus a 1px outline in the edge colour at 40% alpha so the block's extent is visible without the tint; `spacing.1`/`spacing.2` padding; `caption-strong` title and `caption` time below. Variants: own-confirmed (`primary-subtle`, `primary` edge), own-pending (`warning-subtle`, dashed `warning` edge), other (`neutral-subtle`, `border-strong` edge, title "Reservert"), other-pending (hatched neutral, dashed edge). Blocks under 30 minutes show the title only.
- **Week strip** (mobile) — seven equal day chips: weekday in `caption`, day number in `numeral-sm`, up to three 4px dots for booking count. Selected day: `primary` fill, white text, weight 600. Below it the single-day timeline reuses the calendar body with one column.

### Overlays and feedback

- **Sheet** — desktop: right-anchored, `sheet-width`, full height, `shadow-lg`; header with `h2` title and a 40×40 close button; scrollable body; sticky footer with actions right-aligned. Mobile: full-screen; footer buttons stretch equally. Four instances share this chrome: the Booking sheet, the Resource form sheet, the Booking detail sheet and the Mer sheet. → `mockups/key-kalender.html` (Booking sheet), `mockups/key-ressursadministrasjon.html` (Resource form sheet).
- **Booking detail sheet** — header: resource name. Body: resource tile and kind; status badge in long form ("Venter på godkjenning"); a key–value list in `body` with `ink-secondary` keys (Tidspunkt, Varighet, Formål, Plassering; Booket av for Administrators); a bordered "Begrunnelse" card when a rejection or Administrator-cancellation reason exists (reason in `body`, attribution "Avslått av Sofie Lund · fre. 16. okt. 11:20" in `body-sm`); a mini timeline "Historikk". Footer: the List row actions. → `mockups/key-mine-bookinger.html`.
- **Dialog** — a centred card at every width: `dialog-max-width`, 16px side margins on mobile, `rounded.xl`, 24px padding, `shadow-lg`; `h2` title, `ink-secondary` body; actions right-aligned on desktop and stacked full-width on mobile with the primary action on top. Dialogs never go full-screen; only sheets do. The Confirm dialog and the Reason dialog share this chrome. → `mockups/key-mine-bookinger.html` (Confirm dialog), `mockups/key-godkjenninger.html` (Reason dialog).
- **Popover** — `surface-raised`, 1px `border`, `rounded.md`, `shadow-md`, max 320px, 12/16px padding, no arrow; anchored below or beside its trigger. Used for the read-only "Reservert" details on another Member's calendar block.
- **Tooltip** — `ink-primary` background, white `body-sm`, `rounded.sm`, 6/8px padding; names icon-only controls (icon rail, close buttons) and is never the sole carrier of a disabled reason.
- **Toast** — `ink-primary` background, white `body-strong` text, 18px status icon in `success-on-dark` or `danger-on-dark`, `rounded.md`, `shadow-lg`. When the toast carries an action: a link in `link-on-dark` (white, underlined) and a 40×40 "Lukk" close button. Desktop: bottom-right, 24px inset. Mobile: full-width above the tab bar. → `mockups/key-godkjenninger.html`.
- **Alert** (inline) — `rounded.md`, 12/16px padding, 1px border in the family's strong tone at 40% alpha, 20px icon, optional `body-strong` first line. Variants error, warning, info (`primary-subtle`), success.

### Resource symbols and colours

The fixed lists for RES-02 (DEC-14). Stored values are English; the UI shows and reads aloud the Norwegian name.

| Stored symbol | Norwegian name | | Stored colour | Norwegian name | Ink / tint |
|---|---|---|---|---|---|
| `users` | Personer | | `bla` | Blå | `res-bla` / `res-bla-tint` |
| `monitor` | Skjerm | | `gronn` | Grønn | `res-gronn` / `res-gronn-tint` |
| `door-closed` | Dør | | `lilla` | Lilla | `res-lilla` / `res-lilla-tint` |
| `presentation` | Presentasjon | | `oransje` | Oransje | `res-oransje` / `res-oransje-tint` |
| `projector` | Projektor | | `rosa` | Rosa | `res-rosa` / `res-rosa-tint` |
| `camera` | Kamera | | `teal` | Blågrønn | `res-teal` / `res-teal-tint` |
| `mic` | Mikrofon | | `gul` | Gul | `res-gul` / `res-gul-tint` |
| `pen-line` | Penn | | `gra` | Grå | `res-gra` / `res-gra-tint` |
| `laptop` | Bærbar | | | | |
| `headphones` | Hodetelefoner | | | | |

Icons: Lucide, 1.75px stroke, 20px in nav and tiles, 18px in buttons, 16px in error text.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use `primary` only for the action and the current place | Use blue for status, headings or decorative washes |
| Pair every status colour with its label and dot or icon | Convey status, errors or availability by colour alone |
| Mark the current place with a bar and weight, not only a tint | Rely on `primary-subtle` alone to show where the user is |
| Keep one `h1` per surface and let spacing create hierarchy | Add dividers, boxes or shadows to separate what spacing already separates |
| Put long or secondary data in cards, lists and timelines | Render every screen as a dense data table |
| Use `border-strong` on anything the user can operate | Use the hairline `border` on inputs, slots or switches |
| Keep motion within the timings in EXPERIENCE.md → Interaction Primitives and honour reduced motion | Animate entrances, counts or charts for effect |
| Write Norwegian strings in sentence case with room to breathe | Force uppercase, truncate button labels or abbreviate to fit |
| Show the resource tint only on the resource tile | Colour calendar blocks, bars or badges by resource |
