---
status: final
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - docs/requirements.md
  - _bmad-output/planning-artifacts/prds/prd-felles-pilot-2026-10-18/prd.md
  - _bmad-output/planning-artifacts/prds/prd-felles-pilot-2026-10-18/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-felles-pilot-2026-10-19/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/architecture/architecture-felles-pilot-2026-10-19/approved-copy.md
  - _bmad-output/planning-artifacts/architecture/architecture-felles-pilot-2026-10-19/AMENDMENT-1-proposal.md
  - _bmad-output/planning-artifacts/architecture/architecture-felles-pilot-2026-10-19/AMENDMENT-2-proposal.md
  - _bmad-output/planning-artifacts/architecture/architecture-felles-pilot-2026-10-19/AMENDMENT-3-proposal.md
  - _bmad-output/planning-artifacts/ux-designs/ux-felles-pilot-2026-10-19/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-felles-pilot-2026-10-19/EXPERIENCE.md
---

# FELLES - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for FELLES, decomposing the requirements from the PRD, the UX design contract (DESIGN.md and EXPERIENCE.md) and the Architecture spine into implementable stories.

Conventions used in this inventory:

- Requirement ids are the PRD's stable ids (they are the ids of `docs/requirements.md` Part A, which stays authoritative: DEC-19). They are kept instead of renumbering to FR1, FR2…, so every story traces back to the spec without a mapping table. "Owner" is the PRD §4 slice; stories refine it.
- `DEC-nn` and `CR-n` after a requirement are PRD clarifications and approved changes that are part of the requirement's meaning.
- Slices S00–S07 are delivery increments (PRD §4.0). The architecture requires every story to belong to exactly one slice and every MUST evidence part to name its `evidenceSlice` (Additional Requirements AR26).

## Requirements Inventory

### Functional Requirements

**Access and roles (S01; AUT-03 is enforced in every slice)**

- AUT-01 (MUST): E-mail and password login; a valid login gives a session; an invalid one gives a clear error that does not reveal whether the e-mail exists. (DEC-11)
- AUT-02 (MUST): Protected API calls require an active session; logout ends the session; unauthenticated requests cannot read booking or user data. (DEC-11, BR-6)
- AUT-03 (MUST): Member and Administrator rights differ and are enforced on the server, not only in the UI; a Member cannot change resources or process others' requests.
- AUT-04 (MUST): The UI shows the signed-in name and role; sessions survive a page refresh.

**Resource catalogue and administration (S02)**

- RES-01 (MUST): All signed-in users can see and search active resources, filter on `room` / `equipment`, and open a detail page.
- RES-02 (MUST): A resource has id, name, category (`kind`), short description, location, optional seats, symbol and colour (from fixed lists), the `approvalRequired` flag, and active/archived status. Seats are optional with no rooms-only restriction (CR-4). (DEC-14)
- RES-03 (MUST): An Administrator can create and edit resources; invalid values are rejected with field-specific messages. (DEC-14)
- RES-04 (MUST): An Administrator can archive a resource that has no future `pending`/`confirmed` bookings; an archived resource cannot be booked and is hidden from the normal catalogue; archiving is final. (DEC-06, DEC-18)
- RES-05 (SHOULD): The resource list clearly indicates whether a resource requires approval.

**Booking and conflict control (S03 API, S04 UI)**

- BOK-01 (MUST): A Member can choose resource, date, start, end and a short purpose and create a booking; the resource must be active. (DEC-14)
- BOK-02 (MUST): Allowed times are 08:00–22:00 Norwegian local time; start and end on the hour or half hour; duration 30 minutes to 4 hours; end after start; not in the past and not more than 30 days ahead. (DEC-08, DEC-09)
- BOK-03 (MUST): Two bookings on the same resource may not overlap when both are `pending` or `confirmed`; the test contract is `startA < endB && startB < endA`, so 10:00–11:00 and 11:00–12:00 are allowed.
- BOK-04 (MUST): The conflict check is atomic on the server: two simultaneous requests for the same time slot give at most one success, with no partially written data. (DEC-12)
- BOK-05 (MUST): A resource without approval requirement gives `confirmed` at once; one with it gives `pending`, and the slot is blocked. (DEC-15)
- BOK-06 (MUST): The owner can cancel their own `pending` or `confirmed` booking before start; an Administrator can cancel others' bookings before start and must give a reason; cancelling frees the slot and is recorded in history. (DEC-07)
- BOK-07 (MUST): The booking form shows availability and gives understandable feedback on conflict, validation errors and success; the server is always the truth.
- BOK-08 (SHOULD): The user can easily rebook a resource from an earlier booking with a new time.

**Approval (S05)**

- APP-01 (MUST): An Administrator has a list of pending approvals with resource, requester, time range and purpose; Expired requests stay listed, marked "utløpt", reject only. (CR-3)
- APP-02 (MUST): An Administrator can approve or reject another person's request; rejection requires a short reason; approval records the Administrator and time; an Administrator cannot process their own request. (DEC-14, CR-3)
- APP-03 (MUST): Only a booking that is still `pending` can be processed; repeated or concurrent approval gives no double processing; the server validates that the resource is still active and the time valid; approval after start is refused (`BOOKING_STARTED`). (CR-3)
- APP-04 (MUST): On rejection the slot is freed at once; the Member sees the updated status and the reason.

**Calendar, overview and activity (S04 calendar and Mine bookinger, S06 start page, dashboard, activity)**

- VIS-01 (MUST): A week view shows bookings for the chosen resource with clear time blocks and status; the user can navigate between weeks and filter on resource; other Members' bookings appear as anonymous "Reservert" blocks. (DEC-03, CR-2)
- VIS-02 (MUST): "Mine bookinger" sorted with upcoming first; the user can open details or cancel when the rules allow it. (S04 owns the module and exposes a cancel slot; S05 supplies the action.)
- VIS-03 (MUST): A start page shows upcoming bookings and resources; an Administrator also sees the number of pending approvals (approvable only; Expired requests excluded). (DEC-04, CR-3)
- VIS-04 (MUST): An Administrator overview for the next seven days: total `confirmed` bookings, pending approvals, and the three most booked resources (by confirmed count; ties by name in nb-NO order; zero counts excluded). (DEC-04, CR-3)
- VIS-05 (MUST): An activity log records creation, approval, rejection, cancellation and resource changes with actor, time and relevant id; a Member sees activity for their own bookings, an Administrator sees everything. (DEC-03, DEC-17)
- VIS-06 (SHOULD): A visual presentation (for example a bar chart) of booking activity with an accessible text alternative.

**Shared business rules**

- BR-1 (MUST): Times are stored as UTC and displayed in `Europe/Oslo`; the 08–22 window is local time; daylight saving is handled correctly and tested around one summer/winter switch (DEC-09: fixed clock around 2026-10-25 and 2027-03-28). (S00 helpers, S03 tests)
- BR-2 (MUST): Resources must be active at creation and at approval; no hard deletion of resources with booking history. (S02, S03, S05)
- BR-3 (MUST): Bookings are never overwritten or deleted; a change is cancel plus a new booking. (S03, S05)
- BR-4 (MUST): All mutations are validated on the server and return understandable, structured errors. (DEC-16; every slice, format set in S00)
- BR-5 (MUST): The audit event and the data change are saved in the same database transaction. (DEC-17; S00 writer, each mutating slice)
- BR-6 (MUST): Requests from users who are not signed in cannot read booking or user data. (S01; route-enumeration test in S07)

**User interface**

- UI-1 (MUST): Eight pages: Login (S01); Dashboard/Hjem (S06); Resources and resource detail (S02); Calendar (S04); Mine bookinger (S04); Approvals for Administrators (S05); Resource administration for Administrators (S02); Activity (S06).
- UI-2 (MUST): App shell, role-based navigation, shared layout and nb-NO date/number helpers; works at 375 px and 1440 px with no horizontal scrolling. (S00 shell; all pages; S07 verifies)
- UI-3 (MUST): Keyboard navigation, visible focus, labelled fields, errors understandable without colour, good contrast; WCAG 2.2 AA where practical.
- UI-4 (MUST): Loading, empty, error, unavailable and success states, and confirmation before destructive actions.
- UI-5 (MUST): UI text in Norwegian bokmål; dates, times and numbers in nb-NO formatting. (DEC-10)

**Seed, demo and run**

- SEED-1 (MUST): At least 8 resources (4 rooms, 4 equipment, at least 2 requiring approval); at least 4 users (2 Administrators, 2 Members; hashed passwords; development credentials documented as such); at least 18 bookings varied in time and status with linked activity events, placed around the current week, clearly marked synthetic; injectable clock. (DEC-18)
- SEED-2 (optional): `npm run demo:reset` restores synthetic data with a clear warning before replacing local demo data.
- RUN-1 (MUST): One documented start command after install and seeding; the contracts of spec §6 (entity shapes, route list, error format, authorisation rules, time handling) are frozen in S00; no secrets in Git; workspaces `apps/web`, `apps/api`, `packages/contracts`.

### NonFunctional Requirements

- NFR-01 (MUST): The full solution runs locally on macOS (Windows 11 is the primary dev platform) with documented setup and no paid services or external API keys. Evidence: macOS CI job plus a macOS runtime smoke test. (CR-1, PIL-11)
- NFR-02 (MUST): TypeScript typecheck, lint, automated tests and production build run without error before integration. (S00 defines the gate)
- NFR-03 (MUST): Tests cover collisions, concurrent booking, role restrictions, status transitions, transaction integrity and UTC/local time.
- NFR-04 (MUST): Parameterised database operations, hashed passwords, HttpOnly session cookie, server-controlled access, `SameSite=Lax` or stricter, `Secure` over HTTPS; CSRF protection of writes by `Origin` check with a suitable supplement. (DEC-11)
- NFR-05 (MUST): A new developer or agent can start the project from the README without prior chat context.
- NFR-06 (SHOULD): Typical API lookups feel responsive on local demo data; no formal load test.

### Acceptance Evidence (mandatory E2E, spec §10)

- E2E-01: Member logs in, finds a room, books a free slot -> `confirmed`, visible in the calendar and Mine bookinger. (API S03, browser S04)
- E2E-02: Member tries an overlapping slot -> conflict rejected, existing booking unchanged. (API S03, browser S04)
- E2E-03: Two simultaneous requests for the same resource -> exactly one succeeds; no duplicate or orphaned activity. (S03)
- E2E-04: Member books approval-gated equipment; another Administrator approves -> `pending` then `confirmed`, slot stays blocked. (API S05, browser S07)
- E2E-05: Administrator rejects with a reason -> `rejected`; Member sees the reason; slot freed; Expired request rejected with reason; approval after start refused. (API S05, browser S07)
- E2E-06: Member cancels a future booking -> `cancelled`, history kept, slot free. (API S05, browser S07)
- E2E-07: Member calls the Administrator API directly -> 403, nothing changes; extended with each slice that adds an admin route; final sweep in S07.
- E2E-08: Administrator creates and archives a resource -> catalogue updates; archived resource cannot be booked; archiving with a future active booking refused. (create/edit/archive and guard S02; archived-not-bookable S03; browser S07)
- E2E-09: Administrator tries to approve their own booking -> refused, status unchanged. (API S05, browser S07)
- E2E-10: Keyboard navigation at mobile width -> critical actions reachable, form errors readable, no horizontal scroll. (S07)
- Requirements without a spec scenario (VIS-03, VIS-04, VIS-05) get API-level tests in S06 with a fixed clock (7-day boundaries, top-3 and tie-break, Expired exclusion, role-scoped activity); a browser check of dashboard and Activity is part of S07.

### Additional Requirements

**Starter template and foundation**

- AR1: Greenfield with no starter template. Epic 1 Story 1 is the S00 scaffold: three npm workspaces (`apps/web`, `apps/api`, `packages/contracts`) plus root configuration. S00 begins with a clean install and an empty-skeleton `verify` on Windows, committing the lockfile and recording the exact Node minor and verified idioms in a stack note. S00 is split into the spec's three tasks (T00-01 scaffold, T00-02 data model and contracts, T00-03 test harness and seed) with a Jo checkpoint after T00-02. (AD-27, AD-20)
- AR2: Pinned stack (Node 24 LTS with engines `^24.15.0 || >=26.0.0`, npm >=11.12, TypeScript 6.0.3, React 19.3.1, Vite 8.3.4, react-router 8.4.0, TanStack Query 5.104.4, react-hook-form 7.90.0 with @hookform/resolvers 5.9.2, zod 4.6.7, react-aria-components 1.22.1, lucide-react, Fastify 5.12.7 with cookie/static/helmet, better-sqlite3 13.0.3, temporal-polyfill 1.0.6, pino, Vitest 5.0.5, Playwright 1.64.1, ESLint 9.39.5, Prettier). `.npmrc` `save-exact` and `ignore-scripts`; `npm run setup:native`; `engine-strict`; lockfile committed. Jo installs Node 24 LTS before S00.

**Contracts and API**

- AR3: `packages/contracts` is the single source for Zod schemas, DTO types, the route table, the error-code enum with Norwegian messages, fixed symbol/colour lists, and pure shared rules (booking window/grid/duration, `isExpired`, `isUpcoming`, `overlaps`, `normaliseEmail`, `normaliseSearch`, `compareNb`, slot model); no I/O; one file per module; strict request schemas with string bounds; Zod error map from the catalogue. (AD-2)
- AR4: Every route is declared in the contract table with access `public|authenticated|admin`; handlers register only through `registerRoute`; S00 registers every contracted route with a 501 `NOT_IMPLEMENTED` stub in the file of the implementing slice; startup refuses unmatched routes; a route-enumeration test (401 without session, 403 for a Member on admin routes and foreign-booking actions, no 501 in the S07 integration job). (AD-3, AD-20)
- AR5: Routes and minimum contents: `GET /api/health`; `GET|POST|DELETE /api/session`; `GET|POST /api/resources`, `GET|PATCH /api/resources/:id`, `POST /api/resources/:id/archive`, `GET /api/resources/:id/schedule`; `GET|POST /api/bookings`, `GET /api/bookings/:id`, `POST /api/bookings/:id/{cancel,approve,reject}`; `GET /api/dashboard`; `GET /api/activity` (Contract Minimums table in the spine).
- AR6: Error envelope `{ error: { code, message, fieldErrors?, details? } }`; statuses 400, 401, 403, 404, 409, 421, 429, 500, 501, 503 (approved DEC-16 extension); codes and approved Norwegian messages as in `approved-copy.md`; framework errors and unknown routes use the envelope. (AD-4)
- AR7: Lists: default limit 100 max 200 with `truncated`, total-order sort, `[]` when empty; activity uses an id `before` cursor, default 20 max 100, `{ items, nextBefore }`; language-sensitive ordering in code with `compareNb`. (AD-16)
- AR8: Derived state: `BookingDto` carries only the four stored statuses plus `expired`; Kommende is `isUpcoming`, everything else Tidligere; approvable pending count includes the viewer's own request and excludes Expired. (AD-16)

**Time, transactions and booking integrity**

- AR9: Instants are epoch-ms UTC in the database and ISO UTC on the wire; booking requests carry Oslo civil `date`, `start`, `end`; one server module (`platform/oslo-time.ts`, the only Temporal import) converts; the browser uses `Intl` only; one injected Clock; `FELLES_NOW` is a start instant, refused in production; the web derives `now` from `serverNow`. Start-time operators: create/cancel/approve need `start > now`. (AD-5, AD-6)
- AR10: Every mutation is one use case in `UnitOfWork.run` (`BEGIN IMMEDIATE`, synchronous, `Tx` carries `now`); check, write and activity event in the same transaction; WAL, foreign keys, `recursive_triggers`, `busy_timeout 2000`; busy errors map to 503. (AD-7)
- AR11: Booking exclusivity enforced in the use case and by a database trigger; grid and duration CHECKs; required concurrency evidence: barrier-started HTTP burst with two Members, cross-process race, fault-injected activity writer, concurrent approvals, archive-versus-create. (AD-8)
- AR12: One lifecycle transition table with compare-and-set; check order `policy.can` then status then start; decision and cancellation columns; terminal rows frozen; write-once decision columns; immutability, no-delete and no-replace triggers; resource archive-final and no-delete; FKs `ON DELETE RESTRICT`; verified SQL in `reviews/review-data-integrity.md`. (AD-9, AD-10)
- AR13: Activity: exactly one typed event per mutating use case via `recordEvent(tx, …)`; `subject_user_id` is a branded owner id with a trigger backstop; payloads never contain purpose; seed writes events for inserted past bookings. (AD-17)

**Security**

- AR14: Opaque 32-byte session ids stored as SHA-256; absolute 12 h; cookie `felles_sid` `HttpOnly` `SameSite=Lax` `Secure` on https; scrypt (`N=2^16, r=8, p=2`, explicit `maxmem`, bounded stored parameters); dummy-hash timing parity; `normaliseEmail`; users only via seed. (AD-11)
- AR15: Login throttling: in-memory, synchronous reservation, 5 failures then 10 s doubling to 5 min, 5th failure returns 401 with `retryAfterSeconds`, 429 during the delay, global verifier limit. (AD-12)
- AR16: HTTP hardening: Origin allowlist and `Sec-Fetch-Site`, Host allowlist (421), JSON-only bodies, no CORS, CSP without `upgrade-insecure-requests`, no HSTS, `Cache-Control: no-store` on `/api`, body 16 KiB, loopback bind, remote-demo refusal. (AD-13)
- AR17: Central pure `policy.can` (S00 complete action union), object-level checks in use cases, role-scoped presenters (anonymous schedule blocks carry no id/user/purpose), actor-scoped dashboard and activity queries. (AD-14, AD-15)
- AR18: Logging: pino JSON with request id and redaction paths; no purposes or reasons logged; `GET /api/health` public. (AD-28)

**Persistence, migrations, seed**

- AR19: `better-sqlite3` through repositories only; no ORM; STRICT tables; ids `INTEGER AUTOINCREMENT`; one row mapper per entity; only the `bookings` module names `bookings`, only `activity` names `activity_events`; DB path resolved against the repo root; the temp-DB guard for tests and harnesses. (AD-1, AD-18)
- AR20: Forward-only SQL migrations `NNNN_slug.sql` with slice ranges; in-house runner (LF-normalised hash, apply every unapplied version in order, fail on checksum change); `.gitattributes` LF; schema snapshot test; S00 delivers the whole schema (users, sessions, resources, bookings, activity_events, app_meta) with all constraints and triggers; later migrations need Jo. (AD-19)
- AR21: Deterministic seed driven by the Clock, Oslo-civil grid-aligned times, past bookings inserted directly with events, an Expired pending request, rows either side of 2026-10-25 and 2027-03-28, per-slice fixture files, `data_origin = synthetic-seed`; refusal rules; `demo:reset` with liveness probe and y/N. (AD-25)

**Web and delivery structure**

- AR22: Web architecture: React Router with the Norwegian paths, TanStack Query only for server state, react-hook-form with zodResolver, `api/call` client, shared `QueryState`, session/clock/links/sheet/slot hooks in `apps/web/src/api/`, `app/` as composition root, per-module key and invalidation barrels with a complete frozen mutation map. (AD-21)
- AR23: UI kit: CSS Modules over tokens generated from `DESIGN.md` (`gen-tokens.mjs`) plus `tokens.extra.css` and `ui/timing.ts`; React Aria Components wrapped once in `ui/`; S00 owns the shell and the primitives the shell, S01 and S02 need (Button, Field, Select, Textarea, Table, ReasonDialog, ChipGroup, SegmentedControl, Timeline, BookingRow, ResourceCard, Alert, Badge/StatusBadge, Skeleton, EmptyState, Toast, Dialog/Sheet, QueryState, ResourceIcon); `useRovingGrid`, slot picker and calendar grid belong to S04; the SVG chart to S06. (AD-22)
- AR24: Language and formatting: strings under `i18n/nb/<feature>.ts`, `react/jsx-no-literals` in features and `ui`; all formatting through `i18n/format.ts`. (AD-23)
- AR25: Environments and scripts: Zod `config.ts`; single origin served by Fastify; dev proxy; Node `.mjs` scripts only; documented start `npm ci`, `npm run setup:native`, `npm run db:seed`, `npm start`; `start.mjs`, `dev.mjs`, `build-api.mjs`. (AD-24)
- AR26: Planning constraints for epics (architecture and Amendment 1): every story belongs to exactly one slice; each MUST evidence part names its `evidenceSlice` (including split API/browser evidence); `requirements.json` and the story-to-slice map are generated from the epics; test titles start with the requirement id and carry the story tag; stories carry the PIL-05 task-card fields. (AD-20, AD-26, PIL-01, PIL-05)
- AR27: Parallel-build structure: stub-first seams (`BookingActions` slot, `useBookingSheet`, `?booking=` host, route pages, nav config), `bookings` module split by owner (S00 signatures and `countFutureBlocking`, S03, S05, S06 read port, S03 presenter), `ownership.json` and `check-ownership.mjs`, `merge-gate.mjs`, `accept-slice.mjs`, `acceptance-ledger.json` with `sNN-integrated` and `sNN-accepted` tags, two-step contract freeze (F1 at S00, F2 at S03), PIL-09 contract-draft checkpoint, hello-slice dry run in S00 acceptance. (AD-20, Amendments 1 to 3)
- AR28: Verification and CI: `verify` (typecheck, lint with custom-rule fixture tests, Prettier, tokens check, tests, build), `verify:full` (+ Playwright + default trace), `verify:release` (+ `trace.mjs --release`); CI workflow on windows, ubuntu and macOS with full-history checkout; macOS runtime smoke via the real `start.mjs`; `npm audit`; non-blocking until a remote exists (it now does, PRD OQ-4 closed 2026-10-19). (AD-27)
- AR29: Testing strategy: Vitest projects, temp databases only, Playwright on the production build with per-worker servers under `FELLES_NOW=2026-10-19T07:00:00Z`, `retries: 0`, axe helper on every UI story at 375 and 1440 px, DST suites under a second `TZ`, `.skip/.todo/.only` banned, manual-evidence files for non-automatable MUSTs, S03 evidence for E2E-01/02/03/07 API-level. (AD-26)
- AR30: Epic-planning notes carried from the architecture: the Ressursdetalj availability strip depends on the S03 schedule endpoint and the S04 booking sheet (order its story after S03); the schedule endpoint is in S03 so S04 is UI-only; session resolution and `GET /api/session`, `countFutureBlocking`, `listEventsForBooking` are S00 so S02 and S03 run before S01 lands.

**Process requirements (PRD §7–§8)**

- PIL-01: Every MUST has an owner slice, at least one story and acceptance evidence recorded against a commit SHA (automated test or documented manual check).
- PIL-02/03/04: Delivery status only in the sprint-status file using native BMad states; story ledger entries `implemented`, `tested`, `reviewed` with SHA and evidence; `accepted`/`done` set only by Jo; agent completion is not acceptance; one authoritative source.
- PIL-05: Each story carries stable id, goal, requirement refs, dependencies, file/module ownership, acceptance criteria, test commands, definition of done.
- PIL-06: Agent ramp: one agent for S00; two for S01 ∥ S02 in separate worktrees; three (S04/S05/S06) only after the integration cost of two is judged; entry gate: contracts, schema, shared config frozen and approved by Jo; file-ownership partition recorded per parallel pair; S03 starts only when S01 and S02 are accepted (ORK-02).
- PIL-07: Per-story metrics in `_bmad-output/pilot-log.md` (wall clock, waiting for acceptance, agent runs, interventions, test failures, review findings, tokens/cost or `unknown`).
- PIL-08: Navigable history requirement → story → run → commit → test evidence → acceptance.
- PIL-09: No application code until Jo approves PRD, architecture, epics and the S00 contracts.
- PIL-10/11/12/13: `verify` and `verify:full`; CI parity with macOS smoke; merge gate on the exact commit; product definition of done.

