# Reconciliation review: ARCHITECTURE-SPINE vs UX (EXPERIENCE.md, DESIGN.md)

Reviewer: read-only reconciliation. Date 2026-10-19. Spine status reviewed: draft. Decision history read from `.memlog.md` (the route list exists only there; see H1).

Verdict key: OK = resolved concretely and consistent with the UX default. PARTIAL = direction right, detail missing or ambiguous. GAP = UX needs something the spine does not deliver. NOTE = fine, with a caution.

Overall: no approved UX decision is silently changed. No finding forces a UX change. Three items need new UX copy or a semantic choice from Jo (see "Escalate to Jo"). The main weakness is that the spine delegates every payload shape to "contracts at the S00 freeze" without minimum content, and the UX needs several fields that are easy for S00 to miss and expensive to add after the freeze.

## Part 1. The 7 Architecture-handoff items

| # | Item | Verdict | Spine location | Note |
|---|---|---|---|---|
| 1 | Typeface delivery | OK (NOTE) | AD-20, Stack | `@fontsource-variable/inter` bundled, no runtime network; matches the UX default (variable file covers 400/500/600/700). Caution: CSP has no `font-src`, so it falls back to `default-src 'self'`; any font Vite inlines as a `data:` URI would be blocked. Set `build.assetsInlineLimit: 0` for fonts or add `font-src 'self' data:` (L1). |
| 2 | Behaviour primitives | OK (NOTE) | AD-20, AD-19 | React Aria Components wrapped once in `ui/`; hand-written `useRovingGrid` for slot picker and calendar. Matches. Cautions: the UX Popover is non-modal (`isNonModal` must be set on the RAC Popover); week strip as RAC `Tabs` needs panels or a custom tablist (L3). |
| 3 | Date field | PARTIAL | AD-20, AD-5 | Native input with day-in-words caption chosen. Not stated: `min`/`max` must be computed from the Oslo date of `serverNow` (not browser local date); native input lets the user type out-of-range values, so the zod schema must refuse them with a field error; the "confirm acceptable rendering" is not evidenced (Deferred only mentions manual cross-browser checks in S07). The last day (`max`) is only partly bookable under DEC-08 (see M5). |
| 4 | Sign-in throttling | PARTIAL | AD-12 | Built, so the State Patterns row stays. Rule matches (5 failures, 10 s). Gap: the 5th failure returns `INVALID_CREDENTIALS` (only "further" attempts return 429), so the UI cannot start the countdown from the server; also unspecified whether a throttled attempt extends the window (M4). |
| 5 | Booking detail by URL | PARTIAL | AD-14, AD-15, AD-18; `GET /api/bookings/:id` only in memlog | Owner/Admin read, 403 for others, 404 for missing: matches the sheet's three edge cases. The DTO is not specified: no decision (reason/by/at), no resource summary, no history, no `createdAt` (H1, H2). Role scoping is trivially satisfied (only owner or Admin can read; the UI shows "Booket av" for Admins only). |
| 6 | Availability payload | PARTIAL | AD-15, AD-5; `GET /api/resources/:id/schedule?from&days` only in memlog | Single shared endpoint with a `detail`/`anonymous` union is the right design and covers strip, picker and week grid. Not in the spine: that `from` is an Oslo civil date, that only `pending`/`confirmed` bookings appear, that blocks carry ISO instants, max `days`, and that archived resources are readable (H1). |
| 7 | Activity scope | PARTIAL | AD-15 | `subject_user_id` scoping is sound and covers DEC-03. Missing: a per-booking filter for "Historikk" (or embedding events in the booking read), structured payload including reason, and the cursor response shape (M7). |

## Part 2. Needs of EXPERIENCE.md / DESIGN.md against the spine

