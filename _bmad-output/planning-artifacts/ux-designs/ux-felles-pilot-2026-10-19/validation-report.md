# Validation Report — felles-pilot

- **DESIGN.md:** `_bmad-output/planning-artifacts/ux-designs/ux-felles-pilot-2026-10-19/DESIGN.md`
- **EXPERIENCE.md:** `_bmad-output/planning-artifacts/ux-designs/ux-felles-pilot-2026-10-19/EXPERIENCE.md`
- **Run at:** 2026-10-19T10:40 (Europe/Oslo)
- **Lenses:** rubric walker (`review-rubric.md`), accessibility WCAG 2.2 AA (`review-accessibility.md`)
- **Approval:** Jo approved the design on 2026-10-19 (direction Rolig SaaS / Fjord, mobile tab bar, week strip + day timeline). The former Open Questions are recorded as decisions in `.memlog.md`; EXPERIENCE.md now carries an Architecture handoff list instead.
- **Status:** every high and medium finding below was addressed in the spines on 2026-10-19 before this report was written; the "Resolved" line under each finding says how. Low findings are listed in the reviewer files and were applied where they were mechanical (quoted YAML, name consistency).

## Overall verdict

Rubric walker: a usable contract, not yet strong at review time. Every `{path}` reference resolved, all four UJs and the E2E-implied flows had a protagonist, steps, climax and failure path, the glossary matched the sources, and no UX decision altered an approved requirement (Part A and CR-1…CR-4 honoured). What held it back were load-bearing decisions left to the implementer: the Booking detail sheet had no anatomy or states, the booking date control was never named, and the slot picker rules could not express a 30-minute booking.

Accessibility lens: close to AA-safe but not there at review time. Every colour pair the spine specified passed (text 4.58–17.27:1, control boundaries 3.27–3.73:1, toast icons 10.96 and 8.52:1), status was never colour-only, overlays trapped and returned focus. The failures were in pairs the spine never checked (the link inside the dark toast at 2.70:1) and in behaviour it left open on the core booking path (focus dropped by `disabled` in-flight buttons, no accessible date selection, an under-specified week-grid keyboard model). Both pictures agree on the two gaps that mattered most, the Booking detail sheet and the date control, and both are now closed.

## Category verdicts (at review time)

- Flow coverage — adequate
- Token completeness — adequate
- Component coverage — adequate
- State coverage — adequate
- Visual reference coverage — strong
- Bloat & overspecification — adequate
- Inheritance discipline — strong
- Shape fit — strong

## Findings by severity

### Critical (0)

None.

### High (6)

**[Component coverage]** — Booking detail sheet unspecified (EXPERIENCE.md IA "Overlays", Flows 4–5)
The target of row taps, block clicks, toast links and activity links, and the place where rejection and admin-cancel reasons are read, had no anatomy, no behaviour row and no states.
Fix: Component Patterns row, State Patterns row, DESIGN.md Sheet sub-bullet.
Resolved: added "Booking detail sheet" to Component Patterns (contents, actions, `?booking=` URL), to State Patterns (loading, 404, 403, stale status) and to the DESIGN.md Sheet bullet with a mock pointer.

**[Component coverage]** — Date control never named (EXPERIENCE.md Flows 1–2, Slot picker row)
"Picks ons. 21. okt." had no component behind it; the mock used a plain text input.
Fix: a Date field component with the BOK-02 window.
Resolved: "Date field" bullet in DESIGN.md (native date input, `min` today, `max` today + 30 days, nb-NO caption) and a Component Patterns row (reloads the picker, prefill rules); Flow 2 step 3 names it.

**[State coverage]** — Booking detail sheet had no state row
Resolved: see above.

**[Accessibility]** — In-flight `disabled` buttons drop focus (EXPERIENCE.md Button; State Patterns Innlogging, Booking sheet). WCAG 2.4.3, 4.1.3
On every server error the user heard the alert but had no focus position.
Resolved: in-flight buttons use `aria-disabled`; repeat activations are ignored; on error focus moves to the inline alert (`tabindex="-1"`); stated in Button, Accessibility Floor and DESIGN.md Button.

**[Accessibility]** — No accessible date selection in the Booking sheet. WCAG 1.3.1, 2.1.1, 3.3.2
Resolved: same Date field as above.

**[Accessibility]** — Toast link and focus ring at 2.70:1 on the dark toast (DESIGN.md Toast, Focus ring). WCAG 1.4.3, 1.4.11, 2.4.7
Resolved: tokens `link-on-dark`, `focus-ring-on-dark`, `success-on-dark`, `danger-on-dark` added to the frontmatter and used by the Toast and Focus ring specs; actionable toasts also gained a 40×40 "Lukk" button and persist until dismissed (2.2.1).

### Medium (24)

**[Flow coverage]** — No login / session flow
Resolved: Flow 0 "Sign in and land" with wrong-password, session-expiry (401) and logout variants.

**[Flow coverage]** — Flow 1 never touched Kalender despite UJ-1 wording
Resolved: "Variant, from the calendar" added under Flow 1 (Se i kalender → empty 10:00 cell → prefilled sheet).

**[Token completeness]** — Hex literals in prose without tokens (`#FAFBFF`, `#7EE2A8`, `#FF9B93`)
Resolved: `surface-today`, `success-on-dark`, `danger-on-dark` tokens; prose references them.

