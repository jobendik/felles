# Fix verification: ARCHITECTURE-SPINE v2 against the eight Reviewer Gate reports

Reviewer: read-only fix-verification. Spine reviewed: `ARCHITECTURE-SPINE.md` v2 (status draft, 2026-10-19). Decision history read from `.memlog.md`. `APPROVAL-BRIEF.md` now exists (RESUME-NOTES.md is stale on that point).

Method: every critical/blocker/high finding of the eight reports, plus the medium findings judged most damaging, was traced to an AD or section. Versions spot-checked with `npm view` on 2026-10-19: `@hookform/resolvers@5.9.2` (peer zod ^3.25||^4, ok), `eslint@9.39.5`, `typescript@6.0.3` (typescript-eslint 8.71.2 peers `<6.1.0`, ok), `eslint-plugin-jsx-a11y@6.10.2` (peers eslint <=9, ok), `eslint-plugin-react-hooks@7.1.1`, `@types/react@19.3.0`, `@types/better-sqlite3@9.6.0`, `@testing-library/dom@10.4.2`, vite 8.3.4, vitest 5.0.5, better-sqlite3 13.0.3, react-router 8.4.0 (node >=22.22). All pins in the Stack table resolve and are mutually compatible. `eslint-plugin-react@7.37.5` peers `eslint ^9.7`, so it can be added without breaking the ESLint 9 pin (relevant to N-M7).

Verdict key: CLOSED, PARTIAL, OPEN, DEFERRED-OK. Report prefixes: RQ = reconcile-requirements-prd, UX = reconcile-ux, PR = reconcile-process, RB = review-rubric, VR = review-versions, AV = review-adversary, SE = review-security, DI = review-data-integrity.

## 1. Finding-by-finding verdicts