| Item | Verdict | Spine location | Note |
|---|---|---|---|
| Availability strip payload (today, own vs other) | PARTIAL | AD-15 | Own = `detail`, other = `anonymous`, so "Din booking" vs "Reservert" is derivable. Needs the schedule contract written down (H1). Shared slot model has no home (M5). |
| Slot picker payload (taken, past, disabled, refusal text) | PARTIAL | AD-5, `contracts/rules.ts` | Window/grid/duration rules are shared. "Past" and the 30-day horizon are instant rules the browser must evaluate from civil strings and `serverNow` without local-to-UTC conversion (workable by comparing against Oslo parts of `now`, but not stated). Taken-range crossing and "Maks 4 timer." refusal text belong in the same shared module (M5). |
| Week grid payload (7 days, one resource) | PARTIAL | memlog route, AD-15 | One call with `days=7` is enough. `uke=` URL format is unspecified (L5). |
| Anonymised "Reservert" blocks | OK | AD-15 | Exact-key-set tests. No `id`, so React keys must use start/end. Status retained, which the hatched other-pending block needs. |
| `?booking=` single read, role-scoped, "Historikk", reason card | GAP | AD-14, AD-15 | See H1, H2. |
| Utløpt derivation | OK | AD-6 | `pending && start <= now`, client uses `serverNow` anchor. Need the shared helper named in contracts. The "Forespørselen ble ikke behandlet..." line also appears after rejection of an expired request (status no longer pending), so it needs `decidedAt >= startAt` (H2). |
| Approvals queue (sorted by start, expired first, own disabled with reason) | PARTIAL | AD-14, AD-9 | Sort by start asc already puts expired first. Needs a list filter (`status=pending`, all requesters, Admin only), `userId` of requester in the DTO (the client compares with the session user), and `createdAt` for "Sendt for 2 t siden" (H5, H1). |
| Pending count + "+ 1 utløpt" | GAP | AD-6, memlog only | No endpoint delivers the count to every authenticated page (sidebar pill, Mer dot, "Godkjenninger, 3 venter"). UX example shows the count includes the Administrator's own request and excludes expired (3 shown with a 4-row queue) (M1). |
| Hjem admin chart (stacked per day, next 7 days) and Tabell | PARTIAL | Deferred: "dashboard aggregate shape" | Shape deferred. Bucketing by Oslo day vs the DEC-04 window (end > now, start < now+7 d) can disagree; whether expired counts in the pending bar is undefined (M2). |
| Top-3 resources, nb-NO tie-break | NOTE | DEC-04 | SQLite has no nb collation; sort in the use case with `Intl.Collator('nb')`. Add to the dashboard contract note. |
| "Vis flere" on Aktivitet | PARTIAL | AD-4 | `before` cursor named. Not stated: cursor type (use event id), response `{ items, nextBefore }` which breaks the `{ items }` convention, and default `limit` (M7). |
| "Se bookinger" after archive refusal | PARTIAL | AD-4 (`details.futureBookingCount` "for example") | Count named only as an example. Flow 6 says the link goes to the calendar, so the details also need the first future booking's start to pick the week (M3). Singular/plural text ("1 fremtidig booking" / "2 fremtidige bookinger") cannot come from a static catalogue string (M3). |
| 409 "Forespørselen er allerede behandlet." | PARTIAL | AD-9 (`BOOKING_NOT_PENDING`) | Correct for approve/reject. The same code is used for cancel of an already cancelled booking, where the message is wrong (H4). |
| "Ressursen er ikke lenger tilgjengelig." | OK | AD-4/AD-9/AD-10 (`RESOURCE_ARCHIVED`) | Message must be in the catalogue; "submit disabled by state" is web behaviour after that code. |
| Login throttle countdown | PARTIAL | AD-12 | See item 4 and M4. |
| 401 session-expiry flow ("Økten er utløpt..."; lands on Hjem; no deep-link) | PARTIAL | AD-19, AD-11 | AD-19 only says "on 401 routes to Innlogging". Not stated: a distinct 401 code vs `INVALID_CREDENTIALS`, showing the message only when a user existed before, clearing the query cache, closing overlays (dropping `?booking=`), landing on Hjem, "Du er logget ut." note (M6, H4). |
| Offline alert "Ingen nettforbindelse" | GAP | none | Nothing in AD-19/AD-20. Also TanStack default retry (3 with backoff) delays the 5xx "Prøv igjen" alert (M6). |
| Demo pill | OK | AD-23 (`demoData`), AD-21 | Pill text/title in `nb.ts`. |
| Skip link, landmarks, `lang`, document title, one `h1` | GAP | AD-20 binds the Accessibility Floor; no owner | No rule says who builds them; S00 owns shell, so it must (M8). |
| Date field min/max | PARTIAL | AD-5, AD-20 | See item 3, M5. |
| Symbol/colour lists | OK (NOTE) | AD-2, AD-20 | Colour ids are checked against `res-<id>` tokens. The symbol list exists only in a prose table in DESIGN.md, so "must equal" needs a table parser; Norwegian names ("Mikrofon", "Blå") need a home (`nb.ts` as `Record<Id,string>`); icon lookup needs an explicit map, not a dynamic import of all Lucide icons (L4, M9). |
| Inter self-hosting | OK | AD-20 | See item 1. |
| Tokens from DESIGN.md | PARTIAL | AD-20 `gen-tokens.mjs` | Front matter lacks shadow values (`shadow-sm/md/lg` are named, defined in prose), overlay alpha (48%), block outline alpha (40%), motion durations (180/120 ms), skeleton delay (150 ms). A generator over front matter alone cannot emit them (M9). |
| Toast timing (4 s, pause on hover/focus, persist when carrying an action, one at a time, `role="status"`) | PARTIAL | AD-20 (Toast in `ui/`) | Behaviour not stated; `ui/` is frozen after S00, so S00 must implement it exactly (M9). |
| Skeleton after 150 ms, reduced motion | PARTIAL | AD-20 | Not stated; same freeze concern (M9). |
| Kommende / Tidligere grouping | GAP | none | Cancelled and rejected upcoming bookings move to "Tidligere", so it is not purely time-based (H5). |
| Booking sheet opened from Ressursdetalj, Kalender cell, Hjem, Mine bookinger ("Book igjen") with prefill | GAP | AD-18 | Only the `BookingActions` slot and `?booking=` host are seams. No seam for the create sheet; features may not import each other (H3). |
| Form pattern (blur validation, aria-disabled rules, counters, error summary, server field errors) | OK (NOTE) | AD-19, AD-4 | RHF + `zodResolver` and `fieldErrors[].path` can deliver it if `path` equals the form field names (`resourceId`, `date`, `start`, `end`, `purpose`, `reason`). Add that rule. `reason` and `purpose` limits (1-200, trimmed) should be named in contracts (DEC-14). |
| Empty JSON body for action POSTs | NOTE | AD-13 | "Bodies must be `application/json`" plus Fastify rejects an empty body with that type. `cancel`, `approve`, `archive` and `DELETE /api/session` must send `{}` or the parser must allow empty (L2). |