### UX Design Requirements

**Tokens and foundations**

- UX-DR1: Colour tokens exactly as in the DESIGN.md front matter (surfaces, ink, lines, primary, on-dark, four status families, eight resource ink/tint pairs); light mode only; `primary` used only for action and current place; colour never the only carrier of status.
- UX-DR2: Typography: Inter self-hosted via `@fontsource-variable/inter` (offline), the stated fallback stack, the 15 type roles, sentence case, tabular numerals for times and counts, en dash in time ranges, inputs at 15 px.
- UX-DR3: Spacing and layout tokens (4 px scale, sidebar 240, rail 64, content max 1120, top bar 56, tab bar 64, sheet width 440, dialog max 440, control height 40/32), radii (6/8/12/16/full), elevation (`shadow-sm/md/lg`, overlay at 48%), motion durations (180/120 ms, skeleton delay 150 ms) in `tokens.css`, `tokens.extra.css` and `ui/timing.ts`.
- UX-DR4: Control sizing rule: every control 40 px tall below 1024 px; 32 px small variant only in dense desktop rows; half-hour calendar cells 24 px.
- UX-DR5: Responsive bands: ≥1024 sidebar, 768–1023 icon rail, <768 top bar plus five-tab bar with the Mer sheet; tested at 375 and 1440 px with no horizontal scroll; tables become cards below 768; calendar becomes week strip plus day timeline; sheets full-screen on mobile; dialogs stay centred cards.

**Shell and navigation**

- UX-DR6: App shell: skip link first ("Hopp til innhold"), `header`/`nav[aria-label]`/`main` landmarks, `lang="nb"`, document title "FELLES – {page}", one `h1` per surface, focus to the `h1` on route change, skeleton content (never a blank screen) while the session resolves.
- UX-DR7: Sidebar (wordmark, Demo pill, nav, "Administrasjon" section, user block with name and role, "Logg ut" ghost button, Godkjenninger count pill), icon rail with tooltips, top bar with title and avatar, tab bar (Hjem, Ressurser, Kalender, Bookinger, Mer) with `aria-current="page"` plus a non-colour cue, Mer button with `aria-haspopup="dialog"` and count dot.
- UX-DR8: Information architecture and Norwegian routes: `/logg-inn`, `/`, `/ressurser`, `/ressurser/:id`, `/kalender?ressurs=&uke=`, `/mine-bookinger`, `/godkjenninger`, `/ressursadministrasjon`, `/aktivitet`; Administrator-only surfaces absent from a Member's navigation and showing "Ingen tilgang" by URL; filters, query, week, resource and `?booking=` in the URL.
- UX-DR9: Overlay model: Booking sheet, Booking detail sheet (`?booking=`), Resource form sheet, Mer sheet, Reason dialog, Confirm dialog; at most one dialog on one sheet; focus moved to title, trapped, returned to the trigger; Escape closes the topmost; "Forkaste endringene?" on unsaved form sheets.

**Components**

- UX-DR10: Button variants (primary, secondary, ghost, danger, danger-outline, small), in-flight state via `aria-disabled` with spinner and unchanged label, disabled-by-state buttons keep the label and state the reason in text.
- UX-DR11: Input, Select, Textarea with visible labels, "(valgfritt)" on optional fields, `aria-required` otherwise, hints, error state with icon and text, character counters ("17/200", announced only at 180 and 200).
- UX-DR12: Form behaviour: validate on blur and submit, clear errors when valid, error summary above two errors, submit `aria-disabled` only while a required free-text field is empty, server errors rendered like client ones in an alert above the submit button that receives focus, inputs read-only while submitting.
- UX-DR13: Date field: native `input type=date` with `min`/`max` from the Oslo date of `serverNow` and the 30-day rule, day-in-words caption, prefill from context ("Book igjen" supplies resource and purpose but not date); slots beyond the horizon on the last date disabled with the approved name "klokken 14:00, utenfor bookingvinduet" and hint "Du kan booke inntil 30 døgn frem i tid."
- UX-DR14: Slot picker: 28 half-hour slots 08:00–22:00; taken and past disabled; start-then-end selection with the stated rules (30-minute minimum, 4-hour maximum, no crossing taken slots); `role="grid"` with roving tab stop, whole-word cell names, `aria-live` summary and refusal messages; "Ingen ledige tider denne dagen. Velg en annen dato."; reload keeping the purpose after a 409.
- UX-DR15: Search field (client-side filter on name, description, location; Escape clears), filter chips with `aria-pressed` and URL state, segmented control (Diagram/Tabell, remembered per browser), switch ("Krever godkjenning" with the consequence text), symbol and colour pickers as radio groups with Norwegian names and a text statement of the selection.
- UX-DR16: Status badge vocabulary (Bekreftet, Venter, Avslått, Avbestilt, Utløpt with dashed outline, Arkivert, Krever godkjenning, kind badges), text plus dot, never interactive; Utløpt replaces Venter when the request's start has passed; the same labels in filters, toasts, live regions and activity text.
- UX-DR17: Resource tile and Resource card (whole card is one link; approval badge; archived never in the catalogue), List row (tap opens the Booking detail sheet; "Avbestill" only when pending/confirmed and in the future; "Book igjen" when past or final), responsive Table to stacked cards, Stat tile, Card.
- UX-DR18: Availability strip on Ressursdetalj (28 segments, free/taken/own with legend "Ledig", "Reservert", "Din booking", accessible names per segment, not interactive).
- UX-DR19: Week grid calendar: toolbar (resource select, week title "Uke 43 · 19.–25. okt. 2026", previous / "I dag" / next), header with today marker, time gutter, now-line, today wash, blocks (own-confirmed, own-pending dashed, other "Reservert", other-pending hatched) with the exact content rules, `role="grid"` with roving tab stop and the Home/End/PageUp/PageDown keys, "Ledige tider" linear alternative, past cells `aria-disabled`.
- UX-DR20: Mobile week strip (`tablist` of seven day chips with booking dots) plus single-day timeline that reuses the calendar body and cell names.
- UX-DR21: Popover for another Member's block (non-modal `role="dialog"`, "Reservert" and time only, Escape and outside click close, focus returns), Tooltip for icon-only controls (also `aria-label`; never the only carrier of a disabled reason).
- UX-DR22: Sheet chrome (desktop right-anchored 440 px, mobile full-screen, sticky footer, scroll padding), Booking sheet, Booking detail sheet (key–value list, Begrunnelse card with attribution line, expired explanation, Historikk mini-timeline, stale-state and 403/404 handling), Resource form sheet (fields, pickers, switch, field errors with focus on the first).
- UX-DR23: Dialogs: Confirm dialog (cancel own booking, archive; "Behold" focused, destructive never pre-focused) and Reason dialog (reject, Administrator cancel; Begrunnelse 1–200 characters, "Begrunnelsen vises til {name}", initial focus in the field, submit `aria-disabled` until text); approving needs no confirmation.
- UX-DR24: Toast (one at a time, `role="status"`, 4 s plain, persistent when it carries a link or button, "Lukk" button, pause on hover/focus, bottom-right desktop and above the tab bar on mobile), inline Alert (error, warning, info, success; "Prøv igjen" on network/5xx; next step on 409).
- UX-DR25: Empty states (icon, heading, one sentence, one action) and Skeletons (mirror the layout, appear after 150 ms, no layout jump, no shimmer under reduced motion); Timeline (day eyebrow, actor in strong, entity links to the Booking detail sheet or Ressursdetalj, "Vis flere"); Bar chart (seven stacked columns, confirmed `primary`, pending dashed `warning`, `role="img"` with `aria-label`, Tabell alternative); Demo pill; Avatar.

**State patterns, content and accessibility**

- UX-DR26: State Patterns for every surface exactly as the table in EXPERIENCE.md (loading, empty, failed/refused, notes), including: 401 session expiry message, 403 "Ingen tilgang" page, 404 messages, offline top alert with mutations disabled, no optimistic updates, login failure message above the button and the 10-second countdown after five failures, pending count with "+ 1 utløpt", archive refusal alert with "Se bookinger".
- UX-DR27: Voice and tone and formats: plain bokmål, no exclamation marks or emoji, buttons are verbs, error messages say what happened then what to do; date, time, duration and attribution formats; whole-word accessible variants ("1 time 30 minutter"); stored English values never reach the UI or accessible names.
- UX-DR28: Accessibility floor (WCAG 2.2 AA): visible 2 px focus ring everywhere (white ring on the toast), focus never dropped (`aria-disabled`), sticky bars never cover focus (scroll padding 56/64 px), required convention, no drag, reduced motion honoured, ARIA grids with linear alternatives, chart text alternative; testing bar for S07: axe clean on all eight surfaces at 375 and 1440, E2E-10 keyboard walk, screen-reader pass of Slot picker, Calendar grid and Booking detail sheet.
- UX-DR29: Interaction primitives: click or tap only (no drag), no hover-only affordances, Enter submits single-line forms, banned patterns (infinite scroll, pagination controls, auto-refresh moving content, deeper modal stacks, confirmation for non-destructive actions, browser `alert()`/`confirm()`).
- UX-DR30: Key flows as acceptance narratives: Flow 0 sign-in and expiry/sign-out variants; Flow 1 instant booking with calendar variant and conflict/validation failures; Flow 2 approval request; Flow 3 approve with double-processing and own-request failures; Flow 4 reject with Expired variant; Flow 5 cancel with Administrator variant and the past-start guard; Flow 6 resource create, refused archive and successful archive.
- UX-DR31: Approved UI copy and error copy from `approved-copy.md` plus the Norwegian symbol and colour names (Personer, Skjerm, Dør, Presentasjon, Projektor, Kamera, Mikrofon, Penn, Bærbar, Hodetelefoner; Blå, Grønn, Lilla, Oransje, Rosa, Blågrønn, Gul, Grå).

### FR Coverage Map

```
AUT-01: Epic 2 - e-mail/password login, generic error
AUT-02: Epic 2 - session required, logout, no unauthenticated reads
AUT-03: Epic 2 - server-enforced roles (policy in S00, role tests S01/S02, extended per slice)
AUT-04: Epic 2 - name and role shown, session survives refresh (shell in Epic 1)
RES-01: Epic 3 - browse, search, filter, detail
RES-02: Epic 3 - resource fields, fixed symbol and colour lists, optional seats
RES-03: Epic 3 - Administrator create/edit with field errors
RES-04: Epic 3 - archive guard (S02), archived not bookable (Epic 4)
RES-05: Epic 3 - approval indicator in list
BOK-01: Epic 4 - create booking (API S03, UI S04)
BOK-02: Epic 4 - window, grid, duration, horizon rules
BOK-03: Epic 4 - no overlap among blocking bookings
BOK-04: Epic 4 - atomic conflict control under concurrency
BOK-05: Epic 4 - confirmed versus pending by approval requirement
BOK-06: Epic 5 - cancellation by owner/Administrator with reason
BOK-07: Epic 4 - availability display and clear responses
BOK-08: Epic 4 - rebook from earlier booking
APP-01: Epic 5 - pending queue incl. Expired marked, reject only
APP-02: Epic 5 - approve/reject, reason, not own request
APP-03: Epic 5 - no double processing, approval after start refused
APP-04: Epic 5 - slot freed on rejection, Member sees reason
VIS-01: Epic 4 - week calendar with anonymous Reservert blocks
VIS-02: Epic 4 - Mine bookinger (cancel action supplied by Epic 5)
VIS-03: Epic 6 - start page, Administrator pending count (Expired excluded)
VIS-04: Epic 6 - seven-day Administrator overview and top three
VIS-05: Epic 6 - activity log scoped by role (writer in Epic 1, events by each mutating epic)
VIS-06: Epic 6 - activity chart with text alternative
BR-1: Epic 1 (helpers), Epic 4 (DST and UTC tests)
BR-2: Epic 3 (creation), Epic 4 (booking), Epic 5 (approval)
BR-3: Epic 4 and Epic 5 - bookings never overwritten or deleted
BR-4: Epic 1 (error format and envelope), every epic (validation)
BR-5: Epic 1 (writer), each mutating epic (event in same transaction), Epic 6 (reader)
BR-6: Epic 2 (enforcement), Epic 7 (route-enumeration test)
UI-1: Epic 2 (Login), Epic 3 (Ressurser, Ressursdetalj, Ressursadministrasjon), Epic 4 (Kalender, Mine bookinger), Epic 5 (Godkjenninger), Epic 6 (Hjem, Aktivitet)
UI-2: Epic 1 (shell, nav, responsive layout), Epic 7 (verification at 375 and 1440 px)
UI-3: every UI epic (axe per story), Epic 7 (verification)
UI-4: Epic 1 (state components), every UI epic
UI-5: Epic 1 (formatters, i18n structure), every UI epic
SEED-1: Epic 1 - deterministic demo data
SEED-2: Epic 1 - demo:reset (optional)
RUN-1: Epic 1 - one start command, frozen contracts, workspaces
NFR-01: Epic 1 (portable scripts, CI matrix), Epic 7 (macOS smoke evidence)
NFR-02: Epic 1 (gate), every epic enforces
NFR-03: Epic 2 and 3 (roles), Epic 4 (collision, concurrency, UTC/local), Epic 5 (transitions), Epic 7 (verification)
NFR-04: Epic 2 (cookies, CSRF, throttling), Epic 1 (config and hardening plumbing)
NFR-05: Epic 1 (README skeleton), Epic 7 (final fresh-clone check)
NFR-06: Epic 7 - responsive local lookups
E2E-01: Epic 4 (API S03, browser S04)
E2E-02: Epic 4 (API S03, browser S04)
E2E-03: Epic 4 (S03)
E2E-04: Epic 5 (API), Epic 7 (browser)
E2E-05: Epic 5 (API incl. Expired and BOOKING_STARTED), Epic 7 (browser)
E2E-06: Epic 5 (API), Epic 7 (browser)
E2E-07: Epic 2 (first), extended in Epics 3, 5, 6; Epic 7 (final sweep)
E2E-08: Epic 3 (create/edit/archive and guard), Epic 4 (archived not bookable), Epic 7 (browser)
E2E-09: Epic 5 (API), Epic 7 (browser)
E2E-10: Epic 7
```

Every one of the 41 functional items, 6 NFRs and 10 E2E scenarios appears above. Coverage of the 30 architecture requirements and 31 UX design requirements by epic (finer allocation to stories happens in step 3):

```
AR1, AR2, AR3, AR4, AR5, AR6, AR7, AR8, AR9, AR10, AR19, AR20, AR21, AR22, AR23, AR24, AR25, AR26, AR27, AR28, AR29, AR30 (structure): Epic 1
AR11, AR12, AR13 (booking integrity, lifecycle, activity events): Epics 4 and 5 (schema, triggers and writer in Epic 1)
AR14, AR15, AR16, AR17, AR18 (sessions, throttling, HTTP hardening, policy, logging): Epic 2 (plumbing in Epic 1)
AR28 macOS smoke and verify:release: Epic 7
UX-DR1-UX-DR9, UX-DR10-UX-DR12, UX-DR16, UX-DR24-UX-DR25 (tokens, shell, primitives, states): Epic 1
UX-DR13, UX-DR14, UX-DR18, UX-DR19, UX-DR20, UX-DR21, UX-DR22 (Booking sheet, detail sheet, slot picker, calendar): Epic 4
UX-DR15 (search, chips, switch, pickers), UX-DR17 (cards, table), Resource form sheet part of UX-DR22: Epic 3
UX-DR23 (Reason and Confirm dialogs), UX-DR26 rows for Godkjenninger: Epic 5
UX-DR25 (Timeline, Bar chart), UX-DR26 rows for Hjem and Aktivitet: Epic 6
UX-DR26-UX-DR31 (state patterns, voice, accessibility floor, key flows, copy): every epic; verification in Epic 7
```

## Epic List

#

## Epic 1: A runnable, verified FELLES with frozen contracts

The pilot owner and every later agent can install, seed, start and verify FELLES locally on Windows and macOS: three workspaces, the complete frozen contract set and schema, the app shell with navigation and states, the design-token UI kit, the activity-event writer, deterministic demo data, and the verification, ownership and merge-gate tooling. Slice S00, built by one agent on `slice/s00` (PIL-06).

**Preconditions (not stories):** Jo has approved the PRD, the architecture and this document (PIL-09), has installed Node 24 LTS, and has instructed the fast-forward of `planning/felles` into `main`, which happens immediately before Story 1.1 begins and after the planning artifacts are final and committed. The GitHub remote exists, and Jo's approval for the merge gate to push to it (PIL-11) is recorded once in the pilot log. PRD OQ-2 (who writes ledger, sprint-status and pilot-log entries) is resolved by the delivery-ledger script of Story 1.23, which a human or Agent Orchestrator can drive.