**[Token completeness]** — Type sizes outside the ramp (11px tab label, 12/32 initials, 15/20 and 16/22 numerals, 18/24 top bar)
Resolved: roles `tab-label`, `caption-strong`, `numeral`, `numeral-sm` added; top bar title mapped to `h2`; the 13px rule now names its exceptions.

**[Component coverage]** — Popover and Tooltip used but unspecified
Resolved: both added to DESIGN.md Components and frontmatter, and to Component Patterns (open/close, Escape, focus return, roles).

**[Component coverage]** — "Arkivert" badge missing from the Badge spec
Resolved: archived variant and `badge-archived` token.

**[Component coverage]** — Availability strip lacked an own-booking state used by Flow 1's climax
Resolved: "own" segment variant (`primary-subtle`, "Din booking") in both spines.

**[State coverage]** — Slot picker could not express a 30-minute booking
Resolved: inclusive-end semantics stated; a start alone is a 30-minute booking; clearing only on re-activating the start.

**[State coverage]** — Client-side disabling contradiction (Forms primitive vs Reason dialog)
Resolved: Forms primitive now states the single exception (empty required free text).

**[Bloat]** — Components prose pixel-dense, bypassing tokens
Resolved in part: calendar, switch, segmented, popover and tooltip sizes moved into `components` frontmatter; prose references `components.calendar.*` and spacing tokens. Remaining pixel values describe anatomy of a custom component set and were kept deliberately.

**[Inheritance]** — Mobile dialog contradiction (full-screen vs centred)
Resolved: one rule in both files, dialogs stay centred cards at every width; only sheets go full-screen.

**[Inheritance]** — VIS-01 "ukevisning" on mobile is a reading that needs Jo's explicit yes
Open: kept as Open Question 2 with the fallback (7-column grid with bar-only blocks) written down. Needs a decision at this review.

**[Accessibility]** — Actionable toasts auto-dismiss in 4 s (2.2.1)
Resolved: toasts with an action persist until dismissed; plain toasts keep 4 s.

**[Accessibility]** — Active navigation colour-only (1.4.1, 1.4.11)
Resolved: active sidebar item gets a 3px `primary` bar and weight 600; active tab gets a 2px top bar and weight 600; mocks patched.

**[Accessibility]** — Week-grid keyboard model under-specified
Resolved: `role="grid"` with half-hour rows × day columns, roving tab stop, whole-word cell names, Home/End/PageUp/PageDown, Enter behaviour, Popover behaviour, and the content model of "Ledige tider" (per-day headings, free ranges as buttons).

**[Accessibility]** — 32px targets on mobile, 32px close button, 28px swatches contradict the 40px floor (2.5.8)
Resolved: 32px small buttons allowed only in desktop dense rows; close buttons 40×40; swatches 40px targets with a 28px visual circle; 24px half-hour cells acknowledged as the minimum with no gaps.

**[Accessibility]** — Symbol picker options named by English Lucide ids (3.1.2, 2.4.6)
Resolved: Norwegian display names for all ten symbols and eight colours in DESIGN.md and Component Patterns.

**[Accessibility]** — Abbreviations ("t", "man.") inside accessible names and live regions
Resolved: Voice and Tone rule and Accessibility Floor: visible text may abbreviate, assistive-tech strings use whole words.

**[Accessibility]** — Free slot boundary at the 1.31:1 hairline; range state fill-only; `aria-pressed` on gridcells
Resolved: slot border is `border-strong`; range gets a 1px `primary` border; cells are `gridcell` buttons with roving tabindex; mocks patched.

**[Accessibility]** — Counter and `maxlength` disagree; over-limit colour-only
Resolved: no `maxlength`; visible counter, polite announcement at 180 and 200, over-limit shows the standard field error "Maks 200 tegn." with icon.

**[Accessibility]** — Focus obscured by sticky bars (2.4.11)
Resolved: `scroll-padding-top: 56px`, `scroll-padding-bottom: 64px` on mobile scroll roots and footer-height padding on sheet bodies, stated in Layout & Spacing and the Accessibility Floor.

**[Accessibility]** — "Mer" tab is a link that opens a sheet; count dot unnamed
Resolved: "Mer" is a button with `aria-haspopup="dialog"`; the dot reads "3 ventende godkjenninger"; current-page marking inside the Mer sheet defined.

**[Accessibility]** — Required-field convention undefined (3.3.2)
Resolved: optional fields say "(valgfritt)", all others carry `aria-required`; stated in Input spec and Accessibility Floor.

**[Accessibility]** — Fill-only extents (calendar blocks 1.12–1.16:1, segmented control)
Resolved: blocks get a 1px outline in their edge colour at 40% alpha; selected segment gets a `border-strong` outline and weight 600; mocks patched.

### Low (39)

See `review-rubric.md` (27) and `review-accessibility.md` (12). Applied from the rubric's mechanical notes: `letterSpacing` values quoted; `{side}` placeholder removed from the document-title rule; "Hjem" used consistently for the start page; "Week strip" and "List row" names aligned. The memlog's earlier `ink-muted` value is left as history (a later entry records the change).

## Reviewer files
- `review-rubric.md`
- `review-accessibility.md`
- `review-editorial.md` (structure + prose polish applied after the fixes above)