## Part 3. Silent changes to approved UX decisions

None found. Checked: 12 h absolute session (matches "twelve hours later"), `B-<id>` format, Norwegian paths, 10 s throttle, no optimistic updates, owner/Admin cancel rules, Admin cannot approve own, reject allowed on Expired, archived read-only page, no un-archive, Tailwind not used (UX: optional), Chromium-only CI (UX lists wider browser support; Deferred records manual S07 checks, acceptable). The memlog already flags the DEC-16 extension (429, 500) for Jo.

## Findings

### Critical
None.

### High

**H1. Payload shapes are deferred without minimum content.** The spine contains no route table and says dashboard and activity shapes come "at the S00 freeze". Contracts are frozen after S00 and any change needs Jo, so a missed field is expensive.
Fix: add a "Contract minimums" table to the spine listing, per endpoint, the fields the UX needs:
- `GET /api/session`: `{ user: { id, name, role } | null, serverNow, demoData }`.
- `GET /api/resources`: `{ items }` with `id, name, kind, description|null, location, seats|null, symbol, colour, approvalRequired, status`. Unbounded; default order rooms first, then name by nb collation (deterministic "first room"). `status=archived|all` is Admin-only, enforced by `policy`, not by the route gate.
- `GET /api/resources/:id/schedule?from=YYYY-MM-DD&days=1..7`: `from` is an Oslo civil date; blocks are `pending`/`confirmed` only, with ISO instants, as the AD-15 union; readable for archived resources.
- `GET /api/bookings/:id`: booking with embedded resource summary (`id, name, kind, location, symbol, colour, status`), `userId`, `booker.name`, `purpose`, `createdAt`, `decision` (H2), and `events` (Historikk) or a documented `GET /api/activity?bookingId=` that the sheet uses.
- Booking list items: the same booking shape with the resource summary embedded (rows need the tile, name and `userId`).
- `GET /api/dashboard` (Admin): see M1/M2.
- Activity items: structured (type, actor name, booking id or resource id, resource name, reason|null, `at`), rendered to text only in the web.
Also move the route list from `.memlog.md` into the spine (or a companion) so it is binding.