**Gates and bootstrap.** Gate S00-CP (Jo's contract checkpoint after Stories 1.2–1.7, the "1.4-CP" of the decision log) must be passed before Story 1.8 begins. Stories 1.1–1.29 are verified with `npm run verify` and their own tests because the merge-gate tooling does not exist yet; Story 1.30 performs the first real run of the gate, landing S00 on `main` as a whole slice, and Jo then accepts S00. The spec's tasks map as T00-01 = Story 1.1, T00-02 = Stories 1.2–1.7 and T00-03 = the remaining stories.

**Justified exceptions.** (1) Story 1.7 creates the whole schema although the skill prefers tables when needed: the schema is a frozen cross-slice contract (AD-19, PIL-06), its constraints and triggers are reviewable only as a unit, SEED-1 needs every table, and per-slice migration ranges would otherwise collide. (2) Epic 1 is a technical foundation epic: the project is greenfield with no starter template, S00 was enlarged by a deviation from PRD 4.0 that Jo approved, and PIL-06 requires frozen contracts before parallel agents start. Stories 1.19–1.25 are delivery controls for the pilot, not product features.

### Story 1.1: Scaffold the workspaces and a green verify gate on a clean install

As the pilot owner,
I want a clean checkout that installs and passes the full verification gate on an empty skeleton,
So that every later change is checked by the same gate from the first commit.

**Acceptance Criteria:**

**Given** `main` containing the planning artifacts and a clean clone on Windows 11 with Node 24 LTS
**When** `slice/s00` is created and `npm ci`, `npm run setup:native` and `npm run verify` are run
**Then** the three workspaces `apps/web`, `apps/api` and `packages/contracts` install, `better-sqlite3` loads, and typecheck (TypeScript 6.0.3), lint, tests and production build all pass on the empty skeleton
**And** the exact Node and npm minor versions are recorded in a stack note together with the verified idioms for React Router 8, Vitest 5, Vite 8 and ESLint 9.

**Given** the root configuration
**When** it is inspected
**Then** `.nvmrc`, `engines` (`^24.15.0 || >=26.0.0`, npm `>=11.12`), `engine-strict`, `.npmrc` (`save-exact`, `ignore-scripts`), `.gitattributes` (`* text=auto eol=lf`), Prettier `endOfLine: lf`, `.env.example` and a `.gitignore` covering `.env`, `data/` and `*.db*` exist and the lockfile is committed
**And** `npm run setup:native` rebuilds only the packages that need an install script.

**Given** the ESLint configuration
**When** a fixture file violates each custom rule (layer imports from the diagram including `ui → i18n` and `api/links`, `api → i18n/format` and never `api → ui`, template literals with expressions passed to `prepare`/`exec` (`[NFR-04]` parameterised SQL), `Date.now()`/`new Date(arg)` bans, SQL outside repositories, table-name rule, `OR REPLACE`, async `UnitOfWork.run`, `.skip/.only/.todo`, `react/jsx-no-literals`, `react/no-danger`, `LIKE`/`ORDER BY name`, session inserts outside the test helper)
**Then** lint fails with the expected rule for each fixture and passes on the compliant twin, in a test titled `[NFR-02] verify gate rejects a violation`
**And** `--max-warnings 0` is enforced.

**Given** an unsupported Node version (for example 25.x)
**When** `npm ci` is run
**Then** the install is refused with a message naming the supported range.

### Story 1.2: Shared rules, normalisers and approved messages in contracts

As a build agent,
I want the pure booking rules, derived-state helpers, slot model and the approved Norwegian message catalogue in one package,
So that the API and the web apply identical rules and texts.

**Acceptance Criteria:**

**Given** civil strings for date, start and end
**When** the window, grid, duration and end-after-start rules run
**Then** 08:00–22:00, :00/:30, 30 minutes to 4 hours and end after start are enforced on the strings alone, with strict regexes before any date library
**And** each rule is covered by tests titled `[BOK-02]` including 07:30, 22:30, 08:15, 4 h 30 min and equal start/end.

**Given** the pure helpers
**When** `isExpired`, `isUpcoming`, `overlaps`, `canCancel` and `canApprove` are tested at `start == now`, `start == now ± 1 ms` and for each status
**Then** `isExpired` is `pending` and `start <= now`, `isUpcoming` requires `pending`/`confirmed` and `start > now`, and `overlaps` is half-open so 10:00–11:00 and 11:00–12:00 do not overlap
**And** the 30 × 24 h horizon check accepts a start at exactly `now + 30 × 24 h` and refuses one millisecond later, and the 7 × 24 h window is `end > now AND start < now + 7 × 24 h` with both boundaries excluded.

**Given** `normaliseEmail`, `normaliseSearch` and `compareNb`
**When** tested with mixed case, trailing spaces, fullwidth forms, æ/ø/å and `Aa`
**Then** e-mails are trimmed, NFKC-normalised and lower-cased, search is folded for nb-NO, and `compareNb` orders Æ < Ø < Å with `id` as the final tie-break.

**Given** the error-code enum and message catalogue
**When** compared with `approved-copy.md`
**Then** every approved code has exactly the approved Norwegian message, count-bearing messages are functions of `details` with correct singular and plural, and a Zod error map installs the catalogue
**And** `contracts` imports nothing from the apps and contains no I/O or `Temporal` import.

**Given** the slot model (`availability.ts`)
**When** `buildSlots`, `freeRanges` and `validateSelection` run on schedule blocks, a civil date and the Oslo parts of now
**Then** 28 slots are marked free, taken, past or beyond the 30-day horizon, adjacent blocks leave their neighbouring slots free, consecutive free slots merge into ranges, and selections are refused with codes for crossing a taken slot, exceeding 4 hours and end before start
**And** the slot picker, the availability strip and the "Ledige tider" list use only these functions.

### Story 1.3: Clock, Oslo time, configuration and logging

As a build agent,
I want one injectable clock, one Temporal module, one parsed configuration and one logger,
So that time, environment and log hygiene behave identically in the server, the seed and every test.

**Acceptance Criteria:**

**Given** `platform/oslo-time.ts`
**When** Oslo civil values are converted
**Then** 2026-10-19 10:00 gives 08:00Z, 2026-10-26 10:00 gives 09:00Z and 2027-03-28 10:00 gives 08:00Z, unreachable DST wall times map to a validation error, and `osloDayRange`/`osloWeekRange` give 25 h and 23 h days on 2026-10-25 and 2027-03-28
**And** `temporal-polyfill` is imported nowhere else.

**Given** `FELLES_NOW`
**When** it is parsed
**Then** a value with `Z` or an offset sets the start instant and the clock keeps advancing, a value without an offset or under `NODE_ENV=production` is refused, and a fixed or steppable `Clock` can be injected into every consumer (exercised through the `Clock` type in tests)
**And** `Date.now()` and argument-less `new Date()` appear only in `platform/clock.ts` and `apps/web/src/api/clock.ts`.

**Given** the configuration module
**When** the environment is parsed
**Then** every `FELLES_*` variable and `NODE_ENV` of AD-24 is validated by Zod with the documented defaults, origins are exact strings, and a non-loopback `FELLES_HOST` is refused while synthetic data exists unless `FELLES_ALLOW_REMOTE_DEMO=1`
**And** the DST tests run under a second `TZ` to prove machine-zone independence.

**Given** the logger
**When** a record containing `cookie`, `authorization`, `set-cookie`, `password`, `passwordHash`, `token` or a request body is logged
**Then** those paths are redacted by the AD-28 `redact.paths`, every line carries a request id, and `pino-pretty` is used only in development
**And** the logger writes no booking purposes or reasons.

### Story 1.4: The complete route and DTO contract set

As the pilot owner,
I want every route, request, response and error code defined once before any slice builds on them,
So that parallel agents cannot invent incompatible shapes.

**Acceptance Criteria:**

**Given** the Contract Minimums table of the architecture
**When** the route table is written
**Then** every route has method, path, `access`, params/query/body/response schemas, owner slice and error codes, with strict request schemas, string bounds, `limit` rules and the activity `before` cursor
**And** list responses are `{ items, truncated }` (activity `{ items, nextBefore }`).

**Given** every string field of every request schema
**When** values with surrounding spaces, non-NFC forms, control characters, bidi overrides and `""` for an optional field are sent
**Then** values are trimmed and NFC-normalised, control and bidi characters are rejected, `""` becomes `null`, and each field's maximum length is enforced (email 254, name 80, description 500, purpose 200, reason 200) (`[BR-4]`)
**And** unknown keys are rejected on every request schema.

**Given** the DTOs
**When** they are reviewed against EXPERIENCE.md
**Then** `BookingDto` carries the four stored statuses, `expired`, `decision` and `cancellation`, the schedule block is a `detail | anonymous` union discriminated by `kind`, the dashboard has `admin: null | {…}` with the 7-entry chart, and the symbol and colour lists equal DESIGN.md
**And** a round-trip test parses a canonical sample of every DTO, in one file per contract file under `packages/contracts/test/`.

**Given** the barrel
**When** it is built
**Then** `index.ts` re-exports every module file, `schedule.ts`, `activity.ts` and `dashboard.ts` exist as drafts that S03 finalises, and the contracts folder has no import from the apps.

**Given** the contract draft is complete
**When** `npm run contracts:summary` runs
**Then** it writes `contracts-summary.md` listing every route (method, path, access, owner slice, error codes), every DTO with its fields and the SHA-256 content hash of `packages/contracts/src`
**And** the file is the review package for Gate S00-CP.

### Story 1.5: Database platform, AppError and the unit of work

As the pilot owner,
I want one way to open the database and run a mutation, with errors that map to the contract,
So that every slice writes safely and uniformly.

**Acceptance Criteria:**

**Given** `openDatabase()`
**When** it opens a file
**Then** WAL is asserted, `foreign_keys` and `recursive_triggers` are on, `busy_timeout` is 2000, the default development path is refused under test (using `config.nodeEnv` and `config.isVitest`), and a relative `FELLES_DB_PATH` resolves against the repository root and is logged absolute
**And** `openDatabase()` is the only constructor of `Database` (lint).

**Given** `UnitOfWork.run`
**When** a callback throws, returns a Promise, or the write lock is held by another process beyond the timeout
**Then** the transaction rolls back, a Promise-returning callback is rejected by type and lint, and the lock case is raised as `AppError` `DATABASE_BUSY` (503 with `Retry-After: 1`)
**And** `Tx` is unusable after the callback returns and carries `now` from the injected Clock.

**Given** `platform/app-error.ts`
**When** an `AppError` is constructed with a contract code and `details`
**Then** the status and the approved message come from the catalogue, unknown codes do not compile, and a `SqliteError` whose code starts with `SQLITE_BUSY` or `SQLITE_LOCKED` maps to `DATABASE_BUSY` while unknown trigger messages map to `INTERNAL`.

**Given** `apps/api/test/temp-db.ts`
**When** a test needs an isolated database
**Then** it returns `{ path, db, dispose }` over a temp directory, `dispose` closes the connection, awaits every spawned child's exit and calls `rmSync` with retries, and the guard refuses the development path
**And** children are always started through `process.execPath` and killed on test failure.

### Story 1.6: Migration runner and schema snapshot harness

As the pilot owner,
I want migrations applied deterministically on every platform,
So that no developer's line endings or branch order can corrupt the schema.

**Acceptance Criteria:**

**Given** fixture migrations in CRLF and LF form
**When** the runner applies them
**Then** it strips a BOM, normalises line endings, hashes and executes the normalised text as a whole file, and rejects transaction-control statements or `PRAGMA` outside trigger bodies
**And** the stored checksum is identical for both forms.

**Given** three processes racing to migrate the same fresh database
**When** they run
**Then** the schema is applied once, every unapplied version applies in ascending order inside one immediate transaction that re-reads `schema_migrations`, and an out-of-order lower version arriving later is still applied
**And** a changed checksum or a recorded version without a file fails startup with a clear message.

**Given** the snapshot harness
**When** a migrated database is dumped
**Then** the schema snapshot is generated from `sqlite_master`, compared after normalisation with the committed snapshot, and an `EXPLAIN QUERY PLAN` assertion helper exists for later stories.

### Story 1.7: The whole schema, triggers and probe suite

As the pilot owner,
I want the full schema, its constraints and its triggers in place and proven,
So that no slice can create an overlap, rewrite history or bypass a rule at the database level.

**Acceptance Criteria:**

**Given** migrations 0001–0099
**When** they run on an empty database
**Then** `users`, `sessions`, `resources`, `bookings`, `activity_events` and `app_meta` exist as `STRICT` tables with `INTEGER AUTOINCREMENT` ids, epoch-ms `*_at` columns, `NOT NULL` enum columns with CHECKs, `ON DELETE RESTRICT` foreign keys, the plain `(resource_id, status, start_at)` index, and the AD-9 column names (`decided_by_user_id`, `decision_reason`, `cancelled_by_user_id`, `cancel_reason`)
**And** `EXPLAIN QUERY PLAN` shows the overlap query using that index.

**Given** the verified SQL in `review-data-integrity.md`
**When** the probe suite runs
**Then** overlaps, illegal transitions, terminal-row edits, decision-column rewrites, approval without approver, `INSERT OR REPLACE`, deletes, un-archiving, resource deletes, a mismatching event subject, off-grid and over-long bookings are all rejected
**And** approve, reject of an Expired request, cancel by an Administrator with a reason and adjacent bookings succeed (`[BR-3]`).

**Given** the schema snapshot
**When** it is committed
**Then** the snapshot test from Story 1.6 passes and any later schema change shows as a diff
**And** the schema content hash is written to `contracts-summary.md` for Gate S00-CP.

### Gate S00-CP: Jo's contract checkpoint

As the pilot owner,
I want to review the contract draft and the schema before further work is built on them,
So that parallel agents inherit contracts I have approved (PIL-09).

**Acceptance Criteria:**

**Given** Stories 1.2–1.7 are complete and `npm run verify` is green
**When** the checkpoint package is assembled
**Then** it contains `contracts-summary.md` (route table, DTO list, contracts content hash), the schema snapshot and its hash, the approved copy, and the list of open design questions
**And** no story from 1.8 onward starts before Jo's decision is recorded.

**Given** Jo reviews the package
**When** Jo approves or requests changes
**Then** the decision, the contracts content hash and the schema hash are recorded in `_bmad-output/pilot-log.md`, and requested changes are made and re-presented until approved
**And** this approval is the PIL-09 reading accepted for S00.

**Given** later S00 stories change `packages/contracts` or the migrations
**When** the freeze package is built in Story 1.30
**Then** the hashes equal the approved ones, or the diff is listed and re-approved by Jo.

**Given** the checkpoint package
**When** it is assembled
**Then** it also lists what no source fixes, for Jo to approve or amend: the toast texts "Ressursen er opprettet.", "Ressursen er lagret." and "Ressursen er arkivert.", the slot-picker refusal texts, the `?ny=1` address parameter, and the AD-5 reading that a booking must start strictly after now (`start > now`) where the PRD default DEC-08 says `start ≥ now`
**And** the approval is tracked in the pilot log, and later in the delivery ledger by `ledger.mjs backfill` (Story 1.23); sprint-status carries no gate key and no `blocked` status. The agent stops at the checkpoint and starts no story from 1.8 onward until Jo has explicitly approved in a message that is recorded in the pilot log (an approval is never inferred from a task notification, a subagent report or silence); PIL-09 is evidenced by the pilot-log entry, outside the trace check.

### Story 1.8: Route registration kernel with stubs

As a build agent,
I want every contracted route registered through one helper with its access rule and a stub,
So that no route is unguarded and every slice only fills in a handler.

**Acceptance Criteria:**

**Given** `registerRoute(contract, handler)`
**When** a request arrives
**Then** access is checked first (401 `UNAUTHENTICATED`, 403 `FORBIDDEN`), input is parsed with the strict schemas, and results and `AppError` are mapped to the envelope with the approved status codes
**And** malformed JSON, 413, 415, unknown paths and framework errors use the envelope without echoing parser or SQLite messages (`[BR-4]`).

**Given** the contract table
**When** the app starts
**Then** every contracted route is registered with a `NOT_IMPLEMENTED` (501) stub in the file of its owning slice: `modules/auth/routes.ts` (S01: login, logout), `modules/resources/routes.ts` (S02), `modules/bookings/routes.ts` (S03: create, list, get, schedule), `modules/bookings/transitions.routes.ts` (S05: approve, reject, cancel), `modules/dashboard/routes.ts` and `modules/activity/routes.ts` (S06), while `GET /api/health` is an S00 handler and `GET /api/session` is registered as a stub until the session plugin replaces it
**And** startup fails if a route has no handler or a handler is registered outside the table, and stubs are reached only after the access check.

**Given** the route-enumeration test
**When** it walks the table with no session and with a Member session (a cookie stub built inline for this test; the real-session variant is added when sessions exist)
**Then** every non-public route answers 401 and every `admin` route answers 403 for a Member, and the test has a switch that fails if any route still answers 501 (used by the S07 integration job)
**And** the test never asserts 501 as correct behaviour.

**Given** `apps/api/src/server.ts` and `app-factory.ts`
**When** a test or the server builds the app
**Then** `buildApp({ config, db, clock })` builds it over a `temp-db` database in tests and over the configured database in `server.ts`, and `server.ts` boots config, database, migrations and listener in that order.

### Story 1.9: HTTP hardening, static serving and request logging

As the pilot owner,
I want the server hardened and serving the built app from one origin,
So that the local demo is safe by default and behaves like production.

**Acceptance Criteria:**

**Given** a non-GET request
**When** it has a missing, `null` or foreign `Origin`, or a `Sec-Fetch-Site` other than `same-origin`
**Then** the response is 403 `ORIGIN_REFUSED`, and a wrong `Host` gives 421 `HOST_REFUSED` checked first
**And** a bodyless contract accepts `{}` or an empty body, rejects keys, and allows `application/json` bodies only.

**Given** any response
**When** headers are inspected
**Then** `/api/**` carries `Cache-Control: no-store`, the CSP equals the AD-13 string exactly with no `upgrade-insecure-requests` and no HSTS, hashed assets are `immutable` and `index.html` is `no-cache`
**And** `bodyLimit` is 16 KiB and `requestTimeout` 15 s.

**Given** the built web app
**When** `GET /ressurser` is requested
**Then** `index.html` is served, `GET /api/unknown` returns the 404 envelope, `GET /assets/missing.js` returns 404, and no sourcemaps or files outside `apps/web/dist` are reachable
**And** the server binds `127.0.0.1` by default.

**Given** `FELLES_HOST` is not a loopback address and `app_meta.data_origin` is `synthetic-seed`
**When** the server starts
**Then** it refuses to start with a clear message unless `FELLES_ALLOW_REMOTE_DEMO=1`, and logs a warning on every start when it is set
**And** a loopback host starts normally.

**Given** request logging
**When** a failed login and a 500 are logged
**Then** no password, `felles_sid` or booking purpose appears, and `DATABASE_BUSY` logs at `warn`
**And** the request id appears on every line.

### Story 1.10: Password hashing, session resolution and policy

As a build agent,
I want hashing, session lookup and the permission rules implemented once,
So that Epics 2 and 3 can run in parallel without waiting for each other.

**Acceptance Criteria:**

**Given** `platform/password.ts`
**When** a password is hashed and verified
**Then** scrypt (`N=2^16, r=8, p=2`, explicit `maxmem` 256 MiB) produces `scrypt$N$r$p$salt$hash`, verification honours stored parameters inside `N 2^12…2^17, r 8…16, p 1…4` and rejects others, comparison is constant-time, and the test profile uses `N=2^12`
**And** a startup-built dummy hash gives unknown users the same cost.

**Given** the session plugin
**When** a request carries `felles_sid`
**Then** the cookie value is hashed with SHA-256, the session row and the user's current role are read from the database, expiry is a pure comparison against the Clock, and `GET /api/session` returns `{ user, serverNow, demoData }` with no 401 for anonymous callers
**And** expired rows are purged by a timer started by the plugin and never on a read.

**Given** `sessions.repository` and `session.service`
**When** S01 needs them
**Then** the repository exposes `insert`, `deleteByHash` and `purgeExpired`, and the service exposes `issue` and `revoke`, all typed and tested against a temp database
**And** the route-enumeration test of Story 1.8 gains its real-session variant using `mintSession` for a Member and an Administrator.

**Given** `policy.can`
**When** the complete action union (`resource:create|update|archive`, `booking:read|create|cancel|approve|reject`) is tested for Member, Administrator, owner and non-owner
**Then** it implements the rules of AD-14 including no self-approval, as a pure function in `auth/domain/policy.ts` exported through `auth/index.ts`.

**Given** `mintSession(db, userId)` in `apps/api/test/clients.ts`
**When** a test needs an authenticated Member or Administrator
**Then** a session row is inserted and a cookie plus `Origin` header are returned without calling login
**And** a lint rule bans inserting into `sessions` anywhere else in tests, so the helper is the only way S02 and S03 tests authenticate.

### Story 1.11: Activity-event writer and cross-slice seam signatures

As a build agent,
I want the audit writer and the signatures other slices call fixed and tested,
So that every mutation records exactly one event and parallel slices never edit each other's files.

**Acceptance Criteria:**

**Given** `recordEvent(tx, { type, actorUserId, bookingId?, resourceId?, subjectUserId, payload })`
**When** each event type is written
**Then** the payload is validated against its contract schema, `at` equals `tx.now`, `subjectUserId` is a branded `BookingOwnerId` (null for resource events), and the database trigger rejects a mismatching subject
**And** a payload containing `purpose` is rejected.

**Given** a transaction that throws after the change but before commit
**When** it rolls back
**Then** neither the change nor the event exists (`[BR-5]`).

**Given** the cross-slice seams
**When** they are inspected
**Then** `activity/index.ts` exports `recordEvent` and `listEventsForBooking`, `bookings/index.ts` exports `countFutureBlocking` (implemented and tested against directly inserted rows), `presentBooking`/`presentBlock` signatures (typed stubs in `bookings.presenter.ts`, an S03-owned file created by S00) and re-exports the typed `BookingsReadPort` from `bookings-read.repository.ts` (an S06-owned stub created by S00 that enumerates `listUpcomingForUser`, `countPendingApprovable`, `countConfirmedInWindow`, `topResourcesInWindow` and `chartBuckets` with stub bodies), `modules/resources/index.ts` is a typed S02 stub exporting `getResource(dbOrTx, id)` and `listSummaries(dbOrTx, ids)`, and the repository signature sets sit in `bookings.repository.ts` (S03), `booking-transitions.repository.ts` (S05) and `bookings-read.repository.ts` (S06), each created by S00 so no slice edits `bookings/index.ts`
**And** the table-name lint rule passes with `activity` naming only `activity_events` and `bookings` naming only `bookings`.

### Story 1.12: Deterministic demo data and reset

As the pilot owner,
I want realistic, clearly synthetic demo data that is identical on every run for a given clock,
So that I can demonstrate FELLES and tests can rely on it.

**Acceptance Criteria:**

**Given** `npm run db:seed` on an empty database with the reference clock `2026-10-19T07:00:00Z`
**When** it finishes
**Then** there are 8 resources (4 rooms, 4 equipment, at least 2 approval-required), 4 users (2 Administrators, 2 Members, scrypt-hashed passwords, development credentials documented as such), at least 18 bookings with varied status and times around the week, linked activity events with past timestamps, an Expired pending request, and rows either side of 2026-10-25, in a test titled `[SEED-1]` asserting the counts and the named flow fixtures below (the EXPERIENCE.md flows are the contract; where the UX content-pack mock differs, the flows win): users Ingrid Haugen and Jonas Dahl (Members), Magnus Berg and Sofie Lund (Administrators); nine resources: rooms Fjellet (8 seats), Fjorden, Skogen and Lysgården (approval required), equipment Projektor Epson, Kamera Sony A7 (approval required), Podkast-sett (approval required) and an active "Gammel projektor" with no future bookings, plus an archived "Gammelt lydanlegg"; Flow 1: on Fjellet a confirmed 09:00–09:30 "Standup" by Jonas today and nothing else today; Flow 3: pending Lysgården workshop by Jonas (Thursday 09:00–12:00), pending Kamera Sony A7 by Magnus (Friday 08:30–10:30), and an Expired pending Lysgården "Morgenmøte" by Jonas (Monday 08:00–09:00); Flow 4: pending Kamera Sony A7 by Ingrid (Friday 11:00–13:00); Flow 5: confirmed Skogen by Ingrid tomorrow 14:00–15:00 and confirmed Fjellet by Jonas on Wednesday 10:00–11:00; Flow 6: confirmed Fjorden by Sofie tomorrow 09:00–09:30; the Podkast-sett request of Flow 2 is created by the test, not seeded
**And** every start and end derives from Oslo civil values on the grid and passes every trigger.

**Given** a seeded database
**When** `db:seed` runs again, or runs against a database with non-synthetic users, in production, or while the port is listening
**Then** it is a no-op with a message, or refuses with a clear message, respectively
**And** `app_meta.data_origin` is `synthetic-seed` and `GET /api/session` reports `demoData: true`.

**Given** `apps/api/test/booking-fixtures.ts`
**When** a slice test needs a booking in any state
**Then** `insertBooking(db, { resourceId, userId, startAt, endAt, status, purpose, decision?, cancellation?, withEvent })` writes the row and, when asked, its event through `recordEvent` with `tx.now` set to the row's instant, passes every trigger, and covers every status including an Expired pending request, an Administrator-cancelled booking with reason and an in-progress booking from yesterday (the seed also holds rejected, cancelled and past bookings with linked events so that at least 18 bookings vary in status and time)
**And** slices import the helper and do not edit it.

**Given** `npm run demo:reset`
**When** it is run with the server stopped
**Then** it warns, asks y/N (or accepts `--force`), probes with `BEGIN EXCLUSIVE`, deletes `felles.db`, `-wal` and `-shm`, and reseeds
**And** while the server runs it refuses with "Stopp serveren først".

**Given** the per-slice fixture index
**When** a later slice needs scenario data
**Then** it builds it in its own test helpers over the minimal base seed and does not edit the seed.

### Story 1.13: Web data layer, strings and formatting

As a build agent,
I want one API client, one set of query-key factories, one set of strings and one set of formatters,
So that all features fetch, invalidate, word and format the same way.

**Acceptance Criteria:**

**Given** `api/call(contract, input)`
**When** a request succeeds, fails with the envelope, or the network fails
**Then** the response is parsed with the contract schema, the envelope becomes a typed `ApiError`, a failed fetch is `kind: "network"`, bodyless mutations send `{}`, mutations never retry, and queries retry never for 4xx and once for network/5xx
**And** on `UNAUTHENTICATED` after a user existed, on logout, and when `GET /api/session` returns another user id it clears the query cache, closes overlays and routes to `/logg-inn` with the matching message.

**Given** `api/keys/<module>.ts` and `api/invalidation/<module>.ts`
**When** the barrels are inspected
**Then** one file exists for every module including `booking-actions`, every mutation contract has an invalidation entry written in this story (a test derives this from the route table), any booking mutation invalidates bookings, dashboard and activity, any resource mutation invalidates resources, dashboard, schedule and activity, and `invalidateQueries` is lint-banned in features
**And** `usePendingCount()` exists as a stub returning `null`.

**Given** `i18n/format.ts`
**When** dates, times, durations, relative times and ISO weeks are formatted
**Then** nb-NO and `Europe/Oslo` are used, "i dag"/"i morgen" appear when true, time ranges use an en dash, accessible variants use whole words ("1 time 30 minutter"), and the Oslo parts of an instant are derived with `Intl` only (`[UI-5]`)
**And** `i18n/nb/<feature>.ts` files, including `common` and `booking-actions`, sit behind a frozen `nb.ts` barrel and the status-label function is the only mapping from status codes to labels.

**Given** `api/clock.ts`, `session`, `links`, `sheet` and `slots`
**When** a feature imports them
**Then** `now` equals `serverNow` plus monotonic elapsed time and re-anchors on `visibilitychange` and `online`, `links` builds URL helpers including `?booking=`, and `api/sheet.ts` and `api/slots.ts` expose only context hooks (`useBookingSheet().open(...)`, slot lookups) with typed no-op defaults
**And** `api/` imports no feature code.

**Given** the file inventory
**When** the barrels are inspected
**Then** `i18n/nb/{common,auth,resources,bookings,booking-actions,approvals,dashboard,activity}.ts` and `api/keys/{session,resources,bookings,booking-actions,approvals,dashboard,activity}.ts` all exist behind the frozen barrels, so no slice edits `nb.ts` or an index
**And** each is owned by the slice that uses it.

**Given** the web Vitest project
**When** a component test renders with Testing Library and jsdom
**Then** one helper in `apps/web/src/test/` provides the query client, router, session, clock and providers for every web test.

### Story 1.14: Design tokens and Inter

As a build agent,
I want the design tokens generated from DESIGN.md and the typeface bundled,
So that every component uses one source of visual truth and the app works offline.

**Acceptance Criteria:**

**Given** `scripts/gen-tokens.mjs`
**When** it runs on the DESIGN.md front matter
**Then** `tokens.css` contains the colour, typography, rounded and spacing tokens as CSS custom properties, and `npm run lint` fails if the committed file differs or a contracts colour or symbol id has no DESIGN.md entry
**And** the Norwegian names of symbols and colours exist in the i18n catalogue from Story 1.13.

**Given** `tokens.extra.css` and `ui/timing.ts`
**When** they are inspected
**Then** shadows `shadow-sm/md/lg`, overlay and outline alphas, motion durations 180 ms and 120 ms, skeleton delay 150 ms and toast duration 4000 ms match DESIGN.md and EXPERIENCE.md
**And** a test asserts every token name referenced by DESIGN.md components resolves.

**Given** the production build
**When** `dist` and the CSS are inspected
**Then** Inter is emitted as bundled font files (`assetsInlineLimit: 0`), no CSS or HTML references a remote font URL, and `font-src 'self'` suffices, with the specified fallback stack
**And** the browser-level offline load is exercised by the first page-level Playwright test.

**Given** `prefers-reduced-motion`
**When** it is set
**Then** transitions and skeleton shimmer are disabled globally.

### Story 1.15: Form and feedback primitives

As a build agent,
I want accessible buttons, fields and feedback components built once,
So that every page behaves and looks the same.

**Acceptance Criteria:**

**Given** `Button` variants (primary, secondary, ghost, danger, danger-outline, small)
**When** they are used
**Then** sizes follow the 40 px/32 px rule, in-flight uses `aria-disabled` with a spinner and unchanged label, and disabled-by-state keeps its label with a visible reason
**And** focus rings are 2 px with the specified offset, white on dark surfaces.

**Given** `Field`, `Input`, `Select`, `Textarea`
**When** rendered with label, hint, error and counter
**Then** labels are always visible, optional fields say "(valgfritt)", others carry `aria-required`, errors use text plus icon and `aria-describedby`, and the counter announces only at 180 and 200 characters
**And** the form helper validates on blur and submit, clears errors when valid, lists errors above the form when there are more than two, and focuses the inline server-error alert.

**Given** `Alert`, `Toast`, `Skeleton`, `EmptyState` and `Badge`/`StatusBadge`
**When** used
**Then** the toast is one at a time with `role="status"`, 4 s plain and persistent when it carries an action, with a "Lukk" button and pause on hover and focus; skeletons appear after 150 ms; badges pair text with a dot and Utløpt has the dashed outline
**And** axe reports no violations for each component rendered in jsdom (viewport and horizontal-scroll checks are made at page level with the Playwright harness) and all strings come from `i18n`.

### Story 1.16: Overlay primitives and dialogs

As a build agent,
I want sheets, dialogs, popovers and tooltips wrapped once on React Aria Components,
So that focus handling is correct everywhere and no feature reimplements it.

**Acceptance Criteria:**

**Given** `Sheet`
**When** it opens
**Then** it is right-anchored at 440 px on desktop and full-screen on mobile, a modal `role="dialog"` with focus moved to its title, trapped, returned to the trigger on close, closed by Escape, with a sticky footer and scroll padding
**And** unsaved form content prompts "Forkaste endringene?" before closing.

**Given** `Dialog` with the `ReasonDialog` and `ConfirmDialog` compositions
**When** they open
**Then** the destructive action is never pre-focused, `ReasonDialog` focuses its "Begrunnelse" field, enforces 1–200 characters with the hint "Begrunnelsen vises til {name}" and keeps submit `aria-disabled` until text exists
**And** at most one dialog stacks on one sheet.

**Given** `Popover` and `Tooltip`
**When** used
**Then** the popover is non-modal, closes on Escape or outside click and returns focus, and the tooltip is shown on hover and focus, hidden on Escape and always paired with an `aria-label`.

**Given** reduced motion or the default
**When** overlays open
**Then** they animate 180 ms ease-out or appear instantly respectively.

### Story 1.17: Shared display components

As a build agent,
I want the presentational list and card components built once from DTOs,
So that parallel slices render bookings and resources identically without importing each other.

**Acceptance Criteria:**

**Given** `ResourceCard`, `ResourceIcon` and `Card`
**When** rendered from a `ResourceDto`
**Then** the whole card is one link, the approval badge shows when set, the tile uses the resource colour pair and a symbol from an explicit static map with an exhaustiveness test, and archived resources are shown read-only only where a page requests it.

**Given** `BookingRow` with props `booking`, `viewer`, `onOpen`, `onRebook?` and `actions?`
**When** rendered for each status, owner and time combination
**Then** it renders "Book igjen" itself (via `onRebook`) for past or final bookings, renders the node passed as `actions` (supplied by the caller from the `BookingActions` slot, which owns "Avbestill" only; the queue's approve and reject buttons belong to the approvals feature), shows the Utløpt badge instead of Venter, and opens the Booking detail sheet through the URL helper
**And** it imports nothing from `features/`.

**Given** `Timeline`, `Table`, `ChipGroup` and `SegmentedControl`
**When** used
**Then** the timeline renders structured activity items with entity links, the table becomes stacked cards below 768 px, chips use `aria-pressed` and URL state, and the segmented control takes an optional `storageKey` and remembers its choice per browser using guarded `localStorage` inside `ui/`
**And** every component reports no axe violations in jsdom.

### Story 1.18: Playwright harness

As a build agent,
I want browser test scaffolding that cannot touch the development database,
So that every UI story can prove accessibility and behaviour from its first commit.

**Acceptance Criteria:**

**Given** the Playwright configuration
**When** a worker starts
**Then** it builds or reuses the production bundle, boots its own server on a free port with its own temp database seeded under `FELLES_NOW=2026-10-19T07:00:00Z` and `NODE_ENV=test`, and requires `FELLES_DB_PATH` to equal the harness-created path
**And** `retries` is 0, `forbidOnly` is on and no test-only HTTP route exists.

**Given** the session fixture
**When** a spec asks for a Member or Administrator
**Then** a session row is inserted into the worker's temp database and the cookie is set, with the Administrator and Member from the seed
**And** a sample spec signs in as each and loads `/`.

**Given** the shared axe helper
**When** it runs on a sample page at 375 px and 1440 px
**Then** it reports violations as test failures and checks for horizontal scroll.

**Given** per-slice support files
**When** a slice needs browser helpers
**Then** `e2e/support/s01.ts` to `e2e/support/s07.ts` exist as stubs created by S00 and owned by their slices, and each slice creates its own spec files under the names given in its Owns cells.

### Story 1.19: Requirement inventory and the empty ledger

As the pilot owner,
I want every MUST evidence part listed in a machine-readable file that is checked against the PRD,
So that no requirement can drop out of the evidence trail unnoticed.

**Acceptance Criteria:**

**Given** the PRD owner table, §4.7 and the Story Index of this document
**When** `requirements.json` is generated
**Then** it lists every MUST evidence part as `{ req, evidenceSlice, story }`, the story-to-slice map, and the manual-evidence parts, with a separate entry for each part of a split scenario (for example E2E-04 at S05 and at S07)
**And** a test against the PRD fails if any MUST is missing or if the Index parts are not a superset of the PRD owner-table parts.

**Given** the generated file
**When** it is inspected
**Then** each part carries `level` (MUST or SHOULD) and each slice its `dependsOn` list (S01 and S02 on S00; S03 on S01 and S02; S04, S05 and S06 on S03; S07 on S04, S05 and S06)
**And** a part listed on several stories is satisfied when its named test exists on the slice branch, the generator recording all providing stories.

**Given** `acceptance-ledger.json`
**When** it is created
**Then** it holds `{ "entries": [] }` in the final format used by the gate and trace, with a schema check
**And** it is frozen and written only by the merge gate and the acceptance script.

### Story 1.20: Trace: default verification set and integrity exits

As the pilot owner,
I want the traceability check to enforce exactly the slices that have landed and to fail closed on any inconsistency,
So that earlier work is never blocked by later slices and nothing is silently skipped.

**Acceptance Criteria:**

**Given** the ledger, tags, reporters and `FELLES_SLICE`
**When** `trace.mjs` runs
**Then** it enforces the verification set of AD-26 (ledger slices plus `FELLES_SLICE`), exits 1 when an evidence part of a slice in the set has no passing test, and writes `trace.json` (`reqId, file, title, status, sha, dirty, tool, runAt`) to `_bmad-output/evidence/` keyed by SHA (a main-only path; the file is not part of the commit it describes)
**And** failed, skipped and todo tests never count, and SHOULD parts are reported as residual work without blocking.

**Given** `npm run verify:full`
**When** it is defined
**Then** it is `verify` plus the Playwright suite plus `trace.mjs` with the default set, and it accepts `--slice <slice>` as an alternative to `FELLES_SLICE` so the command is copyable on Windows
**And** on `slice/sNN` branches the trace step prints `INCOMPLETE <slice> <missing parts>` and exits 0 until a commit carries the trailer `Slice-Ready: SNN` or the run is the merge-gate candidate, when it is blocking.

**Given** a shallow clone, a missing, mismatching or non-ancestor tag, an unrecorded tag, an unknown slice, an empty set, a slice without evidence parts, an unknown title id, or absent reporter output
**When** the check runs
**Then** each case exits 2 with its own message
**And** the 23 scenarios of the Amendment 1 prototype are committed as fixture tests of the real script.

**Given** a change set that touches only `_bmad-output/planning-artifacts/**`
**When** `verify` runs
**Then** the trace check is skipped for that change set only, and `requirements.json` must be regenerated and committed in the same pull request with a `Freeze-Approved` trailer.

### Story 1.21: Release gate and manual evidence

As the pilot owner,
I want a release command that demands every mandatory evidence part and a convention for evidence that is not a test,
So that I can decide on acceptance from complete evidence.

**Acceptance Criteria:**

**Given** `npm run verify:release`
**When** it runs
**Then** typecheck, lint, tests, build, Playwright and `trace.mjs --release` run, the ledger and `FELLES_SLICE` are ignored, and every evidence part of every MUST must pass
**And** the command is the S07 acceptance run and the PIL-13 evidence, and it sets `FELLES_FORBID_501=1` so the route-enumeration test fails on any remaining stub.

**Given** `manual-evidence/<reqId>.md`
**When** it records a non-automatable part
**Then** it must name the tested parent commit, the tester, the date, the tool or procedure and the result, and `--release` accepts a commit whose only changes against the cited commit are under `manual-evidence/**` or are main-only paths (`acceptance-ledger.json`, `_bmad-output/pilot-log.md`, `_bmad-output/evidence/**`, `_bmad-output/implementation-artifacts/**`); a change to the lockfile or to dependency files between the cited commit and landing is not allowed, because it changes what was tested
**And** the file is owned by S07 once `s00-accepted` exists.

**Given** the gate-type parts (NFR-02, RUN-1, SEED-1, UI-2)
**When** `requirements.json` is checked
**Then** each names the test that evidences it, defined by the story that owns the part (for example `[NFR-02] verify gate rejects a violation`, `[SEED-1]`, `[RUN-1]`, `[UI-2]`)
**And** a part whose named test does not exist fails the check.

### Story 1.22: Ownership check

As the pilot owner,
I want machine-checked file ownership,
So that parallel agents cannot touch each other's files or frozen contracts.

**Acceptance Criteria:**

**Given** `ownership.json` (path globs only, most specific glob wins, one slice per path) and `scripts/check-ownership.mjs`
**When** a branch changes a file outside its slice or a frozen path without a `Freeze-Approved:` trailer
**Then** the check fails naming the file, and `--print-slice` prints the single owning slice or fails when changes span several
**And** a test asserts that every path under `apps/`, `packages/`, `e2e/` and `scripts/` is owned exactly once.

**Given** the frozen list of AD-20
**When** the check classifies paths
**Then** `packages/contracts/**`, migrations 0001–0099, route and nav tables, existing `ui/` primitives, configs, root scripts, `ownership.json`, `requirements.json` and `acceptance-ledger.json` are frozen, files added under `ui/` pass, `packages/contracts/src/{activity,dashboard}.ts` and the schedule DTO exports belong to S03 until `s03-accepted`, and `_bmad-output/implementation-artifacts/**`, `_bmad-output/pilot-log.md`, `_bmad-output/evidence/**` and `acceptance-ledger.json` are main-only
**And** S07 may edit any non-frozen file when the commit carries a `Fixes: N.M` trailer, and `README.md` and `manual-evidence/**` map to S07 after `s00-accepted`.

**Given** S00 creates stubs, seam entries, barrels or helpers for other slices
**When** `ownership.json` records them as `{ path, owner, createdBy: S00 }`
**Then** slice S00 may create and edit them and every frozen path until `s00-accepted` (no `Freeze-Approved` needed inside S00 except for `packages/contracts/**` and migrations after Gate S00-CP), `--print-slice` ignores `createdBy: S00` stubs on `slice/s00`, and after `s00-accepted` only the owner may edit them
**And** colocated test files (`modules/<m>/**/*.test.ts`, `features/<f>/**/*.test.tsx`), the page entry file of every feature, `server.ts`, `main.tsx` and the workspace configs each have exactly one owner.

**Given** paths that no Owns cell names
**When** `ownership.json` is generated
**Then** default rules apply: a colocated test (`*.test.ts(x)`) follows the owner of its sibling source; the files directly inside `apps/web/src/features/<f>/` (`index.tsx`, `*Page.tsx`) follow the slice that owns the feature's sub-folders (`features/resources/` is S02), except the seam entry bodies of `features/bookings/index.tsx` and `features/booking-actions/index.tsx`, which `ownership.json` assigns per body as in Story 1.27; API tests of a slice live under `apps/api/test/<slice>/**` and its helper in `apps/api/test/helpers/<slice>.ts`; `packages/contracts/test/<file>.test.ts` follows the owner of the contract file (S00 unless the file is S03's draft); the lockfile and root and workspace dependency files are frozen and change only with a `Freeze-Approved:` trailer; a test that asserts a stub's behaviour lives beside the stub, belongs to the replacing slice and is replaced with it, and tests of S00-owned code inject their collaborators (a page component, a pending count) instead of asserting a stub's output
**And** a path that still has no owner fails the test of this story and is added to `ownership.json` by this story.

**Given** `npm run verify` on `slice/sNN` or with `FELLES_SLICE` set
**When** it runs
**Then** it runs the ownership check against the merge-base with `main`, so a local run and CI agree

**Given** a commit with a `Freeze-Approved:` trailer
**When** the check runs
**Then** the value must be a pilot-log entry id (`PL-<date>-<n>`) that exists on `main`, otherwise the check fails
**And** a `Fixes: N.M` commit on `slice/s07` counts as slice S07.

**Given** a change set that touches only `_bmad-output/planning-artifacts/**`
**When** the check runs
**Then** it reports the slice `planning` and passes without a slice.

### Story 1.23: Delivery ledger script

As the pilot owner,
I want one script that records story evidence, sprint-status and pilot-log entries,
So that the bookkeeping the gates rely on is deterministic whether a human or Agent Orchestrator drives it (PRD OQ-2).

**Acceptance Criteria:**

**Given** `scripts/ledger.mjs story <N.M> implemented|tested|reviewed --sha <sha>`
**When** it runs on `main`
**Then** it appends an entry to the story's ledger under `_bmad-output/implementation-artifacts/`, refuses a commit that is not reachable from the story's slice branch, refuses `reviewed` without a `tested` entry for the same tree, and records agent completion as at most `implemented` (PIL-03)
**And** it refuses to write on any branch other than `main`.

**Given** `scripts/ledger.mjs status <N.M> <state>` and `scripts/ledger.mjs gate S00-CP done --approval <PL-id>`
**When** they run
**Then** sprint-status moves only along `backlog`, `ready-for-dev`, `in-progress`, `review`, `done` is reserved for `accept-slice.mjs`, and the gate is recorded in the ledger (`acceptance-ledger.json` gate entry) only with a pilot-log approval id
**And** `ledger.mjs status` refuses to move any S00 story after the gate (1.8 onward) to `in-progress` while that ledger gate entry is missing, and sprint-status keeps its native vocabulary.

**Given** `scripts/ledger.mjs pilot-log` with wall-clock, agent runs, interventions, test failures, review findings and tokens or cost
**When** it runs
**Then** it appends an entry to `_bmad-output/pilot-log.md` (append-only, `merge=union`) with the PIL-07 fields, writing `unknown` for any field not given, and prints the entry id `PL-<date>-<n>` that `Freeze-Approved` trailers cite
**And** `ledger.mjs show <N.M>` lists a story's entries with their commits and marks an entry stale when a later commit changed a path in that story's Owns cell.

**Given** the stories and the gate decision recorded before this script exists
**When** `ledger.mjs backfill` runs once
**Then** it imports the pilot-log entry for Gate S00-CP, records the gate in the ledger, and creates ledger entries for Stories 1.1–1.22 from the recorded commits, marking them `backfilled`
**And** `ledger.mjs story` also accepts `--report <path>` and `--verify-result <path>` so the PIL-02 fields are recorded.

**Given** a fixture repository
**When** the script's tests run
**Then** every command and refusal above is covered by a committed test

### Story 1.24: Merge gate

As the pilot owner,
I want a deterministic, serial landing procedure for a finished slice,
So that nothing lands unverified and parallel slices cannot corrupt each other.

**Acceptance Criteria:**

**Given** `scripts/merge-gate.mjs` run for `slice/sNN`
**When** it derives the slice from `ownership.json` and the changed files
**Then** it first refuses a candidate whose prerequisite slices (`dependsOn`) lack an `sNN-accepted` tag or any story of which lacks `implemented`, `tested` and `reviewed` ledger entries citing commits reachable from the candidate tip, then builds a throwaway merge commit of the slice tip into current main (slice commits keep their SHAs), runs `verify:full` with `FELLES_SLICE` set (and `FELLES_FORBID_501=1` for S07), the ownership check and the shared integration set (route enumeration, schema snapshot, tokens check, contract round-trips, and the E2E smoke, defined as the sample Playwright spec on the production build of the candidate), and emits JSON bound to the tree hash
**And** a `FELLES_SLICE` given as well must agree, and a candidate spanning several slices fails.

**Given** a verified candidate
**When** it lands
**Then** only a fast-forward of the verified candidate is pushed, one at a time, the annotated tag `sNN-integrated` is created on the landed commit and one follow-up commit records it in `acceptance-ledger.json` in the same push
**And** a failing test or evidence part leaves `main` untouched.

**Given** two slice branches from the same main
**When** they are landed one after the other
**Then** the second is rebuilt on the new main before its gate runs and the verification set then includes the first slice
**And** the replayed scenarios of Amendment 1 (S00 alone, S01 and S02 independent, a missing test blocks, future slices ignored) pass as committed fixture tests, together with: a `slice/s00` candidate touching stubs of S01–S06 passes, a candidate touching another slice's file fails, a missing prerequisite acceptance refuses, and a missing `reviewed` entry refuses.

### Story 1.25: Slice acceptance

As the pilot owner,
I want one deliberate act that accepts a slice,
So that human acceptance is separate from integration and recorded once.

**Acceptance Criteria:**

**Given** `scripts/accept-slice.mjs <slice>` run on a clean tip of `main`
**When** the slice is `integrated` and its ledger entry and tag are valid
**Then** a fresh `verify:full` for that slice runs, the annotated tag `sNN-accepted` is created on the integrated commit, the ledger state becomes `accepted`, and every story of the slice is set to `done` in sprint-status in the same commit
**And** it refuses on a dirty tree, a stale tip, an unintegrated slice or a missing story ledger entry (`implemented`, `tested`, `reviewed`), except that a story whose evidence parts are all SHOULD may be recorded as `descoped` with a pilot-log entry and Jo's decision and is then listed as residual work.

**Given** slice S07
**When** it is accepted
**Then** the script runs `verify:release` instead of `verify:full`
**And** the tag is created last so a failed run leaves none, and the tagger identity and date are copied into a pilot-log entry written on main.

**Given** the state vocabulary of the Story Index
**When** the commands print their result
**Then** they use the same words: story `done`, slice `integrated` and `accepted`, requirement `evidenced` and `verified`.

### Story 1.26: App shell and navigation

As a Member or Administrator,
I want a consistent, accessible shell with navigation that fits my role and screen,
So that I can reach every page on a phone or a desktop and always see who I am.

**Acceptance Criteria:**

**Given** a signed-in user at 1440 px
**When** the shell renders
**Then** the sidebar shows the wordmark, Demo pill, nav items, the "Administrasjon" section only for Administrators with the Godkjenninger pill slot, the user block with avatar initials, name and role, and a "Logg ut" button, and the current page is marked by a bar, weight and `aria-current="page"`
**And** between 768 and 1023 px an icon rail with tooltips appears.

**Given** 375 px
**When** the shell renders
**Then** a 56 px top bar and a five-tab bar (Hjem, Ressurser, Kalender, Bookinger, Mer) appear, "Mer" is a button with `aria-haspopup="dialog"` opening the Mer sheet with Aktivitet, the Administrator pages, the user block and "Logg ut", and page content leaves room for both bars
**And** nothing scrolls horizontally, in a test titled `[UI-2]`.

**Given** "Logg ut" with an overlay open, or a changed user id in another tab
**When** each occurs
**Then** the overlay closes without a prompt, the session ends through the S00 `logout()`, the query cache is cleared and the app routes to `/logg-inn` carrying the message key (`signedOut` or `sessionExpired`) that the login page of S01 renders as "Du er logget ut." or "Økten er utløpt. Logg inn på nytt.", tested with a stubbed session and the stub login page
**And** the browser Back button does not reveal cached booking data.

**Given** an Administrator with pending requests
**When** the Godkjenninger pill and the Mer tab render
**Then** the pill's accessible name is "Godkjenninger, 3 venter" (the count from `usePendingCount`, injected by the test because the S00 body returns `null`), the Mer count dot reads "3 ventende godkjenninger", and sticky bars never cover a focused element (`scroll-padding-top: 56px`, `scroll-padding-bottom: 64px` on the scroll root)
**And** the viewport and horizontal-scroll checks run with the Playwright harness at 375 and 1440 px.

### Story 1.27: Router, titles, focus, seams and access pages

As a Member or Administrator,
I want every page reachable by its Norwegian address with correct titles, focus and access handling,
So that navigation, deep links and refresh work for everyone.

**Acceptance Criteria:**

**Given** the router
**When** any route is opened
**Then** all nine Norwegian routes render, in a test that injects a test page component per route so that it does not depend on any stub's output, the pages from files owned by their feature through lazy loading, document titles read "FELLES – {page}" from the route table `titleKey`, there is one `h1` per surface, focus moves to it on route change, a "Hopp til innhold" skip link is first, landmarks and `lang="nb"` are present
**And** an Administrator route opened by a Member shows "Ingen tilgang" from the 403 with the action "Til Hjem", and an unknown route shows "Fant ikke siden.".

**Given** the seam entry files
**When** S00 creates them
**Then** `features/bookings/index.tsx` exports stubs `BookingSheet`, `BookingDetailHost` and `AvailabilityStrip`, `features/booking-actions/index.tsx` exports `BookingActions` with the frozen props (`booking`, `viewer`, `placement`, `onChanged`), `app/providers` imports them once and provides them through `api/sheet.ts` and `api/slots.ts`, and the `?booking=` host is mounted by the shell
**And** `ownership.json` assigns each seam entry to its implementing slice.

**Given** the session is still resolving
**When** the shell renders
**Then** skeleton content appears, never a blank screen
**And** a test replaces a seam body in a throwaway branch without touching `app/` or `api/`.

### Story 1.28: QueryState and the offline alert

As a Member or Administrator,
I want every page to show loading, empty, error and offline states the same way,
So that I always know what the app is doing.

**Acceptance Criteria:**

**Given** `QueryState`
**When** a query is loading, empty, failed or refused
**Then** it renders a layout-mirroring skeleton after 150 ms, the empty state with its single action, the "Prøv igjen" alert for network and 5xx while keeping the last good data, the "Ingen tilgang" page for 403 and the not-found message for 404, identically for every surface (`[UI-4]`)
**And** all texts come from `i18n`.

**Given** loss of connectivity
**When** the browser goes offline
**Then** the top alert "Ingen nettforbindelse" appears and mutations are `aria-disabled` until it returns
**And** returning online refetches the session query and re-anchors the clock.

### Story 1.29: Start scripts, README skeleton and CI with the phased macOS smoke

As a new developer or agent,
I want to start the project from the README on any supported platform,
So that I need no prior chat context.

**Acceptance Criteria:**

**Given** a clean clone
**When** the README steps `npm ci`, `npm run setup:native`, `npm run db:seed`, `npm start` are followed
**Then** `scripts/start.mjs` builds, spawns the server bundle through `process.execPath` with `NODE_ENV=production` and `UV_THREADPOOL_SIZE=8`, migrations run at boot, and FELLES answers on `http://127.0.0.1:3000`, proven by a test titled `[RUN-1]` that spawns it on a temp database
**And** `npm run dev` runs the API through `tsx` and Vite on `FELLES_VITE_PORT` with `strictPort` and the proxy.

**Given** `.github/workflows/ci.yml`
**When** it runs
**Then** it executes `verify:full` on `windows-latest`, `ubuntu-latest` and `macos-latest` with `fetch-depth: 0` and `fetch-tags: true`, installs Chromium (`--with-deps` on Linux only), runs `npm audit --omit=dev --audit-level=high`, and adds a non-blocking Node 26 job
**And** pushes to main set no `FELLES_SLICE`; on `slice/sNN` branches the slice is derived from `check-ownership --print-slice` (`S00` on `slice/s00` until `s00-integrated` exists) and `verify` plus the Playwright suite are blocking on all three systems while the trace step is advisory until `Slice-Ready: SNN` or the merge-gate candidate; and a workflow `release.yml`, triggered by the tag `s07-integrated`, runs `verify:release`.

**Given** `scripts/smoke.mjs`
**When** it runs on the macOS job
**Then** it executes phases (seed and start, `GET /api/health` and `GET /api/session` in S00; login after S01; one booking and one refused conflict after S03), prints `PENDING <slice>` while a route answers 501, and `--require-full` fails on any pending phase
**And** the README lists Node 24 as a prerequisite, the development credentials as development-only, and troubleshooting for `setup:native`.

### Story 1.30: Hello-slice dry run, first gate run and the S00 freeze package

As the pilot owner,
I want proof that a slice can be built and landed under the real rules, and a complete freeze package,
So that I can accept S00 and release the parallel agents with confidence.

**Acceptance Criteria:**

**Given** a scratch clone with a fixture slice `S99` (one fixture entry each in `ownership.json` and `requirements.json`, one evidence part)
**When** a throwaway `slice/s99` branch replaces a seam entry body, adds a route handler body, a string, a key and a test
**Then** `check-ownership` passes, `verify:full` passes with `FELLES_SLICE=S99`, the merge gate lands it in the scratch clone, and no frozen file changed
**And** the same branch fails the ownership check when it edits `packages/contracts` without a `Freeze-Approved` trailer, a branch that creates a stub for another slice under the S00 build mode passes, and the same edit after `s00-accepted` is refused.

**Given** S00 complete on `slice/s00`
**When** the freeze package is assembled
**Then** it lists the contracts content hash and schema hash (equal to the Gate S00-CP hashes or listed as re-approved), the route and nav tables, the ownership map, the stack note and the verification results on Windows and in CI
**And** the first real run of `merge-gate.mjs` lands `slice/s00` on `main` as a whole slice and creates `s00-integrated`.

**Given** the freeze package and the integrated slice
**When** Jo accepts S00
**Then** `accept-slice.mjs S00` creates `s00-accepted`, updates the ledger and sets the S00 stories to `done`
**And** S01 and S02 may then start in separate `slice/s01` and `slice/s02` worktrees, and the PIL-06 ramp decision is recorded in the pilot log.

## Epic 2: Sign in with the right role

Members and Administrators sign in with e-mail and password, stay signed in across refresh, see their name and role, and are held to server-enforced permissions; unauthenticated users can read nothing. Slice S01, built by one agent on `slice/s01` with the stories as serial commits and landed as a unit; starts after S00 is accepted and runs in parallel with Epic 3.

### Story 2.1: Log in and log out

As a Member or Administrator,
I want to sign in with my e-mail and password and sign out again,
So that I can use FELLES under my own identity.

**Acceptance Criteria:**

**Given** a seeded user and the correct password
**When** `POST /api/session` is called with a valid `Origin`
**Then** the response is 200 with `{ user }`, a new session row stores only the SHA-256 of a 32-byte token, and the cookie `felles_sid` is `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=43200`, and `Secure` when the request protocol is https
**And** any session the presented cookie already pointed to is deleted first.

**Given** a wrong password, an unknown e-mail or an e-mail with different case or trailing spaces
**When** login is attempted
**Then** the unknown e-mail returns the identical 401 `INVALID_CREDENTIALS` as a wrong password with comparable timing, and a differently cased known e-mail logs in
**And** no response reveals whether the e-mail exists (`[AUT-01]`).

**Given** a malformed login body (missing password, unknown key, wrong content type)
**When** `POST /api/session` is called
**Then** the response is 400 `VALIDATION_FAILED` in the standard envelope with a `fieldErrors` entry for the offending field (`[BR-4]`)
**And** no session is created.

**Given** a signed-in user
**When** `DELETE /api/session` is called
**Then** the session row is deleted, the cookie is cleared with identical attributes, the response is 204, and the old cookie then gets 401 `UNAUTHENTICATED` from protected routes (`[AUT-02]`)
**And** a session older than 12 hours is rejected by the Clock comparison.

**Given** `GET /api/session` after login and after a restart of the server
**When** the same cookie is used
**Then** the user and `serverNow` are returned, so the session survives a page refresh (`[AUT-04]` API part).

### Story 2.2: Slow down repeated wrong passwords

As the pilot owner,
I want repeated wrong-password attempts to be throttled safely,
So that guessing a password is impractical without letting an attacker lock a colleague out for long.

**Acceptance Criteria:**

**Given** five consecutive failures for one normalised e-mail
**When** the fifth fails
**Then** it returns 401 `INVALID_CREDENTIALS` with `details.retryAfterSeconds: 10`, and attempts inside the delay return 429 `RATE_LIMITED` with `Retry-After`, identically for unknown e-mails
**And** refused attempts neither count nor extend the delay, and a success clears the counter.

**Given** continued failures after a delay has expired
**When** the sixth failure occurs
**Then** the next delay is 20 s, doubling to a 5-minute cap, driven by the injected Clock.

**Given** 50 parallel guesses for one e-mail
**When** they arrive together
**Then** the attempt is reserved synchronously so at most five are verified before the delay applies
**And** rotating 2,000 distinct unknown e-mails never evicts an active delay and is answered 429 beyond two in flight and eight queued.

### Story 2.3: Roles are enforced on every protected route

As an Administrator or Member,
I want the server to enforce what each role may do,
So that a Member can never change resources or process others' requests, whatever the UI shows.

**Acceptance Criteria:**

**Given** the route-enumeration test with no session
**When** it walks every non-public route in the contract table
**Then** each answers 401 `UNAUTHENTICATED` and no booking or user data is readable (`[AUT-02]`, `[BR-6]`)
**And** `GET /api/session` and `GET /api/health` remain public.

**Given** a Member session
**When** every `admin` route is called directly with a valid `Origin`
**Then** each answers 403 `FORBIDDEN` and no data changes (`[E2E-07]`, first extension)
**And** the same call as an Administrator is allowed by the access check.

**Given** `policy.can`
**When** its table is tested for every action, role and ownership combination
**Then** Members and Administrators receive exactly the decisions of AD-14 (`[AUT-03]`)
**And** the 401 and 403 bodies for Members contain no foreign identity; the foreign-booking 403 for every status is evidenced in S03, S05 and S07 where those routes exist.

**Given** a changed role in the database
**When** the next request arrives
**Then** the new role applies immediately because the role is read on every request.

### Story 2.4: The Innlogging page

As a Member or Administrator,
I want a clear sign-in page that explains problems plainly,
So that I get into FELLES quickly and understand what to do when something goes wrong.

**Acceptance Criteria:**

**Given** a browser with no session
**When** FELLES opens
**Then** `/logg-inn` renders with focus in "E-post", labelled fields, a "Vis" password toggle of 40×40, no credentials shown, and the Demo pill
**And** the document title is "FELLES – Logg inn" with one `h1`.

**Given** a wrong password
**When** the form is submitted with Enter
**Then** the button shows a spinner with `aria-disabled`, then "Feil e-post eller passord." appears above the button, both fields are outlined, and focus moves to the message
**And** the message never says which part was wrong.

**Given** the fifth failure
**When** the response carries `retryAfterSeconds`
**Then** the button waits with a visible countdown whose end time is kept in `sessionStorage` (guarded) so it survives a refresh, and a 429 shows the approved `RATE_LIMITED` message.

**Given** a correct login, an expired session and a sign-out
**When** each happens
**Then** the user lands on Hjem; after expiry the page shows "Økten er utløpt. Logg inn på nytt." and after sign-out "Du er logget ut."
**And** the page passes axe at 375 and 1440 px.

### Story 2.5: Session lifetime and concurrent sessions

As a Member or Administrator,
I want my session to last exactly as promised and to be independent of other people's,
So that I stay signed in for a working day and nobody else's sign-in or sign-out affects me.

**Acceptance Criteria:**

**Given** a session created at time T with the injected Clock
**When** requests arrive at T + 11 h 59 min 59 s and at T + 12 h
**Then** the first is authenticated and the second answers 401 `UNAUTHENTICATED`, there is no sliding extension, and `GET /api/session` then returns `{ user: null, serverNow }` (`[AUT-02]`, `[AUT-04]`)
**And** the expired row is removed only by the purge timer or the next login, never by a read.

**Given** two users signed in at once, and one user signed in twice
**When** one of them logs out
**Then** only that session is deleted, the other sessions stay valid, and a login presenting an existing valid cookie deletes that old session first
**And** the cookie is cleared with attributes identical to those it was set with.

**Given** `FELLES_COOKIE_SECURE=auto`
**When** login arrives over http and over https
**Then** `Secure` is absent and present respectively, and `true` forces it
**And** `Max-Age` is 43200 in both cases.

### Story 2.6: Prove the sign-in flow in the browser

As the pilot owner,
I want Flow 0 verified end to end in a real browser,
So that I can accept S01 on evidence rather than on trust.

**Acceptance Criteria:**

**Given** the Playwright harness
**When** the sign-in spec runs as Ingrid
**Then** a wrong password shows the generic error, the corrected password reaches Hjem (its `h1` and document title), the sidebar user block and the Mer sheet show her name and role, and a refresh keeps her signed in (`[AUT-01]`, `[AUT-04]`)
**And** sign-out returns to the login page with the sign-out note.

**Given** the expiry variant
**When** the session cookie is cleared and a mutation is attempted
**Then** the user lands on sign-in with the expiry message and, after signing in, on Hjem
**And** every test title carries its requirement id and the story tag `(@2.6)`.

**Given** the evidence ledger
**When** the S01 stories are complete
**Then** every evidence part of the S01 rows of the Story Index has a passing named test on `slice/s01`, which is the condition for the merge gate to land the slice.

**Given** all stories of slice S01 have `implemented`, `tested` and `reviewed` ledger entries on the slice tip
**When** the orchestrator runs `merge-gate.mjs slice/s01` and Jo then runs `accept-slice.mjs S01`
**Then** `s01-integrated` and `s01-accepted` exist, the ledger shows `accepted`, every story of the slice is `done`, and `pilot-log.md` has an entry (date, SHA, waiting time) written on main
**And** S01 and S02 may land in either order and the second is rebuilt on the new `main` before its gate runs.

## Epic 3: Find resources and keep the catalogue in order

Everyone can browse, search and filter active rooms and equipment and open their details; Administrators create, edit and archive resources, with archiving refused while future bookings exist. Slice S02, built by one agent on `slice/s02` with the stories as serial commits and landed as a unit; starts after S00 is accepted and runs in parallel with Epic 2 (it authenticates with the S00 session helpers, not with Epic 2).

### Story 3.1: List and read resources

As a signed-in user,
I want to list, search and filter active resources and open one by id,
So that I can find the room or equipment I need.

**Acceptance Criteria:**

**Given** the seeded resources
**When** `GET /api/resources` is called as a Member
**Then** only active resources are returned as `{ items, truncated }` with the DTO fields, rooms first and then `compareNb(name)`, filtered by `kind` and `q` (folded for nb-NO, matching name, description and location) (`[RES-01]`)
**And** `status=archived` or `all` by a Member returns 403 `FORBIDDEN`.

**Given** an Administrator
**When** `status=archived` or `all` is requested
**Then** archived resources are included
**And** `limit` above 200 is rejected and the default is 100.

**Given** `GET /api/resources/:id`
**When** the id is an archived or missing resource
**Then** an archived resource is readable (read-only) by any signed-in user and a missing one returns 404 `NOT_FOUND`
**And** an unauthenticated call returns 401.

### Story 3.2: Create and edit resources

As an Administrator,
I want to create and edit resources with clear validation,
So that the catalogue stays accurate.

**Acceptance Criteria:**

**Given** a valid body
**When** `POST /api/resources` is called as an Administrator
**Then** the resource is created active with an `INTEGER` id, one `resource.created` event is written in the same transaction, and the response is 201 (`[RES-02]`, `[RES-03]`, `[BR-5]`)
**And** a Member gets 403 on create and on `PATCH` and nothing is written (`[E2E-07]`).

**Given** invalid values (empty or over-80-character name, seats below 1 or fractional, unknown symbol or colour, description over 500, unknown keys)
**When** the request is sent
**Then** it returns 400 `VALIDATION_FAILED` with `fieldErrors` of `{ path, code, message }` using the approved Norwegian messages, and optional seats accept `null` or omission (CR-4: any kind)
**And** `status` cannot be sent.

**Given** `PATCH /api/resources/:id`
**When** fields are omitted, set to `null`, or changed
**Then** omission leaves a field unchanged, `null` clears an optional field, one `resource.updated` event lists only the changed fields, and a no-op writes no event
**And** editing an archived resource returns 409 `RESOURCE_ARCHIVED`.

### Story 3.3: Archive a resource safely

As an Administrator,
I want to archive a resource only when nothing is booked ahead,
So that nobody loses a booking they rely on.

**Acceptance Criteria:**

**Given** a resource with no `pending` or `confirmed` booking starting after now
**When** `POST /api/resources/:id/archive` is called
**Then** it becomes archived, one `resource.archived` event is written in the same transaction, and the response is 200 (`[RES-04]`)
**And** Expired and in-progress bookings do not block archiving.

**Given** a future `pending` or `confirmed` booking (inserted with the S00 booking-fixture helper)
**When** archive is called
**Then** the response is 409 `RESOURCE_HAS_FUTURE_BOOKINGS` with `details.futureBookingCount` and `firstFutureBookingAt`, and nothing changes (`[E2E-08]` API part)
**And** the guard uses `countFutureBlocking` in the same `UnitOfWork`.

**Given** an archived resource
**When** archive is called again, or database statements try to un-archive or delete it
**Then** the API returns 409 `RESOURCE_ARCHIVED` and the triggers reject the statements
**And** a Member calling archive gets 403 (`[E2E-07]`).

### Story 3.4: Browse and search resources

As a signed-in user,
I want a clear catalogue I can search and filter,
So that I can find what I need on any device.

**Acceptance Criteria:**

**Given** the Ressurser page
**When** it loads
**Then** a skeleton of six cards appears after 150 ms, then resource cards in a three-column grid (two columns 768–1023 px, one on mobile) with tile, name, kind and location, seats where present, and the "Krever godkjenning" badge (`[RES-05]`)
**And** the whole card is a single link to the detail page.

**Given** the search field and chips
**When** the user types "projektor" or presses "Rom", "Utstyr" or "Alle"
**Then** the loaded list filters client-side by name, description and location (a failed load shows the "Prøv igjen" alert with the last good list kept, and offline shows the offline alert), `aria-pressed` reflects the chip, the query and filter live in the URL and survive refresh, and Escape clears the search
**And** no match shows "Ingen ressurser matcher «projektor»." with "Nullstill søk".

**Given** no active resources
**When** an Administrator opens the page
**Then** "Ingen aktive ressurser." appears and Administrators also see a link "Opprett ressurs" to `/ressursadministrasjon?ny=1`; a Member sees the text without the link
**And** the page passes axe at 375 and 1440 px with no horizontal scroll.

### Story 3.5: Resource detail page

As a signed-in user,
I want a detail page with the resource's facts and the actions that lead on,
So that I can decide to book it.

**Acceptance Criteria:**

**Given** `/ressurser/:id`
**When** an active resource loads
**Then** it shows the large tile, name, kind, location, seats, description, the approval notice and two actions: "Book", which calls `useBookingSheet().open({ resourceId, lockResource: true })`, and "Se i kalender", linking to `/kalender?ressurs=`
**And** it renders `<AvailabilityStrip resourceId>` obtained from the slot hook, which renders nothing until the owning slice implements the seam; no S02 code refers to another slice's story.

**Given** an archived resource
**When** its page is opened
**Then** it is read-only with the "Arkivert" badge and no "Book" button.

**Given** a missing id
**When** the page is opened
**Then** "Fant ikke ressursen." appears with "Til ressurser"
**And** the page has one `h1`, correct title and passes axe at both widths.

**Given** loading and failure
**When** the request is pending or fails
**Then** a skeleton of the header appears after 150 ms and a "Prøv igjen" alert keeps the last good data (`[UI-4]`)
**And** seats and other numbers use the shared formatters (`[UI-5]`).

### Story 3.6: Resource form sheet

As an Administrator,
I want a sheet to create and edit a resource with symbol and colour pickers,
So that new resources are recognisable and valid.

**Acceptance Criteria:**

**Given** "Ny ressurs" or "Rediger"
**When** the Resource form sheet opens
**Then** it shows Navn, Type (Rom/Utstyr), Beskrivelse (valgfritt), Plassering, Antall plasser (valgfritt), Symbol, Farge and the switch "Krever godkjenning" with the consequence text, in the sheet chrome with focus on its title
**And** symbol and colour are radio groups with Norwegian option names, one tab stop, arrow-key movement and a text statement "Valgt: Blå".

**Given** an empty name
**When** the form is submitted
**Then** "Navn er påkrevd." appears under the field, focus moves to it, and server field errors render identically
**And** over-limit text shows "Maks {n} tegn." with the field's own limit (80 for name, 500 for description).

**Given** a submission in flight or refused by the server
**When** the request is pending or fails
**Then** the button shows its spinner with `aria-disabled` and the inputs are read-only, and a server error appears in the inline alert above the button which receives focus (`[UI-4]`)

**Given** a valid submission
**When** it succeeds
**Then** the sheet closes with focus returning to the trigger, the toast "Ressursen er opprettet." or "Ressursen er lagret." appears and the table and catalogue refetch via the invalidation map
**And** closing a dirty form prompts "Forkaste endringene?".

### Story 3.7: Resource administration page

As an Administrator,
I want a table of all resources with edit and archive actions,
So that I can keep the catalogue in order.

**Acceptance Criteria:**

**Given** `/ressursadministrasjon`
**When** an Administrator opens it
**Then** a table (stacked cards below 768 px) lists all resources with the filter chips "Aktive" and "Arkiverte", row actions "Rediger" and "Arkiver", archived rows with the "Arkivert" badge and no actions, and "Ny ressurs" in the page header
**And** a Member opening the URL sees "Ingen tilgang".

**Given** "Arkiver"
**When** it is activated
**Then** the Confirm dialog explains the effect with "Behold" focused; on success the toast "Ressursen er arkivert." appears and the row shows "Arkivert"
**And** a 409 closes the dialog and shows the inline alert "Ressursen har 1 fremtidig booking og kan ikke arkiveres." (plural correct) with "Se bookinger" linking to the calendar week of `firstFutureBookingAt`.

**Given** `/ressursadministrasjon?ny=1`
**When** an Administrator opens it
**Then** the Resource form sheet for a new resource opens at once, and closing it leaves the table in place
**And** a Member opening it sees "Ingen tilgang".

**Given** the page states
**When** loading, empty archived filter and failed load occur
**Then** skeleton, "Ingen arkiverte ressurser." and "Prøv igjen" alerts appear as specified
**And** the page passes axe at both widths.

**Given** all stories of slice S02 have `implemented`, `tested` and `reviewed` ledger entries on the slice tip
**When** the orchestrator runs `merge-gate.mjs slice/s02` and Jo then runs `accept-slice.mjs S02`
**Then** `s02-integrated` and `s02-accepted` exist, the ledger shows `accepted`, every story of the slice is `done`, and `pilot-log.md` has an entry (date, SHA, waiting time) written on main
**And** S01 and S02 may land in either order and the second is rebuilt on the new `main` before its gate runs.

## Epic 4: Book a room or equipment without double-booking

Members see availability and book a free slot; the server guarantees at most one booking per slot under concurrent requests, applies the time and approval rules, and the calendar, slot picker, Mine bookinger and rebooking make it usable. Slices S03 (Stories 4.1–4.5: booking engine, schedule read model, booking API, API-level evidence; one agent on `slice/s03`) and S04 (Stories 4.6–4.15: all booking screens; one agent on `slice/s04`). The S03 stories start only after S01 and S02 are accepted by Jo (ORK-02). The S04 stories depend on the acceptance of S03, never on S05 or S06, and Epics 5 and 6 likewise depend on the acceptance of S03 and not on Stories 4.6–4.15.

### Story 4.1: Create a booking

As a Member,
I want to book a resource for a date and time with a short purpose,
So that I know the room or equipment is mine for that time.

**Acceptance Criteria:**

**Given** an active resource without approval requirement and a valid body `{ resourceId, date, start, end, purpose }`
**When** `POST /api/bookings` is called by a Member or Administrator
**Then** the response is 201 with a booking whose owner is the session user, status `confirmed`, instants converted once from the Oslo civil values and stored as epoch milliseconds, and one `booking.created` event with `{ status }` written in the same transaction (`[BOK-01]`, `[BOK-05]`)
**And** a body containing `userId`, `status` or unknown keys is rejected with 400.

**Given** an active resource with `approvalRequired`
**When** a valid booking is created
**Then** the status is `pending`, the interval blocks later requests, and the same single event type is written (`[BOK-05]`)
**And** a later change of `approvalRequired` leaves this booking unchanged.

**Given** values outside the rules (07:30 or 22:30, a time off the half hour, 4 h 30 min, 15 min, end before start, a past start, a start more than 30 × 24 h ahead, a purpose empty or over 200 characters)
**When** the request is sent
**Then** each returns 400 `VALIDATION_FAILED` with `fieldErrors` on `date`, `start`, `end` or `purpose` and the approved Norwegian messages (`[BOK-02]`, `[BR-4]`)
**And** a start exactly equal to now is rejected (`start > now`).

**Given** an archived or missing resource, or an interval that overlaps a `pending` or `confirmed` booking
**When** creation is attempted
**Then** the responses are 409 `RESOURCE_ARCHIVED`, 404 `NOT_FOUND` and 409 `BOOKING_CONFLICT` with empty `details` respectively, and nothing is written (`[RES-04]`, `[BR-2]`, `[E2E-08]`)
**And** 10:00–11:00 followed by 11:00–12:00 on the same resource both succeed (`[BOK-03]`).

**Given** a stored booking
**When** the repository's public surface is inspected and a direct `UPDATE` of time or purpose, a `DELETE` and an `INSERT OR REPLACE` are attempted
**Then** the repository exposes no update or delete of identity, time or purpose and the database rejects the statements (`[BR-3]`)
**And** a cancelled booking still occupies its row and history.

**Given** one Member and two active resources
**When** overlapping times are booked on the different resources
**Then** both bookings succeed (DEC-15)
**And** `start > now` is the deliberate reading of AD-5 (the PRD default DEC-08 says `start ≥ now`) listed for Jo at Gate S00-CP.

### Story 4.2: Guarantee exclusivity under concurrency

As a Member,
I want a double booking to be impossible even when two people click at the same moment,
So that a confirmed booking is really mine.

**Acceptance Criteria:**

**Given** a barrier-started burst of parallel HTTP requests from two different Members to a listening server on a temporary database, for the same resource and interval
**When** all requests complete
**Then** exactly one returns 201 and the rest return 409 `BOOKING_CONFLICT`, there is one booking row and one activity event, for any interleaving (`[BOK-04]`, `[E2E-03]`)
**And** the suite runs in a single worker and repeats the burst 20 times.

**Given** a second operating-system process holding a `BEGIN IMMEDIATE` write lock
**When** it releases within the timeout, and when it outlives the timeout
**Then** the API request waits and then answers 201 or 409 correctly in the first case and 503 `DATABASE_BUSY` with `Retry-After: 1` in the second, with no partial data
**And** the child process is always awaited and killed on test failure.

**Given** a direct overlapping insert by a second connection, a fault-injected activity writer, and an archive running against a concurrent create
**When** each is attempted
**Then** the trigger aborts with `BOOKING_OVERLAP` and the repository maps it to 409, the failed writer leaves no booking row (`[BR-5]` transaction integrity), and archive-versus-create ends with either a refused archive or a refused booking, never both succeeding
**And** replaying an identical create after success is a conflict, not an idempotent success.

### Story 4.3: Read bookings

As a Member,
I want to list my bookings and open one by id,
So that I can see what I have booked and why a request changed.

**Acceptance Criteria:**

**Given** `GET /api/bookings` as a Member
**When** `scope=mine`, `group=upcoming` or `past`, `status[]`, `expired`, `resourceId` and `limit` are used
**Then** results contain only the caller's bookings as `BookingDto` (for an Administrator reading `scope=all`, also `booker.name`, `purpose` and `createdAt`) with embedded resource summary, `expired`, `decision` and `cancellation`, upcoming meaning `isUpcoming` sorted by `start` ascending, past and default by `start` descending with `id` following the direction, and `{ items, truncated }` with limit default 100, max 200 (`[VIS-02]` data)
**And** an empty result is `[]`.

**Given** `scope=all`
**When** an Administrator requests `status=pending`
**Then** all requesters' pending bookings return by `start` ascending including Expired ones flagged `expired: true`, and a Member sending `scope=all` receives 403 `FORBIDDEN`
**And** an Administrator's `scope=mine` shows only their own bookings.

**Given** `GET /api/bookings/:id`
**When** the owner, an Administrator and another Member request it
**Then** owner and Administrator receive the booking with `booker.name` for Administrators, `createdAt`, `decision`, `cancellation` and the booking's events from `listEventsForBooking`, and the other Member receives 403 for every status, a missing id 404
**And** a Member never receives a 409 or other state-dependent error for a booking they may not read.

### Story 4.4: The schedule read model

As a Member,
I want to see when a resource is taken without learning who took it,
So that I can pick a free time while other people's bookings stay private.

**Acceptance Criteria:**

**Given** `GET /api/resources/:id/schedule?from=2026-10-19&days=7`
**When** the caller is a Member
**Then** blocks for `pending` and `confirmed` bookings overlapping the Oslo week `[Monday 00:00, next Monday 00:00)` return in start order with ISO instants, own bookings as `kind: "detail"` and others as `kind: "anonymous"` carrying only `status` and the interval (`[VIS-01]`)
**And** the exact key sets of both shapes are asserted and cancelled or rejected bookings never appear.

**Given** an Administrator
**When** the same call is made
**Then** every block is `detail` with booker and purpose
**And** an archived resource's schedule is still readable.

**Given** the weeks of 2026-10-25 and 2027-03-28 (169 h and 167 h) and `days` values 1 to 7
**When** blocks are requested
**Then** day and week ranges come from `osloWeekRange`/`osloDayRange`, never `+ 24 h`, and a malformed `from` or `days=8` returns 400
**And** the slot model in contracts marks a slot taken when any block overlaps it half-openly.

### Story 4.5: S03 evidence pack — daylight saving, time rules and the early scenarios

As the pilot owner,
I want the time rules and the first acceptance scenarios proved at API level,
So that I can accept S03 on named evidence before any booking screen exists.

**Acceptance Criteria:**

**Given** the fixed clock `2026-10-19T07:00:00Z`
**When** bookings are created on 2026-10-24, 2026-10-26 and (with a clock set in-test) around 2027-03-28
**Then** the stored instants are correct on both sides of each switch, a booking at the last bookable start `2026-11-18 08:00` Oslo succeeds and a start at 08:30 on the same day fails with the horizon error, and the suite passes under a second `TZ`
**And** tests are titled `[BR-1]` and `[BOK-02]`.

**Given** the early scenarios at API level (Playwright `request` fixture or `app.inject`, same ids)
**When** E2E-01, E2E-02, E2E-03 and E2E-07 run
**Then** a Member books a free slot and sees it in `GET /api/bookings` and the schedule; an overlapping request is refused with the existing booking unchanged; the simultaneous request pair yields exactly one success; a Member calling every admin route directly gets 403 with no change
**And** `trace.mjs` shows `BOK-01`, `BOK-02`, `BOK-03`, `BOK-04`, `BOK-05`, `BR-1` and `E2E-01/02/03/07` (API parts) passing at the S03 commit.

**Given** the S03 stories are complete
**When** the F2 contract files (`activity.ts`, `dashboard.ts` and the schedule DTO exports, owned by S03 until acceptance) are finalised
**Then** their round-trip tests are updated and the F2 package (contracts content hash and the DTO lists for activity, dashboard and schedule) is presented to Jo with the S03 evidence
**And** the contracts are frozen when Jo runs `accept-slice.mjs S03`, after which Jo records the PIL-06 decision (two or three agents) in the pilot log and S04, S05 and S06 may start independently.

**Given** all stories of slice S03 have `implemented`, `tested` and `reviewed` ledger entries on the slice tip
**When** the orchestrator runs `merge-gate.mjs slice/s03` and Jo then runs `accept-slice.mjs S03`
**Then** `s03-integrated` and `s03-accepted` exist, the ledger shows `accepted`, every story of the slice is `done`, and `pilot-log.md` has an entry (date, SHA, waiting time) written on main
**And** Jo records the PIL-06 decision (two or three agents) in the pilot log and S04, S05 and S06 may start independently from `s03-accepted`.

### Story 4.6: Slot picker and roving grid

As a Member,
I want to pick a start and end on a clear, keyboard-friendly grid,
So that I cannot choose a time that cannot be booked.

**Acceptance Criteria:**

**Given** a resource and date
**When** the picker renders
**Then** 28 half-hour slots from 08:00 to 22:00 appear as a `role="grid"` with one roving tab stop (`useRovingGrid`, added to `ui/` as a new file), cells named with whole words ("klokken 10:00, ledig", "klokken 09:00, opptatt", "klokken 08:00, passert"), taken and past slots disabled and struck through
**And** slots beyond `now + 30 × 24 h` on the last selectable date are disabled with the name "klokken 14:00, utenfor bookingvinduet" and the hint "Du kan booke inntil 30 døgn frem i tid.".

**Given** the selection rules
**When** the user activates 10:00, then 10:30, then a later free slot, then the start again
**Then** the summary reads "Valgt: 10:00–10:30, 30 min", then "Valgt: 10:00–11:00, 1 t", moves the end, and clears everything; the live region mirrors it in whole words ("Valgt: 10:00 til 11:00, 1 time")
**And** the picker refuses an end that crosses a taken slot, exceeds 4 hours or precedes the start and says why under the grid with an icon.

**Given** availability is loading or fails
**When** the picker renders
**Then** a skeleton of the slot grid appears after 150 ms or a "Prøv igjen" alert keeps the last good data (`[UI-4]`)
**And** the day caption uses the shared formatters (`[UI-5]`).

**Given** a day with no free slot
**When** the picker renders
**Then** every slot is disabled with "Ingen ledige tider denne dagen. Velg en annen dato."
**And** arrow keys, Space and Enter work, the component passes axe at both widths, and it uses only contract helpers (`buildSlots`, `validateSelection`) for logic.

### Story 4.7: Booking sheet

As a Member,
I want a sheet where I choose the resource, date and time and send my booking,
So that I can book from anywhere in the app.

**Acceptance Criteria:**

**Given** `useBookingSheet().open({ resourceId?, date?, start?, purpose?, lockResource? })`
**When** it is called from Ressursdetalj, the calendar, Hjem or Mine bookinger
**Then** the Booking sheet opens with resource fixed when locked or a resource select first otherwise, a note "Krever godkjenning. Forespørselen må godkjennes av en administrator før den er bekreftet." for approval-gated resources, the native date field (`min`/`max` from the Oslo date of `serverNow`) with the day-in-words caption, the slot picker and a purpose field with a 200-character counter
**And** the submit label is "Book" or "Send forespørsel" accordingly (`[BOK-01]`, `[BOK-07]`).

**Given** a valid submission
**When** it succeeds
**Then** inputs are read-only while the button shows a spinner with `aria-disabled`, the sheet closes with focus returning to the trigger, and the toast "Bookingen er bekreftet." (with "Vis i Mine bookinger" and "Lukk") or "Forespørselen er sendt til godkjenning." appears
**And** the schedule, bookings and dashboard queries refetch through the invalidation map.

**Given** a 409 conflict
**When** the response arrives
**Then** the inline alert "Tidsrommet er ikke lenger ledig. Velg et annet tidspunkt." receives focus, the picker reloads and clears the selection, and the purpose text is kept
**And** while availability loads the picker shows its skeleton (`[UI-4]`), a 400 shows per-field errors, an archived resource shows "Ressursen er ikke lenger tilgjengelig." with submit disabled by state, and 401 returns to sign-in.

### Story 4.8: Booking detail sheet

As a Member or Administrator,
I want to open one booking and see its status, reason and history,
So that I understand what happened to it and what I can still do.

**Acceptance Criteria:**

**Given** `?booking=<id>` on any route, a row, a calendar block, a toast link or an activity link
**When** the host opens
**Then** the Booking detail sheet shows resource name and tile, the long-form status badge, a key–value list (Tidspunkt, Varighet, Formål, Plassering, and "Booket av" for Administrators), the "Historikk" mini timeline, and survives refresh and Back
**And** it uses its own query and refetches on open.

**Given** the sheet is loading
**When** the request is pending
**Then** a skeleton of the key–value list appears after 150 ms (`[UI-4]`)
**And** dates and durations use the shared formatters (`[UI-5]`).

**Given** a rejected or Administrator-cancelled booking (created by inserting rows through the S00 booking-fixture helper, never through S05 endpoints)
**When** it opens
**Then** a bordered "Begrunnelse" card shows the reason verbatim with the attribution "Avslått av Sofie Lund · fre. 16. okt. 11:20", and an Expired or late-rejected request shows "Forespørselen ble ikke behandlet før starttidspunktet." above it
**And** the status changed since the list loaded shows an info alert "Statusen er oppdatert.".

**Given** the footer
**When** it renders
**Then** it renders "Book igjen" itself when the booking is past or in a final status and hosts the frozen `BookingActions` slot obtained from the slot hook for "Avbestill" only, without importing Epic 5 code
**And** a 404 shows "Fant ikke bookingen." with "Til Mine bookinger", a 403 shows "Ingen tilgang" inside the sheet, and axe passes at both widths.

### Story 4.9: Mine bookinger

As a Member,
I want a list of my bookings with upcoming first and an easy way to book again,
So that I can manage my time and repeat what worked.

**Acceptance Criteria:**

**Given** the page and bookings in every status inserted with the S00 booking-fixture helper
**When** it loads
**Then** "Kommende" lists my `pending` and `confirmed` future bookings by start, "Tidligere" lists everything else (in-progress, cancelled, rejected, Utløpt, past) newest first and is hidden when empty, rows show tile, resource, time, purpose and status badge, and tapping a row opens `?booking=` (`[VIS-02]`)
**And** an empty "Kommende" shows "Ingen kommende bookinger." with "Finn en ressurs".

**Given** "Book igjen" on a past or final row
**When** it is activated
**Then** the Booking sheet opens with resource and purpose prefilled and the date empty (`[BOK-08]`)
**And** "Ny booking" in the page header opens the sheet with a resource select first.

**Given** the rows
**When** they render
**Then** each `BookingRow` receives its `actions` node from the `BookingActions` slot hook, so "Avbestill" appears for cancellable bookings once the owning slice implements it; the S04 test uses the slot stub (`[VIS-02]` cancel half is evidenced in S05 and S07)
**And** "Book igjen" is rendered by the row.

**Given** loading, error and offline states
**When** they occur
**Then** four skeleton rows, the "Prøv igjen" alert and the offline alert appear as specified
**And** the page passes axe at 375 and 1440 px.

### Story 4.10: Calendar week grid and blocks

As a Member,
I want a week calendar for one resource,
So that I can see availability at a glance.

**Acceptance Criteria:**

**Given** `/kalender?ressurs=&uke=`
**When** it loads
**Then** the toolbar has a resource select (default the last viewed resource id kept in guarded `localStorage`, else the first room; "Velg en ressurs" prompt on first visit), the week title "Uke 43 · 19.–25. okt. 2026" with previous, "I dag" and next buttons moving whole weeks, and the grid with weekday headers, a today marker, the time gutter, the now-line and the today wash; `uke=` is the Monday civil date and both parameters survive refresh (`[VIS-01]`)
**And** past days are shown but their cells are `aria-disabled`.

**Given** bookings in every state (inserted with the S00 booking-fixture helper)
**When** the blocks render
**Then** own confirmed, own pending (dashed), other "Reservert" and other-pending (hatched) blocks follow the specified content rules, Administrators see booker and purpose, and blocks under 30 minutes show the title only
**And** the week of 2026-10-25 renders 25-hour Sunday correctly in the grid.

**Given** loading, error and offline states
**When** they occur
**Then** grid lines without blocks, the "Prøv igjen" alert with the last good week kept, and the offline alert appear as specified (`[UI-4]`)
**And** the page passes axe at 1440 px.

### Story 4.11: Calendar block interactions

As a Member or Administrator,
I want to act on the calendar by clicking blocks and free cells,
So that I can book or inspect straight from the week view.

**Acceptance Criteria:**

**Given** a free future cell
**When** it is clicked
**Then** the Booking sheet opens through `useBookingSheet().open({ resourceId, date, start })` prefilled with that resource, date and half hour
**And** a past cell does nothing.

**Given** a block
**When** an own block (or any block as Administrator) is clicked
**Then** the Booking detail sheet opens via `?booking=`, and for another Member's block the non-modal Popover opens with "Reservert" and the time only (CR-2), closes on Escape or outside click and returns focus to the block
**And** no other Member's booker or purpose is present in the DOM.

**Given** a new booking made from the calendar
**When** the sheet closes
**Then** the new own block appears after the schedule refetch without a reload.

### Story 4.12: Calendar keyboard model and Ledige tider

As a keyboard or screen-reader user,
I want to move through the calendar without a mouse,
So that every free slot is reachable and understandable.

**Acceptance Criteria:**

**Given** the calendar body
**When** it has focus
**Then** it is a `role="grid"` using `useRovingGrid` with one roving tab stop, arrows move by cell, Home/End jump to 08:00 and 21:30, PageUp/PageDown change week, Enter on a free future cell opens the Booking sheet prefilled and Enter on a block opens its detail or popover
**And** cell names read "mandag 19. oktober, klokken 10:00, ledig", "…, Reservert", "…, Din booking: Kundemøte Nordlys" or "…, passert".

**Given** the "Ledige tider" button beneath the grid
**When** it is activated
**Then** one heading per day expands with that day's free ranges ("09:30–13:00") as buttons that open the Booking sheet prefilled with the range start, and "Ingen ledige tider" appears for a full day
**And** the linear DOM order is chronological so a screen reader can browse it.

**Given** scroll padding of 56 px top and 64 px bottom
**When** a cell is focused near the bars
**Then** it is never covered (WCAG 2.4.11)
**And** the page passes axe at 1440 px and 375 px.

### Story 4.13: Mobile week strip and day timeline

As a Member on a phone,
I want to pick a day in the week and see that day's timeline,
So that the calendar is usable at 375 px without horizontal scrolling.

**Acceptance Criteria:**

**Given** a viewport below 768 px
**When** the calendar renders
**Then** a `tablist` of seven day chips (a new `ui/Tabs.tsx` wrapper) shows weekday, day number and up to three booking dots, arrow keys move between chips, the selected day is `primary`-filled, and previous and next move whole weeks (`[VIS-01]` mobile reading as approved by Jo)
**And** below it the single-day timeline reuses the calendar body with one column and the same cell names.

**Given** the day timeline
**When** a free cell or a block is activated
**Then** the same Booking sheet, detail sheet and popover behaviour as on desktop applies, and the sheet is full-screen
**And** nothing scrolls horizontally and the page passes axe at 375 px.

### Story 4.14: Availability strip on the resource page

As a Member,
I want to see today's availability on a resource's page,
So that I know whether it is free before I open the booking sheet.

**Acceptance Criteria:**

**Given** `/ressurser/:id` for an active resource
**When** the page loads
**Then** the `AvailabilityStrip` seam implemented by S04 shows 28 segments for 08:00–22:00 as free, taken ("Reservert") and own ("Din booking") with hour labels and the legend, each segment with an accessible name ("Ledig, klokken 10:00 til 10:30"), non-interactive, from one schedule request for today
**And** a fully booked day shows "Ingen ledige tider i dag." with "Se i kalender".

**Given** the strip colours
**When** they render
**Then** free is white with a border, taken is hatched neutral with a dashed outline, own is `primary-subtle`, and no green is used
**And** after a successful booking from the Booking sheet (Story 4.7) the strip already shows the new "Din booking" segment.

**Given** the seam
**When** the implementation is registered
**Then** only `features/bookings/**` changes; the S02 resource detail page, `app/` and `api/` are untouched
**And** the page passes axe at both widths.

### Story 4.15: S04 browser evidence — Flow 1 and the conflict path

As the pilot owner,
I want the first booking journey proved in a real browser, including the lost race,
So that I can accept S04 on evidence.

**Acceptance Criteria:**

**Given** the Playwright harness signed in as Ingrid
**When** the spec follows Flow 1 (Ressurser → filter Rom → Fjellet → Book → 10:00–11:00 → "Kundemøte Nordlys" → Book)
**Then** the toast "Bookingen er bekreftet." appears, the strip shows "Din booking", the booking is `confirmed` in Mine bookinger and as an own block in the calendar (`[E2E-01]` browser)
**And** the calendar variant (click the empty 10:00 cell) reaches the same result.

**Given** another Member books the same slot first through the API
**When** Ingrid submits
**Then** the 409 alert appears, the picker reloads with 10:00 struck through and the purpose text is kept; the existing booking is unchanged (`[E2E-02]` browser)
**And** keyboard-only use completes both paths at 375 px.

**Given** S04 complete on `slice/s04`
**When** `trace.mjs` runs with `FELLES_SLICE=S04`
**Then** the MUST parts of the S04 rows of the Story Index (BOK-01 UI, BOK-07, VIS-01, VIS-02 and the browser parts of E2E-01 and E2E-02) all pass and BOK-08 (SHOULD) is reported if missing, and axe is clean on Kalender, Mine bookinger and Ressursdetalj at both widths.

**Given** all stories of slice S04 have `implemented`, `tested` and `reviewed` ledger entries on the slice tip
**When** the orchestrator runs `merge-gate.mjs slice/s04` and Jo then runs `accept-slice.mjs S04`
**Then** `s04-integrated` and `s04-accepted` exist, the ledger shows `accepted`, every story of the slice is `done`, and `pilot-log.md` has an entry (date, SHA, waiting time) written on main
**And** the integration cost of the parallel slices so far is noted for the PIL-06 decision.

## Epic 5: Approvals and cancellations

Administrators work an approval queue (approve, reject with a reason, reject Expired requests); Members see the outcome and the reason; owners and Administrators cancel bookings under the rules, with every transition race-safe and audited. Slice S05, built by one agent on `slice/s05` with the stories as serial commits and landed as a unit; every story depends on the acceptance of S03 and on nothing in Stories 4.6–4.15 (S04) or Epic 6, so S04, S05 and S06 are independently executable. The `BookingActions` slot and the `?booking=` host are S00 stubs; S05 fills the slot and does not edit S04 files.

### Story 5.1: Approve or reject a request

As an Administrator,
I want to approve or reject another person's pending request,
So that shared resources are used fairly and the requester knows the outcome.

**Acceptance Criteria:**

**Given** a `pending` booking owned by someone else with a start in the future
**When** an Administrator calls `POST /api/bookings/:id/approve`
**Then** the status becomes `confirmed` by a compare-and-set update, `decided_by_user_id` and `decided_at` are set once, one `booking.approved` event is written in the same transaction, and the slot stays blocked throughout (`[APP-02]`, `[BOK-05]`)
**And** the use case orders `policy.can`, then status, then start, then write.

**Given** the same call by the booking's owner who is an Administrator
**When** approve or reject is attempted
**Then** the response is 403 `OWN_REQUEST` and the status is unchanged (`[E2E-09]` API, `[APP-02]`)
**And** a Member calling either route gets 403 `FORBIDDEN`.

**Given** a start that has passed (an Expired request)
**When** approve is called
**Then** the response is 409 `BOOKING_STARTED` with `details.currentStatus: "pending"` and the booking stays `pending` (`[APP-03]`, CR-3)
**And** reject on the same booking succeeds with a reason.

**Given** `POST /api/bookings/:id/reject`
**When** the reason is empty or over 200 characters
**Then** the response is 400 with a `reason` field error (`[BR-4]`); with a valid reason the status becomes `rejected`, `decision_reason` is stored, one `booking.rejected { reason }` event is written, and a new booking for the same interval then succeeds at once (`[APP-04]`)
**And** the owner's `GET /api/bookings/:id` shows the decision with reason, deciding Administrator and time.

**Given** a booking that is already `confirmed`, `rejected` or `cancelled`
**When** approve or reject is called
**Then** the response is 409 `BOOKING_NOT_PENDING` with `details.currentStatus` and no second event is written (`[APP-03]`)
**And** two Administrators approving at the same moment yield one 200 and one 409, and an approve racing a reject yields exactly one winner.

**Given** a pending booking whose resource has become archived (state built with the S00 booking-fixture helper, since AD-10 normally prevents it)
**When** approve is called
**Then** the response is 409 `RESOURCE_ARCHIVED` and the booking stays `pending` (`[BR-2]`, `[APP-03]`)
**And** reject on the same booking succeeds with a reason because rejecting needs no active resource (DEC-06).

**Given** an approval-gated resource
**When** a Member books and an Administrator approves
**Then** the interval is blocked from creation through approval and the booking is `confirmed` afterwards (`[BOK-05]`).

### Story 5.2: Cancel a booking

As a Member or Administrator,
I want to cancel a booking before it starts under clear rules,
So that the slot becomes free for others and the history keeps the record.

**Acceptance Criteria:**

**Given** a `pending` or `confirmed` booking owned by the caller with a future start
**When** `POST /api/bookings/:id/cancel` is called with no reason
**Then** the status becomes `cancelled`, `cancelled_by_user_id` equals the owner, one `booking.cancelled { reason: null, byRole }` event is written in the same transaction, the row and its events remain, and a new booking for the same interval then succeeds (`[BOK-06]`, `[E2E-06]` API)
**And** `rejected` and `cancelled` never block later bookings.

**Given** an Administrator cancelling another person's booking
**When** the reason is missing or empty
**Then** the response is 400 with a `reason` field error (`[BR-4]`); with a reason the cancellation is stored with the reason and shown to the owner in `GET /api/bookings/:id` (`[BOK-06]`, DEC-07)
**And** an Administrator cancelling their own booking needs no reason.

**Given** a booking whose start has passed, one already `cancelled` or `rejected`, and another Member's booking
**When** cancel is called
**Then** the responses are 409 `BOOKING_STARTED`, 409 `BOOKING_NOT_CANCELLABLE` with `details.currentStatus`, and 403 `FORBIDDEN` for every status of the foreign booking
**And** the check order is policy, status, start, write.

### Story 5.3: The Godkjenninger queue

As an Administrator,
I want a queue of pending requests I can approve or reject,
So that I can clear them quickly and see what is waiting.

**Acceptance Criteria:**

**Given** `/godkjenninger`
**When** an Administrator opens it
**Then** rows are sorted by start time with resource tile, requester, time range, purpose and "Sendt for 2 t siden"; Expired requests show the Utløpt badge with only "Avslå"; the Administrator's own request shows both buttons disabled with the visible text "Du kan ikke behandle din egen forespørsel."; and a Member opening the URL sees "Ingen tilgang" (`[APP-01]`)
**And** the empty queue shows "Ingen ventende forespørsler.".

**Given** "Godkjenn"
**When** it is activated
**Then** the row shows a spinner, leaves the list with the toast "Forespørselen er godkjent.", and the dashboard, bookings and activity queries refetch through the invalidation map
**And** a 409 shows the inline alert "Forespørselen er allerede behandlet." and the row disappears on the next refresh.

**Given** "Avslå"
**When** it is activated
**Then** the Reason dialog opens with focus in "Begrunnelse", the button "Avslå forespørsel" is `aria-disabled` until text exists, and on success the toast "Forespørselen er avslått." appears and the row leaves
**And** the page passes axe at 375 and 1440 px, rows stack on mobile, and the queue uses only `ui/` components and the S00 `BookingRow`.

**Given** a start that passed between page load and click, and an own request attempted through the API
**When** approve is activated or the API is called
**Then** inline alerts show the approved messages for `BOOKING_STARTED` and "Du kan ikke behandle din egen forespørsel."
**And** the page shows a skeleton of three rows, the "Prøv igjen" alert and the offline alert as specified (`[UI-4]`), with times and counts from the shared formatters (`[UI-5]`).

### Story 5.4: Booking actions — cancel

As a Member or Administrator,
I want the cancel action to appear wherever a booking appears,
So that I can cancel from a list or from its details.

**Acceptance Criteria:**

**Given** the frozen `BookingActions` props (`booking`, `viewer`, `placement`, `onChanged`) rendered in isolation with component tests
**When** it is rendered for each status, owner and time combination
**Then** "Avbestill" appears only for `pending` or `confirmed` bookings with a future start and for an owner or an Administrator, an Expired request offers no cancel, and every other combination renders nothing (`[VIS-02]` cancel half, `[BOK-06]`)
**And** the component imports nothing from `features/bookings`, does not render "Book igjen" (that belongs to `BookingRow`), and does not duplicate the approve and reject buttons of the queue.

**Given** "Avbestill" on the viewer's own booking
**When** it is activated
**Then** the Confirm dialog reads "Avbestille bookingen?" with resource and time in the body, "Behold" is focused, "Avbestill booking" is the danger action, and on success the toast "Bookingen er avbestilt." appears, `onChanged` is called and the bookings, schedule, dashboard and activity queries are invalidated through the map
**And** a 409 `BOOKING_STARTED` or `BOOKING_NOT_CANCELLABLE` shows its approved message inline and refetches.

**Given** an Administrator cancelling another Member's booking
**When** "Avbestill" is activated
**Then** the Reason dialog appears instead, the reason is required and sent as `reason`, and the stored cancellation is visible through `GET /api/bookings/:id` (Story 5.2)
**And** the seam entry `features/booking-actions/index.tsx` is the only file that exports the component, and the integration with the S04 list and detail sheet is proven in the S07 lifecycle evidence of Epic 7.

### Story 5.5: S05 evidence pack — transitions, races and roles

As the pilot owner,
I want the approval and cancellation scenarios proved at API level,
So that I can accept S05 on named evidence.

**Acceptance Criteria:**

**Given** the S05 API
**When** E2E-04, E2E-05, E2E-06 and E2E-09 run at API level
**Then** a Member books approval-gated equipment and another Administrator approves it (pending then confirmed, slot blocked throughout); an Administrator rejects with a reason, the Member reads the reason and the slot is freed, an Expired request is rejected with a reason and approval after start is refused; the Member cancels a future booking and the history is kept; an Administrator approving their own booking is refused
**And** each test title carries its requirement id and story tag.

**Given** the new routes
**When** the route-enumeration test runs
**Then** `approve`, `reject` and `cancel` are covered for 401, Member 403 and foreign-booking 403 for every status (`[E2E-07]` extension)
**And** the transition table test covers every legal and illegal pair and the database guards reject the illegal ones (`[NFR-03]` transitions, concurrent approval).

**Given** S05 complete
**When** `trace.mjs` runs with `FELLES_SLICE=S05`
**Then** APP-01 to APP-04, BOK-06 and the API parts of E2E-04, E2E-05, E2E-06 and E2E-09 pass, and the browser parts remain assigned to Epic 7.

**Given** all stories of slice S05 have `implemented`, `tested` and `reviewed` ledger entries on the slice tip
**When** the orchestrator runs `merge-gate.mjs slice/s05` and Jo then runs `accept-slice.mjs S05`
**Then** `s05-integrated` and `s05-accepted` exist, the ledger shows `accepted`, every story of the slice is `done`, and `pilot-log.md` has an entry (date, SHA, waiting time) written on main
**And** the integration cost of the parallel slices so far is noted for the PIL-06 decision.

## Epic 6: See what is going on

Members get a start page with their upcoming bookings; Administrators get the seven-day overview, the pending count, the top resources and the chart with its text alternative; the activity log shows each person what they are allowed to see. Slice S06, built by one agent on `slice/s06` with the stories as serial commits and landed as a unit; every story depends on the acceptance of S03 and on nothing in Stories 4.6–4.15 (S04) or Epic 5.

### Story 6.1: Dashboard figures

As an Administrator,
I want the seven-day overview figures from the server,
So that I can see load and waiting work at a glance.

**Acceptance Criteria:**

**Given** `GET /api/dashboard` as a Member
**When** called
**Then** it returns `{ upcoming, admin: null }` where `upcoming` is at most five of the caller's own `isUpcoming` bookings by start ascending, computed in the S06-owned `bookings-read.repository.ts` behind `BookingsReadPort`
**And** a Member sees no figure about other people.

**Given** an Administrator and the fixed clock
**When** called
**Then** `admin.pending` has `count` (approvable `pending`, including the Administrator's own, excluding Expired) and `expiredCount`, `confirmedNext7d` counts `confirmed` bookings with `end > now AND start < now + 7 × 24 h`, and `top` lists at most three resources by confirmed count with zero counts omitted, ties by `compareNb(name)` then id (`[VIS-03]`, `[VIS-04]`)
**And** boundary tests cover a booking ending exactly at now, starting exactly at now plus seven days and a tie between names starting with Å, Ø and Æ.

**Given** the chart series
**When** requested
**Then** exactly seven entries `{ date, confirmed, pending }` start today in Oslo days, bucketed by start day, zeros included, Expired requests excluded from `pending`, and an in-progress booking from yesterday is not charted
**And** the contract documents that the chart total may differ from `confirmedNext7d`, and the test fixtures (bookings inserted with the S00 booking-fixture helper) include an in-progress booking from yesterday.

### Story 6.2: Activity log API

As a Member or Administrator,
I want an activity feed scoped to what I may see,
So that I can follow what happened to my bookings, and Administrators can see everything.

**Acceptance Criteria:**

**Given** `GET /api/activity` as a Member
**When** events exist (created by inserting rows through the S00 booking-fixture helper, never through S05 endpoints) for the Member's and others' bookings and for resources
**Then** only events with `subject_user_id` equal to the caller are returned, including Administrators' approve, reject and cancel events on the Member's bookings, never resource events, ordered by id descending as structured items (type, actor name, booking or resource reference, resource name, reason, time) (`[VIS-05]`)
**And** the `bookingId` filter applies the same scope.

**Given** an Administrator
**When** the feed is requested
**Then** every event including resource changes is returned
**And** `before` is an event id, default `limit` 20, maximum 100, the response is `{ items, nextBefore }` with `nextBefore: null` at the end, and the cursor never skips or repeats events that share a timestamp.

**Given** the fixed clock
**When** the scoping tests run
**Then** Member and Administrator views are asserted for create, approve, reject, cancel and resource events, and an unauthenticated call returns 401
**And** payloads never contain `purpose`.

### Story 6.3: Hjem

As a Member or Administrator,
I want a start page that shows what is coming and what needs attention,
So that I know where I stand when I open FELLES.

**Acceptance Criteria:**

**Given** the start page
**When** it loads
**Then** it greets "Hei, {fornavn}", lists up to five upcoming bookings as `BookingRow`s opening `?booking=`, shows a resource grid with `ResourceCard`s and a primary "Ny booking" that calls `useBookingSheet().open({})`
**And** an empty list shows "Ingen kommende bookinger." with "Finn en ressurs" (`[VIS-03]`).

**Given** an Administrator
**When** the page loads
**Then** stat tiles show "Ventende godkjenninger" with a second line "+ 1 utløpt" when Expired requests exist, "Bekreftede bookinger" with the note "neste 7 dager" and the three most booked resources, and a "0 venter" stat is shown as normal, not empty
**And** the Godkjenninger pill in the navigation reads `admin.pending.count` through `usePendingCount()`, replacing the S00 stub.

**Given** the upcoming rows
**When** they render
**Then** each `BookingRow` receives its `actions` node from the `BookingActions` slot hook and opens `?booking=` on tap
**And** "Book igjen" is rendered by the row.

**Given** loading and per-panel failure
**When** one panel fails
**Then** that panel shows its alert while the others render, and the page passes axe at 375 and 1440 px.

### Story 6.4: Activity chart with a text alternative

As an Administrator,
I want a chart of the coming week's booking activity that everyone can read,
So that I can see the shape of demand without relying on colour or sight.

**Acceptance Criteria:**

**Given** the Hjem Administrator panel
**When** the chart renders
**Then** a hand-rolled SVG shows seven stacked columns with confirmed in `primary` and pending as `warning-subtle` with a dashed `warning` outline, weekday captions and a legend, with no animation on load (`[VIS-06]`)
**And** the chart has `role="img"` and an `aria-label` summarising the week.

**Given** the "Diagram | Tabell" segmented control
**When** "Tabell" is chosen
**Then** a real table shows the same seven rows and numbers, and the choice is remembered per browser using try/catch storage
**And** a day with no bookings still shows its row and an empty column.

**Given** greyscale or forced-colours viewing
**When** the chart is inspected
**Then** pending remains distinguishable by its dashed outline and the component passes axe at both widths.

### Story 6.5: Aktivitet

As a Member or Administrator,
I want a timeline of activity I can scroll back through,
So that I can see who did what and when.

**Acceptance Criteria:**

**Given** `/aktivitet`
**When** it loads
**Then** a `Timeline` groups items under day eyebrows, each item showing the actor in strong text, the verb, the entity link (to `?booking=` or Ressursdetalj) and the time, built from structured items and the status vocabulary (`[VIS-05]`)
**And** a Member sees only their own bookings' events and an Administrator sees all, including resource changes.

**Given** more events exist
**When** "Vis flere" is activated
**Then** the next batch is appended using `nextBefore` and focus stays on the control or the first new item
**And** the empty state reads "Ingen aktivitet ennå.".

**Given** loading, failure and offline
**When** they occur
**Then** six skeleton items, the "Prøv igjen" alert and the offline alert appear as specified
**And** the page passes axe at 375 and 1440 px.

**Given** all stories of slice S06 have `implemented`, `tested` and `reviewed` ledger entries on the slice tip
**When** the orchestrator runs `merge-gate.mjs slice/s06` and Jo then runs `accept-slice.mjs S06`
**Then** `s06-integrated` and `s06-accepted` exist, the ledger shows `accepted`, every story of the slice is `done`, and `pilot-log.md` has an entry (date, SHA, waiting time) written on main
**And** the integration cost of the parallel slices so far is noted for the PIL-06 decision.

## Epic 7: A finished product the pilot owner can accept

The integrated product passes every mandatory scenario in the browser, meets the accessibility and responsiveness bar at 375 and 1440 px, has swept routes and permissions, a fresh-clone README and a macOS runtime smoke, and the release gate shows evidence for every MUST with the full requirement-to-evidence trail. Slice S07, built by one agent on `slice/s07`; depends on the acceptance of S04, S05 and S06. It adds no features; any defect it fixes is fixed in the owning story's files in a commit carrying a `Fixes: N.M` trailer.

### Story 7.1: Sweep every route and permission

As the pilot owner,
I want every route and role combination checked once more on the integrated product,
So that no unauthenticated read or Member write has slipped in.

**Acceptance Criteria:**

**Given** the integrated server and the test families required by NFR-03 (collisions, concurrent booking, roles, transitions, transaction integrity, UTC and local time)
**When** `trace.mjs` lists them and the route-enumeration test runs with `FELLES_FORBID_501=1`
**Then** each NFR-03 family has at least one passing named test (`[NFR-03]`), no contracted route answers `NOT_IMPLEMENTED`, every non-public route answers 401 without a session, and every `admin` route answers 403 for a Member with no data change (`[E2E-07]` final sweep, `[BR-6]`)
**And** every foreign-booking action answers 403 for a Member for every booking status.

**Given** Member-visible responses
**When** their key sets are inspected
**Then** anonymous schedule blocks, error bodies and the Member dashboard and activity contain no foreign identity or purpose
**And** a log inspection of the run shows no password, session id or purpose.

### Story 7.2: Booking lifecycle in the browser

As the pilot owner,
I want Flows 2 to 5 proved end to end in a real browser on the integrated product,
So that approval, rejection, cancellation and the own-request rule work for real users.

**Acceptance Criteria:**

**Given** Ingrid and Magnus in the Playwright harness
**When** Flow 2 and Flow 3 run
**Then** Ingrid's request for approval-gated equipment shows "Venter" in Mine bookinger, Magnus approves it from Godkjenninger, the count pill drops, her row reads "Bekreftet" and the activity log records the approval (`[E2E-04]` browser)
**And** the double-processing path shows "Forespørselen er allerede behandlet.".

**Given** Flow 4 and the Expired variant
**When** Sofie rejects with a reason
**Then** Ingrid's Booking detail sheet shows the reason and attribution, the slot is bookable again, and an Expired request can only be rejected (`[E2E-05]` browser)
**And** Magnus's own request has disabled buttons with the visible text and a direct API attempt is refused (`[E2E-09]` browser).

**Given** Flow 5
**When** Ingrid cancels tomorrow's booking from Mine bookinger and from the Booking detail sheet, and Magnus cancels Jonas's booking with a reason
**Then** the rows move to "Tidligere" with "Avbestilt", the slots are free, the reason reaches Jonas, and history is kept (`[E2E-06]` browser)
**And** the `BookingActions` of S05 renders inside the S04 detail sheet and list rows through the seam, with the same results.

### Story 7.3: Resources, dashboard and activity in the browser

As the pilot owner,
I want the administration journey and the overview pages proved in a real browser,
So that the Administrator's work is verified as a whole.

**Acceptance Criteria:**

**Given** Magnus in the Playwright harness
**When** Flow 6 runs
**Then** an empty name shows "Navn er påkrevd.", a valid resource is created and appears in the catalogue, archiving Fjorden with a confirmed booking tomorrow is refused with the alert and link, archiving the active "Gammel projektor" succeeds, and the archived resource disappears from Ressurser and from the Booking sheet select while its history stays (`[E2E-08]` browser)
**And** an archived resource cannot be booked.

**Given** the integrated Hjem and Aktivitet pages
**When** they are checked as Member and Administrator
**Then** the figures match the seeded fixed-clock data, the chart and its table agree, the "+ 1 utløpt" line and pill behave as specified, and the activity log shows each role only what it may see (`[VIS-03]`, `[VIS-04]`, `[VIS-05]` browser checks)
**And** the navigation pill updates after an approval without a reload.

### Story 7.4: Accessibility and responsiveness verification

As the pilot owner,
I want the accessibility floor verified across all eight surfaces,
So that the product meets WCAG 2.2 AA where practical and works on a phone.

**Acceptance Criteria:**

**Given** all eight surfaces at 375 px and 1440 px
**When** the axe helper runs
**Then** it reports no violations, and no surface scrolls horizontally (`[UI-2]`, `[UI-3]`)
**And** the 768–1023 px band does not break.

**Given** the E2E-10 keyboard walk at 375 px
**When** it runs
**Then** a keyboard-only user signs in, finds a resource, books, cancels and reads a form error with visible focus, scroll padding keeping the focused element clear of the bars, and critical actions reachable (`[E2E-10]`)
**And** reduced motion removes transitions and shimmer.

**Given** the screen-reader pass of the Slot picker, the Calendar grid and the Booking detail sheet
**When** a tester completes the checklist
**Then** the checklist items (landmarks and headings announced, grid cell names read in whole words, selection summary announced, refusal reasons announced, focus order and return, dialog and sheet labels, status changes announced) are each marked pass or fail in `manual-evidence/UI-3.md` with the tested parent commit, tool, tester and findings, and any defect found is fixed in the owning story's files in a commit with a `Fixes: N.M` trailer or listed as residual work
**And** colour contrast of tokens is rechecked against the DESIGN.md ratios.

### Story 7.5: Lookups feel responsive

As a Member,
I want lists and schedules to respond promptly,
So that the app feels finished even though no load test is required.

**Acceptance Criteria:**

**Given** the seeded database on the development machine
**When** `GET /api/resources`, `/api/bookings`, the schedule, the dashboard and the activity feed are each requested 50 times
**Then** the 95th percentile of each is recorded and stays under the pilot target of 200 ms (not a PRD requirement; NFR-06 asks only for responsive lookups), with `EXPLAIN QUERY PLAN` showing index use for the overlap and list queries (`[NFR-06]`)
**And** the result is stored as `manual-evidence/NFR-06.md` with commit and machine, and any slow query is fixed in the owning story's files with a `Fixes: N.M` trailer or listed as residual work.

### Story 7.6: README and fresh-clone start

As a new developer or agent,
I want a README that starts the project with no other context,
So that the pilot can be repeated by someone else.

**Acceptance Criteria:**

**Given** the final README
**When** a tester follows it from a fresh clone on Windows with only Node 24
**Then** `npm ci`, `npm run setup:native`, `npm run db:seed`, `npm start` bring FELLES up, the development credentials are listed as development-only, `demo:reset` and its warning are documented, and the test and verification commands are explained (`[NFR-05]`, `[RUN-1]`)
**And** the result is recorded in `manual-evidence/NFR-05.md` with commit, tester and time taken.

**Given** the README
**When** reviewed
**Then** it documents the slice workflow (ownership check, merge gate, acceptance tags), the environment variables, the stack note and the known residual work
**And** it states that no external service or secret is needed.

### Story 7.7: macOS runtime evidence and CI parity

As the pilot owner,
I want NFR-01 proved on macOS,
So that the product really runs on the platform the spec names.

**Acceptance Criteria:**

**Given** the CI workflow on the GitHub remote
**When** it runs on the S07 commit
**Then** `verify:full` is green on Windows, Linux and macOS and the macOS job's `smoke.mjs --require-full` seeds, starts the real `start.mjs`, logs in, creates one booking and sees one conflict refused with no pending phase (`[NFR-01]`)
**And** the run URL and result are recorded in `manual-evidence/NFR-01.md`, citing the macOS `smoke.mjs --require-full` step of the CI run on the parent commit, which runs independently of the trace step.

**Given** open question OQ-5 of the PRD
**When** Jo decides whether a real Mac is also required
**Then** the decision is recorded in `pilot-log.md` before `slice/s07` is branched and copied as the first lines of `manual-evidence/NFR-01.md` in the first S07 commit and, if required, a manual smoke test on a real Mac is added to the same evidence file
**And** without macOS evidence NFR-01 cannot reach `verified` and the story stays open.

### Story 7.8: Release gate and the evidence pack

As the pilot owner,
I want one command that shows evidence for every mandatory requirement and a trail I can walk on screen,
So that I can decide whether to accept the product and judge the workflow.

**Acceptance Criteria:**

**Given** the final commit
**When** `npm run verify:release` runs
**Then** typecheck, lint, tests, build, Playwright and `trace.mjs --release` pass, every MUST evidence part has a passing automated test or a valid manual-evidence file, and `trace.json` is written for the commit SHA (`[PIL-13]`)
**And** SHOULD requirements not delivered are listed explicitly as residual work.

**Given** one accepted MUST chosen by Jo
**When** the trail is opened
**Then** requirement, story, why it was chosen, agent run, commit, test evidence and acceptance record are shown on screen from the repository and the pilot log (`[PIL-08]`, ORK-08)
**And** the pilot log holds the per-story metrics (wall clock, waiting for acceptance, agent runs, interventions, failures, review findings, tokens or `unknown`) for ORK-09.

**Given** the pilot success criteria
**When** each ORK criterion is reviewed
**Then** its status is `verified` or its gap is explained in the pilot log
**And** the counter-metric is answered in writing from data: `trace.json` shows zero skipped, todo or only tests, every story ledger holds `implemented`, `tested` and `reviewed` entries, and no slice was accepted before its gate passed.

**Given** all stories of slice S07 have `implemented`, `tested` and `reviewed` ledger entries on the slice tip
**When** the orchestrator runs `merge-gate.mjs slice/s07` and Jo then runs `accept-slice.mjs S07`
**Then** `s07-integrated` triggers `release.yml`, which runs `verify:release`, and Jo's acceptance runs it again; `s07-accepted` exists, every story is `done`, and `pilot-log.md` has the entry
**And** the residual-work list (undelivered SHOULD parts) is part of the acceptance record.

## Story Index (task cards, PIL-05)

Every story belongs to exactly one slice. This index carries the PIL-05 task-card fields that the template does not hold; it is the source from which `requirements.json` (Story 1.19) and `ownership.json` (Story 1.22) are generated. *Owns* cells are path globs only (most specific glob wins; the default rules of Story 1.22 cover what a cell leaves out). Each path has one owner at any time; a path an S00 row creates for another slice is a `(stub)` recorded as `createdBy: S00` and owned by the later slice after `s00-accepted`; anything not listed is frozen or another slice's. `README.md` and `manual-evidence/**` belong to S00 until `s00-accepted` and to S07 afterwards.

### Branching and integration model

- One agent builds one slice on `slice/sNN` in one worktree; stories are serial commits (or short `story/N.M` branches merged into the slice branch after `npm run verify`, the story's tests and the ownership check). Parallel slices (S01 ∥ S02, S04 ∥ S05 ∥ S06) are separate branches and worktrees.
- Within the slice each story has its own tests, its own ledger entries and a green `npm run verify` before the next story starts; the merge gate lands the whole slice on `main` once every evidence part of the slice passes. A story that depends on another story of the same slice depends on its commit on the slice branch; a story that depends on another slice depends on that slice's `sNN-accepted` tag.
- S00 bootstrap: stories 1.1–1.29 are verified with `npm run verify` and their own tests because the gate does not exist yet; Story 1.30 performs the first real gate run, and Jo then accepts S00.

### State model

- **Story state** is the sprint-status value (`backlog`, `ready-for-dev`, `in-progress`, `review`, `done`). Story ledger entries `implemented`, `tested` and `reviewed` cite the slice-branch commit and are written on main by `scripts/ledger.mjs` (Story 1.23), driven by a human or by Agent Orchestrator; agent completion is at most `implemented` (PIL-03). `done` is set by `accept-slice.mjs` for every story of a slice in the same act as Jo's acceptance; between `integrated` and `accepted` all its stories show `review`, as intended.
- **Slice state** is `integrated` (landed by the merge gate with all slice evidence passing, tag `sNN-integrated`) then `accepted` (Jo, tag `sNN-accepted`). One acceptance only.
- **Requirement state** is computed, never stored: an evidence part passing at an integrated slice is `evidenced`; at an accepted slice it is `verified`.
- **Registries:** sprint-status (story state), story ledger entries (evidence per story commit), `acceptance-ledger.json` plus tags (slice state), `trace.json` (computed evidence), `pilot-log.md` (metrics). Sprint-status is the only registry of delivery status (PIL-04); the others record evidence.

### Task-card fields

- **Goal and acceptance criteria:** the story above.
- **Requirement refs and evidence:** the *Evidence parts* column, written `REQ@evidenceSlice`; a part is satisfied when a passing test titled `[REQ] … (@N.M)` (or a valid `manual-evidence/<REQ>.md`) exists on the slice branch. A requirement with split evidence appears with several parts, for example E2E-04@S05 and E2E-04@S07. UI-4 and UI-5 parts mean the story's tests cover loading, empty, error, unavailable and success states and Norwegian text and nb-NO formatting.
- **Dependencies:** earlier stories of the same slice, a slice acceptance gate (`S03 accepted` means Jo's `s03-accepted` tag), or the named human gate. S04, S05 and S06 stories depend on the S03 gate and on no story of another parallel slice.
- **File and module ownership:** the *Owns* column.
- **Test commands:** `npm run test -- -t "\(@N\.M\)"` for a story's Vitest tests, `npm run test:e2e -- -g "\(@N\.M\)"` for its Playwright tests, `npm run verify` after every story, `npm run verify:full -- --slice <slice>` on the slice candidate (the script also reads `FELLES_SLICE`), `npm run verify:release` at S07.
- **Definition of done (every story):** acceptance criteria met; story tests titled with the requirement id and `(@N.M)`; for UI stories axe clean at 375 and 1440 px and the state and language criteria above; `npm run verify` green on the slice branch; ownership check passes; ledger entries `implemented`, `tested`, `reviewed` with SHA. Slice level: `verify:full` green with the slice set on the candidate; `done` and `accepted` only by Jo.

| Story | Slice | Depends on | Evidence parts | Owns |
| --- | --- | --- | --- | --- |
| 1.1 | S00 | precondition: planning/felles fast-forwarded | NFR-02@S00 | root `package.json`, `tsconfig*.json` and `*.config.{js,mjs,ts}` (including `eslint.config.js`), root dotfiles (`.nvmrc`, `.npmrc`, `.gitattributes`, `.env.example`, `.gitignore`), `apps/*/package.json`, `apps/*/tsconfig*.json`, `apps/*/vite.config.ts`, `apps/web/src/main.tsx`, `packages/*/package.json`, `packages/*/tsconfig*.json` |
| 1.2 | S00 | 1.1 | BOK-02@S00, BR-1@S00 | `packages/contracts/src/{errors,time,rules,availability}.ts` |
| 1.3 | S00 | 1.1, 1.2 | BR-1@S00, NFR-04@S00 | `apps/api/src/platform/{clock,oslo-time,logger}.ts`, `apps/api/src/config.ts` |
| 1.4 | S00 | 1.2 | BR-4@S00 | `packages/contracts/src/{routes,session,resources,bookings,index}.ts`, `packages/contracts/src/{schedule,activity,dashboard}.ts` (stub), `scripts/contracts-summary.mjs`, `packages/contracts/test/**` (S00, except `{activity,dashboard,schedule}.test.ts`) |
| 1.5 | S00 | 1.1, 1.2, 1.3 | BR-5@S00 | `apps/api/src/platform/{db,unit-of-work,app-error}.ts`, `apps/api/test/temp-db.ts` |
| 1.6 | S00 | 1.5 | — | `apps/api/src/platform/migrate.ts`, `apps/api/test/snapshot/**` |
| 1.7 | S00 | 1.6 | BR-3@S00, BR-5@S00 | `apps/api/db/migrations/0001–0099`, `apps/api/test/snapshot/**`, `apps/api/test/probes/**` |
| Gate S00-CP | S00 | 1.2–1.7 (human gate) | PIL-09 (process) | `pilot-log.md` entry only |
| 1.8 | S00 | Gate S00-CP, 1.4, 1.5 | BR-4@S00 | `apps/api/src/http/register-route.ts`, `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/test/app-factory.ts`, stub handlers in the module route files named in the story (stub) |
| 1.9 | S00 | 1.8 | NFR-04@S00 | `apps/api/src/http/{origin-guard,host-guard,static}.ts` |
| 1.10 | S00 | 1.7, 1.8 | NFR-04@S00 | `apps/api/src/platform/{password,tokens}.ts`, `modules/auth/{sessions.repository,session.service,index}.ts`, `modules/auth/domain/policy.ts`, `http/session-plugin.ts`, `apps/api/test/clients.ts` |
| 1.11 | S00 | 1.7, 1.8 | BR-5@S00 | `modules/activity/{index,writer,activity-events.repository}.ts`, `modules/bookings/index.ts`, `modules/bookings/{bookings.presenter,bookings.repository,booking-transitions.repository,bookings-read.repository}.ts` (stub), `modules/resources/index.ts` (stub) |
| 1.12 | S00 | 1.10, 1.11 | SEED-1@S00, SEED-2@S00 | `apps/api/db/seed/**`, `scripts/demo-reset.mjs`, `apps/api/test/booking-fixtures.ts` |
| 1.13 | S00 | Gate S00-CP, 1.4 | UI-5@S00 | `apps/web/src/api/**`, `apps/web/src/i18n/**`, `apps/web/src/test/**`, `apps/web/src/api/keys/**` and `i18n/nb/**` barrels and files (stub) |
| 1.14 | S00 | 1.13 | — | `scripts/gen-tokens.mjs`, `apps/web/src/styles/**`, `apps/web/src/ui/timing.ts` |
| 1.15 | S00 | 1.13, 1.14 | UI-3@S00, UI-4@S00 | `apps/web/src/ui/{Button,Field,Input,Select,Textarea,Alert,Toast,Skeleton,EmptyState,Badge}*` |
| 1.16 | S00 | 1.15 | UI-3@S00 | `apps/web/src/ui/{Sheet,Dialog,ReasonDialog,ConfirmDialog,Popover,Tooltip}*` |
| 1.17 | S00 | 1.13, 1.15 | UI-3@S00 | `apps/web/src/ui/{Card,ResourceCard,ResourceIcon,BookingRow,Timeline,Table,ChipGroup,SegmentedControl}*` |
| 1.18 | S00 | 1.9, 1.10, 1.12 | — | `e2e/playwright.config.ts`, `e2e/support/**` (stubs `s01.ts`–`s07.ts`) |
| 1.19 | S00 | Gate S00-CP, 1.1 | — | `requirements.json`, `scripts/gen-requirements.mjs`, `acceptance-ledger.json` (stub) |
| 1.20 | S00 | 1.19 | — | `scripts/trace.mjs`, `scripts/trace-reporter.mjs`, `vitest.config.ts`, `e2e/playwright.config.ts` |
| 1.21 | S00 | 1.20 | — | `package.json` script `verify:release`, `manual-evidence/` convention |
| 1.22 | S00 | Gate S00-CP, 1.1 | — | `ownership.json`, `scripts/check-ownership.mjs` |
| 1.23 | S00 | 1.19, 1.22 | — | `scripts/ledger.mjs`, story ledger files under `_bmad-output/implementation-artifacts/` |
| 1.24 | S00 | 1.18, 1.20, 1.22, 1.23 | — | `scripts/merge-gate.mjs` |
| 1.25 | S00 | 1.24 | — | `scripts/accept-slice.mjs` |
| 1.26 | S00 | 1.13, 1.15, 1.16, 1.17, 1.18 | UI-2@S00, UI-3@S00 | `apps/web/src/app/{shell,providers}/**`, `apps/web/src/ui/Avatar*`, `apps/web/src/test/**` |
| 1.27 | S00 | 1.10, 1.26 | UI-2@S00 | `apps/web/src/app/{router,routes}.tsx`, stub pages and seam entry files `features/*/index.tsx` (stub) |
| 1.28 | S00 | 1.26 | UI-4@S00 | `apps/web/src/ui/{QueryState,OfflineAlert}*` |
| 1.29 | S00 | 1.9, 1.12, 1.21, 1.24, 1.27 | RUN-1@S00 | `scripts/{start,dev,build-api,smoke}.mjs`, `.github/workflows/ci.yml`, `README.md` |
| 1.30 | S00 | 1.1–1.29, Gate S00-CP | — | throwaway fixture slice `S99` (scratch clone only), `_bmad-output/implementation-artifacts/s00-freeze-package.md` (main-only) |
| 2.1 | S01 | S00 accepted | AUT-01@S01, AUT-02@S01, AUT-04@S01, NFR-04@S01, BR-4@S01 | `modules/auth/{users.repository,login.use-case,logout.use-case,routes}.ts` |
| 2.2 | S01 | 2.1 | NFR-04@S01 | `modules/auth/throttle.ts` |
| 2.3 | S01 | 2.1 | AUT-03@S01, AUT-02@S01, BR-6@S01, E2E-07@S01, NFR-03@S01 | `apps/api/test/helpers/s01.ts`, `apps/api/test/s01/**` |
| 2.4 | S01 | 2.1, 2.2 | AUT-01@S01, UI-1@S01, UI-3@S01, UI-4@S01, UI-5@S01 | `apps/web/src/features/auth/**`, `i18n/nb/auth.ts`, `api/keys/session.ts` |
| 2.5 | S01 | 2.1 | AUT-02@S01, AUT-04@S01 | `apps/api/test/s01/**` |
| 2.6 | S01 | 2.4, 2.5 | AUT-01@S01, AUT-04@S01, UI-1@S01 | `e2e/auth.spec.ts`, `e2e/support/s01.ts` |
| 3.1 | S02 | S00 accepted | RES-01@S02, RES-02@S02, AUT-03@S02, NFR-03@S02 | `modules/resources/{resources.repository,list-resources.use-case,get-resource.use-case,presenter,routes,index}.ts` |
| 3.2 | S02 | 3.1 | RES-02@S02, RES-03@S02, BR-2@S02, BR-4@S02, BR-5@S02, E2E-07@S02, NFR-03@S02 | `modules/resources/{create-resource,update-resource}.use-case.ts` |
| 3.3 | S02 | 3.2 | RES-04@S02, E2E-08@S02 | `modules/resources/archive-resource.use-case.ts` |
| 3.4 | S02 | 3.1 | RES-01@S02, RES-05@S02, UI-1@S02, UI-3@S02, UI-4@S02, UI-5@S02 | `apps/web/src/features/resources/catalogue/**`, `i18n/nb/resources.ts`, `api/keys/resources.ts` |
| 3.5 | S02 | 3.1 | RES-01@S02, UI-1@S02, UI-3@S02, UI-4@S02 | `apps/web/src/features/resources/detail/**` |
| 3.6 | S02 | 3.2 | RES-03@S02, UI-3@S02, UI-4@S02, UI-5@S02 | `apps/web/src/features/resources/form-sheet/**`, `apps/web/src/ui/{Switch,RadioGroup}.tsx` (new) |
| 3.7 | S02 | 3.3, 3.6 | RES-03@S02, RES-04@S02, UI-1@S02, UI-3@S02, UI-4@S02 | `apps/web/src/features/resources/admin/**`, `e2e/resources.spec.ts`, `apps/api/test/helpers/s02.ts`, `e2e/support/s02.ts` |
| 4.1 | S03 | S01 and S02 accepted | BOK-01@S03, BOK-02@S03, BOK-03@S03, BOK-05@S03, BR-2@S03, BR-3@S03, BR-4@S03, BR-5@S03, RES-04@S03, E2E-08@S03 | `modules/bookings/{bookings.repository,create-booking.use-case,bookings.presenter,routes}.ts` |
| 4.2 | S03 | 4.1 | BOK-03@S03, BOK-04@S03, E2E-02@S03, E2E-03@S03, NFR-03@S03 | `apps/api/test/helpers/s03.ts`, `apps/api/test/s03/**` |
| 4.3 | S03 | 4.1 | VIS-02@S03, AUT-03@S03 | `modules/bookings/{list-bookings,get-booking}.use-case.ts` |
| 4.4 | S03 | 4.1 | VIS-01@S03 | `modules/bookings/schedule.use-case.ts`, `packages/contracts/src/schedule.ts` (S03 until `s03-accepted`) |
| 4.5 | S03 | 4.1–4.4 | BR-1@S03, BOK-02@S03, E2E-01@S03, E2E-02@S03, E2E-03@S03, E2E-07@S03, NFR-03@S03 | `packages/contracts/src/{activity,dashboard}.ts` and `packages/contracts/test/{activity,dashboard,schedule}.test.ts` (S03 until `s03-accepted`), `apps/api/test/s03/**` |
| 4.6 | S04 | S03 accepted | BOK-07@S04, UI-3@S04, UI-4@S04 | `apps/web/src/features/bookings/slot-picker/**`, `apps/web/src/ui/useRovingGrid.ts` (new) |
| 4.7 | S04 | 4.6 | BOK-01@S04, BOK-07@S04, UI-3@S04, UI-4@S04, UI-5@S04 | `apps/web/src/features/bookings/booking-sheet/**`, `features/bookings/index.tsx` (`BookingSheet` body), `i18n/nb/bookings.ts`, `api/keys/bookings.ts` |
| 4.8 | S04 | S03 accepted | VIS-02@S04, UI-3@S04, UI-4@S04 | `apps/web/src/features/bookings/detail-sheet/**`, `features/bookings/index.tsx` (`BookingDetailHost` body) |
| 4.9 | S04 | 4.7, 4.8 | VIS-02@S04, BOK-08@S04, UI-1@S04, UI-3@S04, UI-4@S04, UI-5@S04 | `apps/web/src/features/bookings/mine/**` |
| 4.10 | S04 | 4.7, 4.8 | VIS-01@S04, UI-1@S04, UI-3@S04, UI-4@S04 | `apps/web/src/features/bookings/calendar/grid/**` |
| 4.11 | S04 | 4.10 | VIS-01@S04, UI-3@S04 | `apps/web/src/features/bookings/calendar/interactions/**` |
| 4.12 | S04 | 4.10, 4.11 | VIS-01@S04, UI-3@S04 | `apps/web/src/features/bookings/calendar/keyboard/**` |
| 4.13 | S04 | 4.10, 4.11 | VIS-01@S04, UI-3@S04 | `apps/web/src/features/bookings/calendar/mobile/**`, `apps/web/src/ui/Tabs.tsx` (new) |
| 4.14 | S04 | S03 accepted, S02 accepted, 4.7 | BOK-07@S04, UI-3@S04 | `apps/web/src/features/bookings/availability-strip/**`, `features/bookings/index.tsx` (`AvailabilityStrip` body) |
| 4.15 | S04 | 4.7–4.14 | E2E-01@S04, E2E-02@S04, UI-3@S04 | `e2e/bookings.spec.ts`, `e2e/support/s04.ts` |
| 5.1 | S05 | S03 accepted | APP-02@S05, APP-03@S05, APP-04@S05, BR-2@S05, BR-3@S05, BR-4@S05, BR-5@S05, E2E-09@S05, BOK-05@S05 | `modules/bookings/{booking-transitions.repository,approve-booking.use-case,reject-booking.use-case,transitions.routes}.ts`, `modules/bookings/domain/transitions.ts` |
| 5.2 | S05 | 5.1 | BOK-06@S05, BR-3@S05, BR-4@S05, E2E-06@S05 | `modules/bookings/cancel-booking.use-case.ts`, `transitions.routes.ts` |
| 5.3 | S05 | 5.1 | APP-01@S05, UI-1@S05, UI-3@S05, UI-4@S05, UI-5@S05 | `apps/web/src/features/approvals/**`, `i18n/nb/approvals.ts`, `e2e/approvals.spec.ts`, `e2e/support/s05.ts`, `apps/web/src/api/keys/approvals.ts` |
| 5.4 | S05 | 5.1, 5.2 | BOK-06@S05, VIS-02@S05, UI-3@S05, UI-4@S05 | `apps/web/src/features/booking-actions/**` (including `index.tsx` `BookingActions` body), `i18n/nb/booking-actions.ts`, `apps/web/src/api/keys/booking-actions.ts` |
| 5.5 | S05 | 5.1–5.4 | E2E-04@S05, E2E-05@S05, E2E-06@S05, E2E-09@S05, E2E-07@S05, NFR-03@S05 | `apps/api/test/helpers/s05.ts`, `apps/api/test/s05/**` |
| 6.1 | S06 | S03 accepted | VIS-03@S06, VIS-04@S06 | `modules/dashboard/**`, `modules/bookings/bookings-read.repository.ts` |
| 6.2 | S06 | S03 accepted | VIS-05@S06, BR-5@S06 | `modules/activity/{activity-feed.repository,list-activity.use-case,routes}.ts`, `apps/api/test/helpers/s06.ts` |
| 6.3 | S06 | 6.1 | VIS-03@S06, UI-1@S06, UI-3@S06, UI-4@S06, UI-5@S06 | `apps/web/src/features/dashboard/**`, `apps/web/src/ui/StatTile.tsx` (new), `i18n/nb/dashboard.ts`, `api/keys/dashboard.ts` (`usePendingCount`), `e2e/overview.spec.ts`, `e2e/support/s06.ts` |
| 6.4 | S06 | 6.1, 6.3 | VIS-06@S06, UI-3@S06 | `apps/web/src/features/dashboard/chart/**` |
| 6.5 | S06 | 6.2 | VIS-05@S06, UI-1@S06, UI-3@S06, UI-4@S06, UI-5@S06 | `apps/web/src/features/activity/**`, `i18n/nb/activity.ts`, `api/keys/activity.ts` |
| 7.1 | S07 | S04, S05 and S06 accepted | BR-6@S07, E2E-07@S07, NFR-03@S07 | `e2e/sweep.spec.ts`, route-enumeration switch |
| 7.2 | S07 | S04, S05 and S06 accepted | E2E-04@S07, E2E-05@S07, E2E-06@S07, E2E-09@S07, VIS-02@S07 | `e2e/lifecycle.spec.ts`, `e2e/support/s07.ts` |
| 7.3 | S07 | S04, S05 and S06 accepted | E2E-08@S07, VIS-03@S07, VIS-04@S07, VIS-05@S07 | `e2e/admin-and-overview.spec.ts` |
| 7.4 | S07 | S04, S05 and S06 accepted | UI-2@S07, UI-3@S07, E2E-10@S07 | `e2e/accessibility.spec.ts`, `manual-evidence/UI-3.md` |
| 7.5 | S07 | S04, S05 and S06 accepted | NFR-06@S07 | `manual-evidence/NFR-06.md`, `apps/api/test/perf/measure.ts` |
| 7.6 | S07 | 7.1–7.5 | NFR-05@S07, RUN-1@S07 | `README.md`, `manual-evidence/NFR-05.md` |
| 7.7 | S07 | 7.6 | NFR-01@S07 | `manual-evidence/NFR-01.md` |
| 7.8 | S07 | 7.1–7.7 | — | `manual-evidence/**`, `_bmad-output/implementation-artifacts/s07-evidence-pack.md` (main-only; the pilot-log entry is written by `ledger.mjs` on main) |

## Coverage Tables

Every UX Design Requirement, Additional Requirement and process requirement is covered by at least one story below (the check required by step 3).

| Requirement | Stories |
| --- | --- |
| UX-DR1 | 1.14 |
| UX-DR2 | 1.14 |
| UX-DR3 | 1.14 |
| UX-DR4 | 1.15, 1.26 |
| UX-DR5 | 1.26, 4.13, 7.4 |
| UX-DR6 | 1.27 |
| UX-DR7 | 1.26, 6.3 |
| UX-DR8 | 1.13, 1.27 |
| UX-DR9 | 1.16 |
| UX-DR10 | 1.15 |
| UX-DR11 | 1.15 |
| UX-DR12 | 1.15 |
| UX-DR13 | 4.6, 4.7 |
| UX-DR14 | 4.6 |
| UX-DR15 | 1.17, 3.4, 3.6, 6.4 |
| UX-DR16 | 1.15, 1.17 |
| UX-DR17 | 1.17, 3.4, 3.7, 6.3 |
| UX-DR18 | 4.14 |
| UX-DR19 | 4.10, 4.12 |
| UX-DR20 | 4.13 |
| UX-DR21 | 1.16, 4.11 |
| UX-DR22 | 1.16, 3.6, 4.7, 4.8 |
| UX-DR23 | 1.16, 5.3, 5.4 |
| UX-DR24 | 1.15 |
| UX-DR25 | 1.15, 1.17, 1.26, 6.4, 6.5 |
| UX-DR26 | 1.28 and every UI story |
| UX-DR27 | 1.2, 1.13 |
| UX-DR28 | every UI story, 7.4 |
| UX-DR29 | 1.15, 1.16, 7.4 |
| UX-DR30 | 2.6, 4.15, 7.2, 7.3 |
| UX-DR31 | 1.2, 1.14 |
| AR1 | 1.1 |
| AR2 | 1.1 |
| AR3 | 1.2, 1.4 |
| AR4 | 1.8, 7.1 |
| AR5 | 1.4 |
| AR6 | 1.2, 1.5, 1.8 |
| AR7 | 1.4, 3.1, 4.3, 6.2 |
| AR8 | 1.2, 4.3 |
| AR9 | 1.3, 4.1, 4.5 |
| AR10 | 1.5, 4.1 |
| AR11 | 1.7, 4.2 |
| AR12 | 1.7, 3.3, 5.1, 5.2 |
| AR13 | 1.11 and every mutating story |
| AR14 | 1.10, 2.1 |
| AR15 | 2.2 |
| AR16 | 1.9 |
| AR17 | 1.10, 2.3, 4.4 |
| AR18 | 1.3, 1.9 |
| AR19 | 1.5, 1.11 |
| AR20 | 1.6, 1.7 |
| AR21 | 1.12 |
| AR22 | 1.13, 1.26, 1.27 |
| AR23 | 1.14, 1.15, 1.16, 1.17 |
| AR24 | 1.1, 1.13 |
| AR25 | 1.3, 1.29 |
| AR26 | 1.19 |
| AR27 | 1.22, 1.23, 1.24, 1.25, 1.30 |
| AR28 | 1.20, 1.21, 1.29, 7.7, 7.8 |
| AR29 | 1.18, 4.2, 4.5 |
| AR30 | 1.10, 1.11, 4.4, 4.14 |
| PIL-01 | 1.19, 1.20, 1.21, 7.8 |
| PIL-02/03/04 | 1.23, 1.25, State model, 1.30 |
| PIL-05 | Story Index |
| PIL-06 | Gate S00-CP, 1.30, 4.5 |
| PIL-07 | 7.8 and the pilot log |
| PIL-08 | 7.8 |
| PIL-09 | Gate S00-CP |
| PIL-10 | 1.1, 1.29 |
| PIL-11 | 1.29, 7.7 |
| PIL-12 | 1.24 |
| PIL-13 | 1.21, 7.8 |