| Finding | Verdict | Where | Note |
| --- | --- | --- | --- |
| RQ-F01 (high) DB path depends on cwd | CLOSED | AD-18 | Resolved against repo root, logged absolute. |
| RQ-F02 (high) contracts delegated, not carried | CLOSED | Contract Minimums, AD-3, AD-2 | Route table with access and owner added. List-item shape still thin (see N-M5). |
| RQ-F03 (high) dashboard / CR-3 / DEC-04 rules unstated | CLOSED | AD-5 (7 x 24 h strict), AD-16 (isExpired, pending count, top-3 in code), dashboard row | Open Q3 covers chart semantics. S06 test list does not name boundary cases (low). |
| RQ-F04 / RB-M11 (med) start/migrate/build sequence | OPEN | AD-24, AD-25 | Still says only "`npm ci`, `npm run db:seed`, `npm start`". Nothing says whether `npm start` builds `apps/web/dist` and the API bundle, whether migrations run on boot, or what `db:seed` does on a non-empty DB. RUN-1 is a MUST. |
| RQ-F05 (med) DST tests mandated | CLOSED | AD-26 (`[BR-1]` suites around 2026-10-25 and 2027-03-28), AD-25 | |
| RQ-F06 (med) temp-DB guard for Playwright and smoke | PARTIAL | AD-18 | Playwright covered. `scripts/smoke.mjs` (AD-27) is not named; it is neither VITEST nor Playwright. |
| RQ-F07 (med) decision/cancel fields | CLOSED | AD-9, Contract Minimums | See N-M4 for naming drift against the verified SQL. |
| RQ-F08 / SE-S01 / RB-H1 (high) scrypt maxmem | CLOSED | AD-11 | `maxmem` 256 MiB, bounded stored params, dummy hash, config profile. Corner case in N-L4. |
| RQ-F10 (med) DEC-16 deviation unrecorded | PARTIAL | AD-4, Open Q4 | Statuses and codes flagged `needs Jo`. The new activity `before` cursor / `{items,nextBefore}` response (a deviation from DEC-16 "no pagination") is not in Open Q4 or AD-4's "needs Jo" sentence. |
| RQ-F11 (med) evidence for manual MUSTs | CLOSED | AD-26 (`manual-evidence/<reqId>.md`) | |
| RQ-F12 (low) anonymous GET /api/session | CLOSED | Contract Minimums (200 with `user:null`) | Web mapping of null-after-user: N-M8. |
| RQ-F15 (low) boundary operators (create `>= now`, cancel/approve `> now`) | OPEN | AD-5, AD-9, AD-16 | AD-5 says "not in the past"; `isExpired` uses `<= now`. A booking created for exactly `now` is created and is instantly Expired. Unstated. |
| RQ-F16 / DEC-15 (low) approvalRequired derived once; archived resources editable? | OPEN | AD-10 | Not stated. |
| UX-H1 (high) payload shapes | CLOSED | Contract Minimums | |
| UX-H2 (high) decision data | CLOSED | AD-9, booking row | The "Forespørselen ble ikke behandlet..." rule (`pending and start <= now`, or `rejected and decision.at >= startAt`) is derivable but never stated; add a `rules.ts` helper (low). |
| UX-H3 (high) create-sheet seam | CLOSED | AD-20 `useBookingSheet().open(...)` | |
| UX-H4 (high) error codes / copy | CLOSED | AD-4 (`UNAUTHENTICATED`, `BOOKING_NOT_CANCELLABLE`, `BOOKING_STARTED`), AD-2 (count messages as functions), Open Q2 | |
| UX-H5 (high) bookings list contract | CLOSED | AD-16, `GET /api/bookings` row | `scope`, `group`, `status[]`, `expired`, sort and tie-break defined. New truncation issue: N-M5. |
| UX-M1 pending count delivery | CLOSED | dashboard row `admin.pending`, AD-21 invalidation | |
| UX-M2 chart bucketing | CLOSED | dashboard row, Open Q3 | |
| UX-M3 archive refusal details | CLOSED | AD-4 (`futureBookingCount`, `firstFutureBookingAt`) | |
| UX-M4 throttle edges | CLOSED | AD-12, AD-4 | |
| UX-M5 shared slot model, 30-day edge | CLOSED | AD-2 `availability.ts`, AD-22, Open Q1 | |
| UX-M6 web error/connectivity plumbing | CLOSED | AD-21 | Retry wording: N-M2. |
| UX-M7 activity contract | CLOSED | AD-16, activity row | |
| UX-M8 shell a11y duties | CLOSED | AD-22 | |
| UX-M9 tokens/timing | CLOSED | AD-22 (`tokens.extra.css`, `ui/timing.ts`) | |
| UX-M10 Ressursdetalj strip vs S03 ordering | PARTIAL | Open Q5 mentions schedule in S03 only | Epics must order the strip after S03; not recorded. Low. |
| UX-M11 client clock re-sync | CLOSED | AD-6, AD-21 | |
| UX-L1 font-src vs inlined fonts | OPEN | AD-13 (`font-src 'self'`) | Vite inlines assets under 4 KiB as `data:`; a small Inter subset would be blocked. Add `build.assetsInlineLimit: 0` or `font-src 'self' data:`. |
| UX-L5 `uke=` format | OPEN | route table / Contract Minimums | Format of `uke` (Monday civil date suggested) not fixed; the schedule row takes `from`. |
| PR-F01 (crit) unowned shared files | CLOSED | AD-20 (per-feature barrels for i18n, keys, invalidation, test helpers, seed fixtures; dependency path) | |
| PR-F02 (crit) bookings module multi-slice | CLOSED | AD-20 (repository split, `BookingsReadPort`) | New related gaps: N-H3, N-M3. |
| PR-F03 (high) S02 cannot authenticate without S01 | PARTIAL | AD-11 last sentence, AD-20 | Session resolution and `GET /api/session` are S00. Still missing: `mintSession(db, userId)` helper and a Playwright fixture that inserts a session row into the per-worker DB; `auth/routes.ts` is one file owned by both S00 and S01 (N-M3). |
| PR-F04 (high) cross-module SQL for archive guard | CLOSED | AD-20 (`countFutureBlocking` in S00) | |
| PR-F05 (high) ownership machine-checkable | CLOSED | AD-20 `ownership.json`, `check-ownership.mjs`, `Freeze-Approved:` trailer | |
| PR-F06 (high) ledger branch discipline | CLOSED | AD-20 (ledger written on main, append-only, `merge=union`) | |
| PR-F07 (high) merge gate | CLOSED | AD-20 `merge-gate.mjs` | |
| PR-F08 (high) ui/ freeze vs consumers | PARTIAL | AD-20, AD-22 | Additions rule, `useRovingGrid`/chart moved to S04/S06. Shared domain components still unowned (see RB-H2). Select, Textarea, Table, Card, ConfirmDialog/ReasonDialog not in the S00 primitive list, and two slices may add the same `ui/` file name. |
| PR-F09 (high) amendment path | CLOSED | AD-20 (F1/F2, additive amendments) | Who authors the three F2 files before F2: N-M4b. |
| PR-F10 (high) scrypt | CLOSED | AD-11 | |
| PR-F11 (high) Windows pitfalls | CLOSED | AD-19, AD-24, AD-26, AD-25, AD-27 | Graceful shutdown (SIGINT/SIGTERM) and `TZ` independence still unstated (N-L5). |
| PR-F12 (high) scope changes flagged | CLOSED | Open Q5, Q6, Q7 | |
| PR-F13 (med) detail host vs slot | CLOSED | Design Paradigm ("only place that imports feature pages"), AD-20 | |
| PR-F14 (med) invalidation map / pill source | CLOSED | AD-21 (complete map frozen in S00, coverage test, direct `invalidateQueries` banned) | |
| PR-F15 (med) trace gives results, SHA, story | PARTIAL | AD-26 | `trace.mjs` content is fine, but it is in no gate: AD-27 `verify` and the merge-gate integration set do not run it. It cannot run per slice (other slices' MUSTs have no tests yet); say it runs at S07 / final gate. |
| PR-F16 (med) ORK-06 hardening | CLOSED | AD-26 (`retries: 0`, `forbidOnly`, `--max-warnings 0`, no 501 gate) | `passWithNoTests: false` unstated (low). |
| PR-F17..F20, F22 | CLOSED | AD-26, AD-19 (S07 range, ascending apply), AD-20 (seed fixtures per slice) | |
| PR-F19 (med) PIL-09 wording | CLOSED | AD-20 checkpoint after T00-02, Open Q7 | |
| PR-F21 (med) S00 oversize | CLOSED (accepted) | AD-20 hello-slice dry run, Open Q5 | S00 remains large; flagged to Jo. |
| RB-H2 (high) shared web components homeless | OPEN | AD-20, AD-22 | BookingRow (S04, S05, S06), Timeline (S04 sheet, S06 Aktivitet), ResourceCard (S02, S06), ChipGroup, SegmentedControl, DataTable still have no owner, and features may not import features. Three parallel slices will each hand-roll them. |
| RB-H3 (high) freeze enforcement | CLOSED | AD-20 | |
| RB-H4 (high) import diagram contradictions | PARTIAL | Design Paradigm diagram | `WF --> CT`, `RP --> CT` added. Presenter (AD-15) still absent from the diagram and the layer table; `RT --> PF`, `server.ts/app.ts` wiring absent. Lint rules are generated from this diagram. |
| RB-H5 (high) list scope and route inventory | CLOSED | AD-14, AD-15, route table, AD-4 (`BOOKING_CONFLICT` empty details) | |
| RB-H6 (high) approvable count owner | CLOSED | dashboard `admin.pending`, AD-21 | |
| RB-H7 (high) open questions never reached the spine | CLOSED | Open Questions & Approvals, AD-4 `needs Jo`, APPROVAL-BRIEF.md exists | |
| RB-M1 / DI-L7 session purge on read | CLOSED | AD-11 (purge at login and 10-minute timer) | |
| RB-M2 / SE-S12 / DI-M11 frozen clock | CLOSED | AD-6 (start instant, advancing; fixed only via `buildApp({clock})`; `Temporal.Instant.from`) | Production/E2E interaction: N-H1. |
| RB-M3 relative paths, SPA dir | CLOSED | AD-18, AD-24 | |
| RB-M4 / VR-H2 / SE-S11 (high) helmet defaults | PARTIAL | AD-13 | CSP string is explicit, but the sentence "with `upgrade-insecure-requests` and HSTS off" can be read as turning the directive ON. `useDefaults: false` and an exact-header test are not stated. Safari (NFR-01 mandatory) breaks if the directive ships. |
| RB-M5 frontend rules enforceable | PARTIAL | AD-21, AD-23 | `invalidateQueries` ban, date-API bans exist. No mechanism for: `fetch` only in `api/`, `react-aria-components` only in `ui/`, no literal UI strings (AD-23), `react/no-danger` (needs eslint-plugin-react, not in Stack). See N-M7. |
| RB-M6 traceability in a gate | PARTIAL | AD-26 | Same as PR-F15. |
| RB-M7 handler/use-case wiring | OPEN | AD-3, AD-6, AD-7 | `ctx = { actor, deps }`, use-case signature, and "async work (scrypt) happens before `uow.run`" still unstated. S01 and S02 write the first use cases in parallel. |
| RB-M8 chart bucketing | CLOSED | dashboard row, Open Q3 | |
| RB-M9 table ownership / SQL import restriction | PARTIAL | AD-1 | Only `bookings` and `activity_events` named, and the sentence is wrong (N-M1). `better-sqlite3`/`platform/db` import restriction to `*.repository.ts` implied by "SQL appears only in" but the lint is not stated. |
| RB-M10 QueryClient defaults | PARTIAL | AD-21 | Retry wording only; `refetchOnWindowFocus`, `staleTime`, mutation `retry: 0` not set in one `app/query-client.ts`. |
| RB-M12 demo:reset | CLOSED | AD-25 | |
| RB-M13 content-type/framework errors | PARTIAL | AD-4, AD-13, AD-24 | Envelope for framework and unknown-route errors, bodyless allowed, 501 mapped. Status/code for malformed JSON, wrong content type (415), 413, 405 not stated. |
| RB-M14 proxy target IPv6 | PARTIAL | AD-24 | Says "Vite on 5173 proxying /api"; target `http://127.0.0.1:${FELLES_PORT}` and `changeOrigin` not stated (N-M6). |
| RB-M15 symbol list check | CLOSED | AD-2, AD-22 | |
| RB-M16 email normalisation | CLOSED | AD-11 `normaliseEmail`, CHECK | |
| RB-M17 capability map | CLOSED | Capability map | UI-1 still mapped to `ui/i18n/app` (low). |
| RB-M18 seed DST rows vs relative rows | PARTIAL | AD-25 | Civil-value derivation added; "DST rows on a dedicated resource and generator asserts no overlap" not stated. Failure would be loud (trigger abort), low. |
| RB-M19 name uniqueness | CLOSED | AD-10 ("Resource names are not unique") | Deferred list still repeats it (N-L6). |
| RB-M20 browser clock resync | CLOSED | AD-6, AD-21 | |
| RB-L9 `@types/node ^24` unpinned | OPEN | Stack | Conflicts with `save-exact=true`. Pin 24.19.x. |
| RB-L12 graceful shutdown, TZ | OPEN | none | |
| RB-L13 ER diagram omits approver | OPEN | Structural Seed ER | Add `users ||--o{ bookings : decides`. |
| VR-H1 (high) resolvers 6.0.0 ERESOLVE | CLOSED | Stack 5.9.2 | Verified. |
| VR-H3 (high) jsx-a11y vs ESLint 10 | CLOSED | Stack 9.39.5, Deferred | Verified; typescript-eslint and react-hooks support 9. |
| VR-H4 (high) Node framing | CLOSED | AD-24, AD-27, Open Q6 | Node 26 non-blocking CI job, engines `^24.15.0 \|\| >=26`. |
| VR-M1 npm floor | CLOSED | AD-24 `npm >=11.12` | |
| VR-M2 clean-room install | CLOSED | AD-27 | |
| VR-M3 `@types/better-sqlite3` | CLOSED | Stack, Deferred | |
| VR-M5 Playwright install command | CLOSED | AD-27 | |
| VR-L4 runner label pins | DEFERRED-OK | Deferred | Reasoned (verified when workflow is written). Pinning `macos-26` still advisable for NFR-01 evidence. |
| AV-P1 (blocker) Expired derived in three places | CLOSED | AD-16 | |
| AV-P2 (blocker) bookings repo ownership | CLOSED | AD-20, AD-1 | Lint wording N-M1. |
| AV-P3 (blocker) one typed event per use case | CLOSED | AD-17 | |
| AV-P4 (blocker) subject derivation | CLOSED | AD-17 (`recordEvent` alone; trigger) | |
| AV-P5 decision vs cancel columns | CLOSED | AD-9 | Naming drift N-M4. |
| AV-P6 schedule/upcoming/empty semantics | CLOSED | AD-16, schedule row | |
| AV-P7 cursor, collation, search | CLOSED | AD-16 | |
| AV-P8 invalidation ownership | CLOSED | AD-21 | |
| AV-P9 501 stubs vs enumeration | CLOSED | AD-3 | |
| AV-P10 seed/migration/snapshot | CLOSED | AD-19, AD-20, AD-25 | |
| AV-P11 role source and gating | CLOSED | AD-15 (`admin !== null`), AD-21 (route `access`) | |
| AV-P12 null/omit, union | PARTIAL | AD-2, Conventions, AD-15 | Union discriminator `kind` and `.strict()` fixed. "Requests accept null or omission for no value" contradicts PATCH semantics (N-H2). |
| AV-P13 field-error text | CLOSED | AD-2 error map | Field-error `code` set not enumerated (low). |
| AV-P14 DST arithmetic, CRLF | CLOSED | AD-5, AD-19 | Where Temporal lives: N-M3b. |
| SE-S02 throttle check-then-act | CLOSED | AD-12 | |
| SE-S03 email rotation flood | CLOSED | AD-12 (global limiter, 1,024 map, `UV_THREADPOOL_SIZE`) | Full-of-active-delays case unstated (low). |
| SE-S04 Host / remote demo | PARTIAL | AD-13 | 421 and remote-bind refusal exist. In development the Vite proxy forwards `Host: localhost:5173`, which fails the "(with the served port)" rule, so every dev API call gets 421 unless `changeOrigin: true` or the dev port is allowed (N-M6). |
| SE-S05 Vite origins dev only | CLOSED | AD-13, Deferred (cookie injection) | |
| SE-S06 authorise before state | CLOSED | AD-14, AD-3 test | |
| SE-S07 input bounds | CLOSED | AD-2, AD-13, AD-16 | |
| SE-S08 mass assignment | CLOSED | AD-2 `.strict()`, AD-10 | |
| SE-S09 multi-tab identity | CLOSED | AD-21, AD-11 | |
| SE-S10 no-store | CLOSED | AD-13 | |
| SE-S13 envelope for framework errors | CLOSED | AD-4, AD-24 | |
| SE-S14 redaction | CLOSED | AD-28 | |
| SE-S15 supply chain | PARTIAL | AD-27 | `npm ci`, audit, `save-exact` fine. "`ignore-scripts=true` ... allow-listed through a root `postinstall`" cannot work: ignore-scripts also suppresses the root project's install lifecycle scripts (N-M7b). |
| SE-S19 403 vs 404 oracle | DEFERRED-OK | Deferred | Sound reason (UX "Ingen tilgang"), reversal stated. |
| SE-S20/S21 details and Member scope | CLOSED | AD-4, AD-15 | |
| DI-H1 trigger hardening | CLOSED | AD-9 | Column naming N-M4. |
| DI-H2 REPLACE bypass | CLOSED | AD-7 (`recursive_triggers`), AD-9 (no-replace), lint ban | |
| DI-H3 busy_timeout / 503 | CLOSED | AD-7, AD-4, AD-8(b) | |
| DI-H4 CRLF / checksum / runner | CLOSED | AD-19 | "No BEGIN" wording N-M4c. |
| DI-H5 top-3 in code | CLOSED | AD-16 | |
| DI-H6 activity cursor = id | CLOSED | AD-16 | |
| DI-M1 idempotent replay | DEFERRED-OK | AD-8 (explicit: replay is a conflict), memlog (rejected) | Sound: preserves exactly-one-success evidence. Client-side retry interaction: N-M2. |
| DI-M2 Windows second-connection tests | CLOSED | AD-26 temp-db dispose | |
| DI-M3..M11 | CLOSED | AD-7, AD-6, AD-8, AD-18, AD-10, AD-5, AD-25 | |

### Tally

Counted from this table (rows aggregating several ids count once). See the summary returned with this report for exact totals.

## 2. NEW problems introduced or left by v2

No critical findings. Concrete fixes are proposed text, not applied.

### High

**N-H1. `FELLES_NOW` refusal under `NODE_ENV=production` collides with the Playwright harness, and the advancing clock makes E2E boundaries drift.**
AD-6: "`FELLES_NOW` ... refused when `NODE_ENV=production`", and a fixed clock exists only through `buildApp({ clock })`. AD-26: "Playwright runs Chromium against the production build; each worker boots its own server ... under `FELLES_NOW=2026-10-19T07:00:00Z`". The production build is a bundle started through the same entry as `npm start`; the spine never says what `NODE_ENV` the start script or the harness sets. If `npm start` sets `production` (usual), the harness is refused; if nothing sets it, the guard is toothless. Second, with a clock that keeps advancing from Monday 09:00, any E2E assertion near a boundary (today's "passert" cells, a booking at 09:30, the last bookable horizon slot, Expired creation) drifts with test runtime, and no E2E-level stepping exists (no test-only route).
Fix, AD-6 append: "The start script sets `NODE_ENV=production`; the Playwright harness and `scripts/smoke.mjs` start the same bundle with `NODE_ENV=test` and an explicit temp `FELLES_DB_PATH`, which is the only non-development environment in which `FELLES_NOW` is accepted. E2E specs place all time-sensitive data at least 2 h from any boundary relative to the harness start and each worker's server is booted per spec file, so drift stays under 30 minutes; boundary cases (horizon, Expired, DST) are API-level with `buildApp({ clock })`."

**N-H2. "Requests accept `null` or omission for no value" makes `PATCH /api/resources/:id` destructive.**
Consistency Conventions say `null` and omission both mean "no value"; the route table says PATCH is a "partial edit". Implemented literally, `PATCH {name:"Fjorden 2"}` is indistinguishable from `PATCH {name:"Fjorden 2", seats:null, description:null}` and clears optional fields (or the builder invents a rule per slice; AV-P12 asked for this to be fixed).
Fix, AD-2 append: "On create, omission and `null` both mean no value. On `PATCH`, an omitted key leaves the field unchanged and `null` clears a nullable field (`description`, `seats`); a PATCH with no keys is 400. The `resource.updated` event lists only fields whose stored value changed."

**N-H3. S03's booking read depends on S06 code (embedded `events`), breaking the ownership and parallelism claim.**
Contract Minimums: `GET /api/bookings/:id` (S03) returns "its events (Historikk)". Events are `activity_events`, readable only through the `activity` module (AD-1), whose read use cases are S06 ("`writer.ts` (S00) · read use cases (S06)"). S03 cannot finish or be accepted (F2 freeze) without an activity reader, and S06 runs after S03.
Fix, AD-20 append: "S00 implements `activity/index.ts: listEventsForBooking(db, actor, bookingId)` (Member scope applied inside, ordered `id ASC`); S06 owns the paged `GET /api/activity` use case. S03 consumes only the S00 function."

**RB-H2 (carried, OPEN) shared domain components.** Proposed text, AD-22 append: "S00 stubs typed components with frozen prop types over contract DTOs: `ui/BookingRow`, `ui/Timeline`, `ui/ResourceCard`, `ui/ChipGroup`, `ui/SegmentedControl`, `ui/DataTable`, `ui/Select`, `ui/Textarea`, `ui/ReasonDialog`, `ui/StatTile`. Body owners: S04 BookingRow and Timeline, S02 ResourceCard, ChipGroup and DataTable, S06 SegmentedControl and StatTile, S05 ReasonDialog. Other slices import the stub and may not fork it. A slice adding a `ui/` file uses a name not in this list and records it in `ownership.json`."

### Medium

**N-M1. AD-1's table-name rule contradicts the activity module and cannot be linted as written.** "Only the `bookings` module may name the `bookings` and `activity_events` tables" forbids `activity/writer.ts` (the S00 writer) from naming `activity_events`, and `recordEvent` must read `bookings.user_id`. Fix: "Only the `bookings` module names `bookings`; only the `activity` module names `activity_events`; `recordEvent` obtains the owner through `bookings/index.ts: ownerOf(tx, bookingId)`; `resources` and `users` are named only by their own modules (the dashboard takes counts from `BookingsReadPort` and names from `resources/index.ts`). Enforced by `no-restricted-syntax` on string literals and template elements per directory."

**N-M2. AD-21 "Retries: none for 4xx, one for network/5xx" can be read as applying to mutations.** A retried `POST /api/bookings` after a lost response returns 409 against the user's own booking (AD-8 says replay is a conflict) and re-runs approve/cancel. Fix: "Retries apply to queries only. Mutations never retry (`retry: 0`); a network failure on a mutation shows the error alert and the user re-checks the list."

**N-M3. Ownership map gaps.** (a) `modules/auth/routes.ts` is one file owned by S00 (`GET /api/session`) and S01 (login, logout): split into `session.routes.ts` (S00) and `login.routes.ts` (S01). (b) `contracts/time.ts` and AD-5: AD-5 says Temporal lives "in one server module", Deferred says "the polyfill import sits in one module", but `osloDayRange`/`osloWeekRange` and the lint exemption live in `contracts/time.ts`, which the web imports through the barrel (Temporal would ship in the browser bundle). Fix: "Instant-producing Oslo helpers (`osloDayRange`, `osloWeekRange`, civil-to-instant conversion) live in `apps/api/src/platform/time.ts` and are the only Temporal importers; `contracts/time.ts` holds pure civil-date arithmetic and horizon functions on numbers and strings, with no Temporal import." (c) Add `mintSession(db, userId)` (API) and a Playwright fixture that inserts a hashed session row into the worker DB to the S00 deliverables (PR-F03).

**N-M4. Schema wording drift.** (a) AD-9 says `decision_reason` is "approve/reject only", the verified SQL (`reject_reason`, `status = 'rejected' OR reject_reason IS NULL`) allows rejection only, and the AD-9 columns are named differently from the SQL the S00 author is told to start from. Fix: "`decision_reason` is set only when `status = 'rejected'`; the SQL in `reviews/review-data-integrity.md` is normative in shape, with `reject_reason` renamed `decision_reason`." (b) F2 contracts (`activity.ts`, `dashboard.ts`, final schedule DTO) have no named author before S03 acceptance: "F2 files are written by the S03 agent on the S03 branch, reviewed by Jo at S03 acceptance." (c) AD-19 "Migration files hold no `BEGIN`/`COMMIT`/`PRAGMA`" literally forbids `CREATE TRIGGER ... BEGIN ... END`. Fix: "no transaction-control statements (`BEGIN [TRANSACTION]`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`) and no `PRAGMA`; `BEGIN ... END` inside `CREATE TRIGGER` is required."

**N-M5. List item shape and silent truncation.** `GET /api/bookings` and the queue say `{ items }` but not what an item carries: UX rows need the resource summary (symbol, colour, name), `userId`, `createdAt` ("Sendt for 2 t siden"), and for Administrators `booker.name`. Also AD-16 caps every list at `limit` 1…100 (default 50), while UX has no "Vis flere" on Mine bookinger, Godkjenninger or Ressurser: rows beyond 100 are unreachable. Fix: "`GET /api/bookings` items are the `BookingDto` of `GET /api/bookings/:id` without `events`. The web requests `limit=100` on Mine bookinger, Godkjenninger and resource lists; a response with `items.length === limit` shows an info line 'Viser de første 100' instead of silently truncating. Pagination is out of scope for the pilot."

**N-M6. Development proxy versus Host guard.** AD-13 requires `Host` = loopback with the served port. Vite's proxy forwards `Host: localhost:5173` unless `changeOrigin: true`, so every dev call returns 421. Fix, AD-24: "Vite proxy target is `http://127.0.0.1:${FELLES_PORT}` with `changeOrigin: true`; `Origin` stays `http://localhost:5173`, which the development allowlist contains."

**N-M7. Lint rules named but not backed.** (a) `react/no-danger`, a no-literal-text rule (AD-23) and `jsx-no-literals` need `eslint-plugin-react`, which is not in the Stack. Fix: add `eslint-plugin-react 7.37.5` (peers `eslint ^9.7`, verified) to the Stack, or restate both as `no-restricted-syntax` selectors (`JSXAttribute[name.name='dangerouslySetInnerHTML']`, `JSXText[value=/\S/]`). (b) AD-27 "any needed script is allow-listed through a root `postinstall`": with `ignore-scripts=true` npm does not run the root `postinstall` on `npm ci`. better-sqlite3 13 ships prebuilds and has no install script, so nothing needs it. Fix: "`.npmrc` sets `ignore-scripts=true`. No install lifecycle script exists. If the native binding fails to load, `npm run native:rebuild` (explicit, documented) runs `npm rebuild better-sqlite3`." (c) UoW "async callbacks are lint-banned" needs either type-aware lint (`no-misused-promises`) or a selector; say which: "`no-restricted-syntax` on `CallExpression[callee.property.name='run'] > ArrowFunctionExpression[async=true]` plus the type-level rejection in `UnitOfWork.run`."

**N-M8. Session expiry detection and logout.** `GET /api/session` answers 200 `user:null` when the cookie has expired, but AD-21 keys the expiry flow on `UNAUTHENTICATED` (a 401 from other calls). A focus refetch returning `null` after a user existed is not mapped. Also `DELETE /api/session` is `authenticated`: logout with an expired cookie returns 401 and would show "Økten er utløpt" instead of "Du er logget ut". Fix, AD-21: "`user: null` from `GET /api/session` after a user existed is treated as `UNAUTHENTICATED`. A 401 on `DELETE /api/session` is treated as a successful logout."

**N-M9. Bodyless mutations contradict between AD-13 and AD-21.** AD-13: "bodyless POST/DELETE need no body", AD-21: `api/call` "sends `{}` for bodyless mutations". For a route whose contract has no body schema, `{}` with `application/json` must be accepted but `.strict()` rules are unspecified. Fix, AD-13: "A route without a body schema accepts either no body or the empty object `{}` with `application/json`; any other body is 400. Fastify's empty-JSON-body error is mapped to the same behaviour."

**N-M10. Open Questions numbering collides with PRD OQ ids.** AD-27 "(OQ-4)" and Deferred "(OQ-2)" mean PRD OQ-4 (remote exists) and OQ-2 (orchestrator), but the spine's own "Open Questions & Approvals" list uses 1-7 with item 4 meaning the DEC-16 extension. Fix: prefix the spine's list `A-1…A-7` and write `PRD OQ-4` / `PRD OQ-2` in AD-27 and Deferred.

**N-M11. DEC-16 cursor deviation not escalated** (RQ-F10 PARTIAL). Fix, Open Q4: "…and the `before`/`nextBefore` cursor on `GET /api/activity` (DEC-16 lists no pagination)."

### Low

- **N-L1.** AD-13 CSP wording. Replace "with `upgrade-insecure-requests` and HSTS off" by "helmet is configured with `contentSecurityPolicy: { useDefaults: false, directives: <exactly the list above, no upgrade-insecure-requests> }` and `strictTransportSecurity: false`"; a test asserts the exact header string and the absence of `Strict-Transport-Security`. Add `build.assetsInlineLimit: 0` for fonts (UX-L1).
- **N-L2.** Hook order is unstated: Host (421), Origin/Sec-Fetch (403), size and content type, access (401/403), validation (400), use case. Add one sentence to AD-13 so unknown-route, unauthenticated and bad-Origin tests agree.
- **N-L3.** AD-24 config list omits `FELLES_ALLOW_REMOTE_DEMO` (used in AD-13). Add it. `UV_THREADPOOL_SIZE=8` cannot be set from inside `server.ts` on Windows: set it in `scripts/start.mjs`, `dev.mjs` and the Playwright harness through the child's `env`.
- **N-L4.** AD-11 accepts stored `N 2^17, r 16, p 4`, which needs about 256 MiB plus a small overhead and exceeds `maxmem` 256 MiB, so the corner of the window throws. Narrow the window to `r 8…12` or derive `maxmem = 2 * 128 * N * r`.
- **N-L5.** Add graceful shutdown (SIGINT/SIGTERM close server then `db.close()`; tests must not rely on it on Windows) and "the API never reads `process.env.TZ`; `getHours`/`toLocale*` are banned in API and contracts".
- **N-L6.** Deferred still lists "Resource name uniqueness" although AD-10 decides names are not unique. Remove from Deferred.
- **N-L7.** Frontmatter `binds` omits ids used in AD Binds lines (DEC-03/04/08/09/10/14/17/18, CR-2/3, E2E-01…10, ORK-*, PIL-05/08). Generate it or drop non-capability ids.
- **N-L8.** Schedule row: "`days` 1…7 (≤ 31-day range)" is redundant; delete the parenthesis. Origin allowlist lacks `[::1]` while Host allows it; harmless, align them.
- **N-L9.** Unspecified: `passWithNoTests: false`, the set of field-error `code` values, `uke=` URL format (suggest Monday civil date), booking-sheet query separate from list cache ("Statusen er oppdatert."), ER approver relation, DEC-15 line ("`status` at creation derived once from `approvalRequired`; archived resources are not editable").
- **N-L10.** Boundary operators (RQ-F15): "Create requires `start >= now`; cancel, approve and the archive guard use `start > now`; a pending booking created for exactly `now` is immediately Expired."

## 3. Contract Minimums versus EXPERIENCE.md

Matches: session shape, resource fields and rooms-first order, schedule union and instants, archive-refusal details (count plus first booking for the "Se bookinger" link), dashboard pill (`admin.pending.count/expiredCount`, own request included, Expired excluded), chart with seven entries, activity cursor, booking read with decision and cancellation.

Mismatches or gaps:
1. List item shape and truncation (N-M5).
2. `uke=` not defined (calendar URL is `/kalender?ressurs=&uke=`).
3. `GET /api/resources` has `q`, but UX filters the loaded list client-side; say the web does client-side search with `normaliseSearch` and the server `q` is optional, so two implementations do not diverge.
4. Expired explanation rule for a rejected-after-start request is derivable (`decision.at >= startAt`) but unstated.
5. Dashboard is the only source of the nav pill; the S00 shell must treat the S00 stub's 501 as "no pill" until S06 lands (state it so S05 E2E does not fail on the pill).
6. `status` filter on `GET /api/resources` with `archived|all` is correct for Ressursadministrasjon chips "Aktive / Arkiverte"; UX has no "Alle" there, harmless.

## 4. Internal consistency checks

- AD cross-references: all AD numbers cited in Binds, Capability map, AD-2 ("AD-22's tokens check"), AD-4 ("Lists follow AD-16"), AD-6 (AD-11, AD-12), AD-9, AD-26 and AD-27 point at the intended ADs. No dangling AD id.
- Binds ids: all ids exist in the sources; frontmatter list incomplete (N-L7).
- Route table versus ADs: access column matches AD-3/AD-14; `GET /api/session` public and `DELETE` authenticated consistent with AD-11 (see N-M8); unlisted routes: none.
- `FELLES_NOW` versus AD-11, AD-12: consistent (advancing clock, Clock-driven expiry and throttle). Conflict is with AD-26 and production (N-H1).
- Bodyless POST versus `application/json`: N-M9.
- S00 scope versus ownership map: N-M3a, N-H3, RB-H2.
- Idempotency statements: AD-8 (replay is a conflict) consistent with AD-7 (no server retry); AD-21 retry wording breaks the spirit (N-M2).
- Stack versus text: ESLint 9.39.5, typescript-eslint 8.71.2, jsx-a11y 6.10.2, react-hooks 7.1.1, TypeScript 6.0.3, resolvers 5.9.2 are mutually consistent and match AD-27 and Deferred. Text without a Stack entry: `eslint-plugin-react` rules (N-M7a). `@types/node ^24` conflicts with `save-exact`.
- Not enforceable as written: N-M1 (table-name rule), N-M7 (a, b, c), N-M4c (no-BEGIN), N-L1 (CSP wording).