**H2. Decision data (reason, who, when) is not in the schema notes and may collide with AD-9 triggers.** The reason card, "Avslått av Sofie Lund · fre. 16. okt. 11:20", the cancel-by-Admin reason and the expired-then-rejected line all need `decided_by`, `decided_at`, `decision_reason` (or events carrying them). AD-9 triggers forbid updating purpose/user/time; they must still allow these columns to be set exactly once on a transition. The schema is delivered and frozen in S00.
Fix: state in AD-9/AD-17 that `bookings` carries `created_at`, `decided_by_user_id`, `decided_at`, `decision_reason` (NULL until a reject or Administrator cancel; owner cancel sets `decided_by`/`decided_at` with NULL reason), written in the transition's transaction and mirrored in the activity event. State the line rule: show "Forespørselen ble ikke behandlet før starttidspunktet." when `pending && start <= now`, or `rejected && decided_at >= start_at`. The reason is user content: keep it out of logs (already AD-26).

**H3. No seam for opening the create-booking sheet.** The sheet is launched from Ressursdetalj (S02), Kalender cell (S04), Hjem "Ny booking" (S06), Mine bookinger "Ny booking" and "Book igjen" (S04), each with different prefill (resource fixed, date + start, purpose). AD-18 forbids feature-to-feature imports and only defines `BookingActions` and the `?booking=` host. UX says only the open booking is URL state.
Fix: add to AD-18 a frozen S00 stub `app/booking-sheet.tsx` exposing `useBookingSheet().open({ resourceId?, date?, start?, purpose?, lockResource? })`, hosted in the shell, implemented in S04. Prefill by context, not URL (consistent with UX).

**H4. Error-code coverage is too thin for the UX states.**
- `BOOKING_NOT_PENDING` is also what AD-9's compare-and-set returns for cancel, but the message is "Forespørselen er allerede behandlet." Add `BOOKING_NOT_ACTIVE` (cancel on cancelled/rejected) with its own message, or make the message depend on the action.
- 401 has two meanings in AD-4. Add `UNAUTHENTICATED` (no or expired session) distinct from `INVALID_CREDENTIALS`, so the web can show "Økten er utløpt..." only on the former.
- `BOOKING_STARTED` on cancel and approve, `ORIGIN_REFUSED`, `RATE_LIMITED`, `INTERNAL`, `NOT_IMPLEMENTED` and `OWN_REQUEST` have no UX copy (only `OWN_REQUEST` and the quoted ones do). Author them in the catalogue per Voice and Tone and list them for Jo's review.
- Messages with counts need a function form: `messages.nb.RESOURCE_HAS_FUTURE_BOOKINGS(details)` handling singular/plural, so server and client produce identical text (M3).

**H5. Bookings list contract is unspecified.** UX needs: own bookings for any role (an Admin's Mine bookinger must not show everyone's), the Admin pending queue for all requesters, Hjem upcoming-own, and the Kommende/Tidligere split. "Tidligere" includes cancelled and rejected bookings even with a future start (Flow 5), and Expired requests.
Fix: add to contracts `GET /api/bookings?scope=mine|all` (`all` Admin only), `status` (repeatable), `group=upcoming|past`, `resourceId`, `limit`, with these definitions in a shared pure function: `upcoming` = status in (`pending`,`confirmed`) and `start > now`; everything else is `past`. Sorts: upcoming by start ascending, past by start descending, queue by start ascending. State that bookings and resources lists have no default cap in the MVP (UX has no "Vis flere" there), or add the cursor.

### Medium

**M1. Pending count and "+ N utløpt" have no delivery path.** Needed on every authenticated page for Administrators.
Fix: `GET /api/dashboard` (Admin) returns `pending: { count, expiredCount }` where `count` = pending with `start > now` from all requesters including the Administrator's own, `expiredCount` = pending with `start <= now`. The shell nav query reads this key; invalidation map refreshes it after approve, reject, cancel, create. Alternatively a cheap `GET /api/approvals/summary`.

**M2. Chart bucketing vs DEC-04 window.** Panel counts use `end > now and start < now+7 d`; the chart is "per day for the next seven days". Fix: chart days = the seven Oslo days starting today, always seven entries including zeros, each `{ date: 'YYYY-MM-DD', confirmed, pending }` by booking start day; state that the bar totals may differ from the panel (earlier today excluded from the panel but not from today's bar), or filter the bars with the same `end > now`. Decide that Expired requests are excluded from `pending` bars, consistent with VIS-04/CR-3 (confirm with Jo; this is a data meaning, not a layout change). The Tabell and `aria-label` are built from the same array in the web.

**M3. Archive refusal details.** Fix: `details: { futureBookingCount, firstFutureBookingAt }`; "Se bookinger" links to `/kalender?ressurs=<id>&uke=<week of firstFutureBookingAt>`; plural handled in the message function (H4).

**M4. Throttle edge cases.** Fix: the 5th failure returns 401 with `details.retryAfterSeconds: 10` so the UI starts the countdown without counting client-side; a request rejected with 429 does not extend the window and is not counted; the Innlogging form handles 429 by disabling the button with the countdown from `retryAfterSeconds`, also after a refresh.

**M5. Shared slot model and the 30-day edge.**
- Slot picker, availability strip and "Ledige tider" list (S04 and S02, different features that may not import each other) all need the same 28-slot model, taken/past/horizon states, merged free ranges and refusal reasons. Put `availability.ts` in `packages/contracts` (frozen S00): `buildSlots(blocks, civilDate, nowParts)`, `freeRanges`, `validateSelection` returning the refusal code ("Maks 4 timer." etc.).
- Date `max` = today + 30 days is date-level, but DEC-08 is `start <= now + 30 × 24 h`. On the last day, slots after the current time of day are not bookable. Foundation says "the UI never shows a time it cannot book", so those slots must be disabled, with an accessible name that UX does not define (see Escalate to Jo). Evaluate "past" and horizon by comparing the slot's civil date/time with the Oslo parts of `now` and `now + 30 × 24 h` (no local-to-UTC conversion in the browser, so AD-5 holds).

**M6. Error and connectivity plumbing in the web.** Add to AD-19:
- `api/call` maps a failed fetch to `ApiError { kind: 'network' }`, which shows the top alert "Ingen nettforbindelse" (via `navigator.onLine` and TanStack `onlineManager`) and sets mutations to `aria-disabled` until back online.
- Query retry: none for 4xx, at most one for network/5xx, so the "Prøv igjen" alert appears promptly; keep last good data on error.
- On `UNAUTHENTICATED` after a user existed: `queryClient.clear()`, remove overlays (drop `?booking=`), navigate to `/logg-inn` with the expiry message, land on Hjem after sign-in (no `from` redirect). On logout: same, with "Du er logget ut."
- A shared `QueryState` component (skeleton after 150 ms, empty, error with retry, 403 "Ingen tilgang", 404) so every surface renders the State Patterns defaults identically.

**M7. Activity contract.** Fix: `GET /api/activity?before=<eventId>&limit=&bookingId=` returns `{ items, nextBefore: number | null }`, an explicit exception to the `{ items }` convention; cursor is the event id (monotonic, no timestamp ties). The Member scope applies to the `bookingId` filter as well (Historikk). Default `limit` 20.

**M8. Accessibility shell duties have no owner.** Fix: add to AD-20/AD-18: the S00 shell provides the skip link ("Hopp til innhold") as first focusable element, `header`/`nav[aria-label]`/`main` landmarks, `lang="nb"` in `index.html`, document title "FELLES – <page>" from a `titleKey` field in the frozen route table, and focus moved to the page `h1` on route change with a polite announcement. The route table also needs a role requirement per route so a Member opening an Administrator URL gets "Ingen tilgang" (from the 403 of its first query, never an empty page).

**M9. Tokens and `ui/` behaviour constants.** Fix: `gen-tokens.mjs` emits front-matter tokens only; add a hand-written, committed `styles/tokens.extra.css` for shadows (values from DESIGN.md Elevation), overlay and outline alphas, and motion durations, with a test that the extra file defines every name DESIGN.md references (`shadow-sm`, `shadow-md`, `shadow-lg`). Put the behaviour numbers in `ui/timing.ts` (toast 4000 ms, action toast persistent, skeleton delay 150 ms, sheet 180 ms, hover 120 ms, reduced motion) and state in AD-20 that Toast implements: one at a time, `role="status"`, pause on hover and focus, persistence when it carries a link or button, "Lukk" button, dismissed on navigate. The symbol table check should parse the "Resource symbols and colours" table from DESIGN.md or use a fixture.

**M10. Slice ordering for Ressursdetalj.** The availability strip (S02 page) needs the schedule endpoint (S03) and "Book" needs the sheet (S04). The memlog already assumes S03 owns schedule. Fix at epics: put the strip in a story after S03, or have S02 deliver the page without the strip and S04 add it. State it in the Structural Seed ownership notes.

**M11. Client clock re-sync.** `serverNow + monotonic elapsed` drifts when the machine sleeps (monotonic timers may pause), which would make "passert" and Utløpt wrong after a lunch break. Fix: re-fetch `GET /api/session` (cheap) on `visibilitychange` and `online` and re-anchor the clock.

### Low

- **L1.** CSP `font-src`/asset inlining (item 1).
- **L2.** Send `{}` with every body-less POST/DELETE, or allow empty JSON bodies in the parser; add to the `api/call` rules.
- **L3.** RAC Popover `isNonModal`; confirm Escape and focus return to the block; confirm RAC `Tabs` for the week strip supports seven chips with arrow keys and no panel per tab, else hand-write.
- **L4.** `ui/ResourceIcon` uses an explicit static map from the contracts symbol ids to Lucide components, with an exhaustiveness test; bundle size stays small.
- **L5.** Fix `uke=` format in the frozen route table (suggest the Monday civil date `2026-10-19`; ISO week number "Uke 43" is computed by one pure function in `i18n/format.ts` from civil dates, since `Intl` has no week number). Week arithmetic uses civil-date math with `Date.UTC` and arguments (allowed by the clock lint).
- **L6.** Persist-in-browser items (Tabell/Diagram choice, last viewed calendar resource) use `localStorage` in try/catch inside `app/`; state it so the "no global store" rule is not read as forbidding it.
- **L7.** Seeded ids reach about 20; UX narrative shows `B-1047`. Cosmetic; start the booking sequence near 1040 in the seed if the mocks must match.
- **L8.** `Booking detail sheet` "Statusen er oppdatert." needs the sheet query to be separate from the list cache and refetched on open; note in `api/keys.ts`.
- **L9.** Relative time ("Sendt for 2 t siden" visible, "2 timer siden" accessible) is a custom formatter in `i18n/format.ts` driven by the synced clock.
- **L10.** Reject and cancel `reason` and booking `purpose`: name the contract limits (1-200 after trim) so the client counter and server agree.

## Escalate to Jo (none changes an approved UX decision; each needs a decision or copy)

1. **Slots beyond the 30-day horizon on the last selectable date** (M5): need a disabled state and an accessible name (suggested "klokken 14:00, utenfor bookingvinduet") plus a one-line hint. Alternative: define the Date `max` so that the last date is fully bookable, which would mean interpreting BOK-02 at date level (a requirement/DEC-08 change, not recommended).
2. **New error copy** (H4): messages for `BOOKING_STARTED` (cancel/approve), the cancel-on-already-cancelled case, `RATE_LIMITED` text with countdown, `ORIGIN_REFUSED`, `INTERNAL`. Proposed in the catalogue by the architect; Jo or UX to confirm tone.
3. **Chart semantics** (M2): confirm that Expired requests are excluded from the pending bars (consistent with VIS-04 and CR-3), and that bars bucket by Oslo start day while the panel keeps the DEC-04 window.
4. Already flagged in the memlog: 429 and 500 as extensions of the DEC-16 status list.

## Counts

Handoff items: 1 OK (with note), 1 OK (with note), 5 PARTIAL. Part 2 rows: 6 OK/NOTE, 15 PARTIAL, 6 GAP. Findings: 0 critical, 5 high, 11 medium, 10 low.
