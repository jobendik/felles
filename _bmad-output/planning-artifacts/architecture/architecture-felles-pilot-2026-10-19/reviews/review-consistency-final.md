# Internal-consistency review of ARCHITECTURE-SPINE.md v2.1 (final pass)

Scope: spine only, read-only. Cross-checked against the PRD (CR-3, VIS-03/04, APP-01..03, BOK-06, RES-04, DEC ids), EXPERIENCE.md and APPROVAL-BRIEF.md where a statement needed an anchor. Severity: blocker = two agents would build different things; high = a build step, lint rule or test cannot be written as stated; medium = ambiguity likely to cause rework; low = wording or hygiene.

Counts: blocker 3, high 17, medium 17, low 12 (49 findings, F1-F49; F23, F30 and F36 are small add-ons or no-action notes).

Verified clean (no action): no stale "default 50 / max 100" generic list numbers remain (AD-16 says 100/200; only activity says 20/100, which is intended); all `AD-n` cross-references in the body point to the right topic (AD-1 to AD-20, AD-2 to AD-5/AD-16/AD-22, AD-4 to AD-16, AD-9 to review-data-integrity.md, AD-14 to AD-3, AD-22 to AD-5, AD-24 to AD-19, AD-25 to AD-5, AD-26 to AD-8); every PRD id in frontmatter and Binds exists (PIL-05/06/08/09/10/11/12, ORK-03/06/08/10, DEC-03..18, CR-2/3, E2E-01..10 via the combined E2E-04/-05/-06 row); both mermaid flowcharts and the erDiagram parse (details in F38-F40); Markdown tables render (pipes inside code spans are escaped).

Spot checks (section 4): VIS-03 (pending count excludes Expired, `admin.pending.count/expiredCount`, "+ 1 utløpt") PASS. CR-3 (approve after start `BOOKING_STARTED`, reject of Expired allowed, listed in queue, excluded from counts) PASS except the check-order issue F2. APP-03 PASS except dead branch F30. BOK-06 (owner no reason, Administrator on another's booking requires it, CHECK on `cancel_reason`) PASS except F2. RES-04 (guard, archived final, excluded from catalogue) PASS except F22.

---

## Blockers

### F1 — blocker — Web import diagram forbids what features must do (links, session user, `now`, `useBookingSheet`, slots)
Location: Design Paradigm diagram + the sentence "Features never import other features; they meet through URL helpers, `ui/` and slots supplied by `app/`." versus Structural Seed `app/ (router, shell, session, clock, slots, links)` and AD-20 `useBookingSheet().open(...)`.
Problem: the diagram has `APP --> WF` and `WF --> WK` but no `WF --> APP`. Yet features need URL helpers (`app/links`), the current user (`app/session`), `now` (`app/clock.ts`, the only place `Date.now()` is allowed) and `useBookingSheet` (called by S02 resource pages before S04 exists). Any ESLint `no-restricted-imports` config written from the diagram will either block these or be loosened differently by each agent.
Replace the sentence under the diagram with: "Features never import other features or `app/` pages. Everything a feature needs from the shell lives in `apps/web/src/api/` (`useSession()`, `useNow()` from `api/clock.ts`, `links.ts` URL helpers, `useBookingSheet()` and the slot context hooks `useSlot(name)`); `app/` provides their implementations at the composition root (context providers) and `app/clock.ts` is moved to `api/clock.ts`." Then edit AD-6 to "`platform/clock.ts` and `apps/web/src/api/clock.ts`", the Structural Seed to `app/ (router, shell, providers)  api/ (call, clock, session, links, sheet, slots, keys/, invalidation/)`, and the diagram to keep `WF --> WK`, `APP --> WK`, `APP --> CT`.

### F2 — blocker — Which error code for cancel after start, and the order of `OWN_REQUEST` versus state errors
Location: AD-4 "`BOOKING_NOT_CANCELLABLE` (cancel), `BOOKING_STARTED`"; AD-9 "Cancel is allowed before start only" and "Approve re-checks inside its transaction: still pending, `start > now` (`BOOKING_STARTED`), resource active (`RESOURCE_ARCHIVED`), approver is not the owner (403 `OWN_REQUEST`)"; AD-14 "load the row, `policy.can`, state checks, write"; Open Question 2 "`BOOKING_STARTED` on cancel/approve".
Problems: (a) AD-4/AD-9 give cancel only `BOOKING_NOT_CANCELLABLE` (compare-and-set on status) but OQ 2 and AD-5 imply `BOOKING_STARTED` on cancel after start; a confirmed booking already started, or an Expired pending request, can be cancelled by neither code unambiguously. (b) AD-9 lists the owner check last, AD-14 says policy runs before state checks; an Administrator approving their own Expired request gets 403 or 409 depending on the agent. (c) AD-9 names only approve for the own-request rule; AD-14 says the Administrator "may not approve or reject their own booking".
Replace in AD-9: "Approve and reject first pass `policy.can` (403 `OWN_REQUEST` for the booking's owner), then check in this order: still `pending` (`BOOKING_NOT_PENDING`), approve only: `start > now` (`BOOKING_STARTED`), approve only: resource active (`RESOURCE_ARCHIVED`; unreachable while AD-10 holds, kept as a guard). Cancel passes `policy.can`, then checks status in `pending`/`confirmed` (`BOOKING_NOT_CANCELLABLE`, `details.currentStatus`), then `start > now` (`BOOKING_STARTED`); an Expired pending request is therefore `BOOKING_STARTED` on cancel and approve, and rejectable only." Replace in AD-4: "`BOOKING_NOT_CANCELLABLE` (cancel on a terminal status), `BOOKING_STARTED` (approve or cancel at or after start)".

### F3 — blocker — `mintSession`, `GET /api/session` and the session repository have no single owner file
Location: AD-20 "S00 also implements the `GET /api/session` handler inside `http/session-plugin.ts`, ... the test helper `mintSession(db, userId)`"; Structural Seed `src/modules/auth/ routes.ts use cases, domain/, repositories, presenter, index.ts  # S00 session resolution, S01 rest`; AD-11 "Session resolution and `GET /api/session` are S00; login, logout and throttling are S01".
Problems: the tree comment says the whole `modules/auth` folder is both S00 and S01, so `auth.repository.ts` and `routes.ts` are edited by two slices; `mintSession` has no path (the per-slice helper barrels `helpers/<slice>.ts` belong to S01 for auth); the "10-minute timer" purge has no owner.
Replace the auth line in the tree with: "src/modules/auth/  sessions.repository.ts (S00: insert, findByHash, delete, purgeExpired) · session.service.ts (S00: resolve, mint) · index.ts (S00) · users.repository.ts, login.use-case.ts, logout.use-case.ts, throttle.ts, routes.ts (S01: POST/DELETE /api/session only) · domain/policy.ts (S00, see F11)". Add to AD-20 after `mintSession`: "(in `apps/api/test/clients.ts`, S00)". Add to AD-11: "The purge timer is started by `http/session-plugin.ts` (S00)."

---

## High

### F4 — high — `FELLES_NOW` is parsed with Temporal outside the one allowed Temporal module
Location: AD-6 "`FELLES_NOW` (ISO with `Z` or offset, parsed by `Temporal.Instant.from`; ...)" versus AD-5 "the Temporal code lives in the server module `apps/api/src/platform/oslo-time.ts`" and Deferred "the polyfill import sits in one module". `config.ts` (Zod-parsed) cannot import `temporal-polyfill`.
Replace in AD-6: "`FELLES_NOW` (ISO with `Z` or offset, parsed by `parseInstant()` exported from `platform/oslo-time.ts` and called by `config.ts`; ...". Add to AD-5 after the lint-ban sentence: "`temporal-polyfill` is importable only from `platform/oslo-time.ts` (`no-restricted-imports`)."

### F5 — high — Scrypt verification bounds reject the test cost profile
Location: AD-11 "verification honours stored parameters only inside `N 2^14…2^17, r 8…16, p 1…4`, otherwise it fails" versus "the cost profile comes from config (tests use `N=2^12`)".
Seeded and minted test passwords hashed at 2^12 would fail verification. Replace the range with "`N 2^12…2^17`" (floor 2^12 is the documented test profile; production hashes at 2^16 and a stored N below the configured `FELLES_SCRYPT_N` is not rejected).

### F6 — high — `activity` must name `bookings`; table-name lint and module cycle
Location: AD-1 "Only the `bookings` module names the `bookings` table and only the `activity` module names `activity_events` (table-name lint rule per directory)"; AD-17 "Only `recordEvent` derives `subject_user_id` (the booking owner via `bookings.user_id`...)"; AD-1 "SQL appears only in ... seed"; AD-25 "Past bookings are inserted directly (DEC-18) with their events".
Problems: `recordEvent` in `activity/` reads `bookings.user_id` (violates the lint rule), or calls the `bookings` index while `bookings` use cases call `activity.recordEvent` (a cycle); the activity feed also joins resource and booking data; the seed names both tables; migrations name all. The lint exceptions are unspecified, so each agent writes a different rule.
Replace in AD-1 after "(table-name lint rule per directory)": "; the rule's allowlist is exactly `apps/api/db/migrations`, `apps/api/db/seed` and `apps/api/test`; `recordEvent` receives the owner id from `bookings/index.ts: getBookingOwnerId(tx, bookingId)` (a leaf function with no import of `activity`), so the dependency is one-way `activity -> bookings` for that function and `bookings -> activity` only for `recordEvent`, both through `index.ts` and type-only for the cycle (`activity/index.ts` exports `recordEvent`, `listEventsForBooking`; `bookings/index.ts` exports `countFutureBlocking`, `BookingsReadPort`, `getBookingOwnerId`)". If Jo prefers no cycle, make `recordEvent` take `subjectUserId` from the caller and let the DB trigger be the check; state which in AD-17.

### F7 — high — Event timestamp for seeded past events and `Tx.now`
Location: AD-6 "uses that value for every `*_at` column and the activity event of that mutation" versus AD-17 `recordEvent(tx, { type, actorUserId, bookingId?, resourceId?, payload })` (no `at`) and "Seed writes events for the past bookings it inserts".
Add to AD-7/AD-17: "`Tx` carries `now` (the use case's single `clock.now()` read); `recordEvent` stamps `at = tx.now`. The seed builds its own `Tx` per fixture row with `now` set to that row's creation instant, so past events carry past times."

### F8 — high — `GET /api/bookings` and `GET /api/resources` lack `truncated` and the resources list lacks `limit`
Location: Contract Minimums rows `GET /api/bookings` "`{ items }`", `GET /api/resources` "`{ items }`" versus AD-16 "Every list declares ... `limit` (default 100, max 200) ... lists other than activity add `truncated: boolean`" and Consistency Conventions "lists `{ items, truncated }`".
Replace: bookings row "`{ items, truncated }`; ... `limit` (default 100, max 200)"; resources row "`{ items, truncated }`; filters `kind`, `q`, `status`, `limit` (default 100, max 200); `status` defaults to `active`; a Member sending `status=archived|all` gets 403 `FORBIDDEN`". Add to AD-16: "The schedule response is exempt from `limit` and `truncated` (bounded by exclusivity: at most 196 blocks for 7 days) and `GET /api/bookings/:id` embeds its events as a plain array bounded by the activity writer (one event per mutation)." Also add after the bookings row the same 403 rule: "`scope=all` by a Member gets 403 `FORBIDDEN`".

### F9 — high — PATCH semantics contradict the Conventions table
Location: Consistency Conventions "requests accept `null` or omission for 'no value'" versus AD-2 "on `PATCH` an omitted key is unchanged and `null` clears an optional value".
Replace in Conventions: "optional values `null` in responses; on create requests `null` and omission both mean no value; on `PATCH` omission leaves the field unchanged and `null` clears an optional one".

### F10 — high — Files named in text but missing from the tree (oslo-time.ts, start script, build script, config entries)
Location: tree `src/platform/  db.ts unit-of-work.ts migrate.ts clock.ts logger.ts password.ts tokens.ts` and `scripts/  gen-tokens.mjs dev.mjs smoke.mjs trace.mjs check-ownership.mjs merge-gate.mjs demo-reset.mjs`; Layer table "Platform ... db, unit of work, clock, config, logger, password, tokens".
Missing: `platform/oslo-time.ts` (AD-5, AD-6 fix F4, AD-25 seed converter, lint allowlists), an `AppError` home (AD-4), a start script (AD-12 "the start script sets `UV_THREADPOOL_SIZE=8"`; AD-6 "`npm start` runs with `NODE_ENV=production`"; AD-24 forbids `VAR=x` prefixes, so a Node entry must set them), an API build script (AD-27 "esbuild bundle of `apps/api`"), `domain/policy.ts` (F11), `bookings/index.ts`, `activity/index.ts`.
Replace platform line: "src/platform/  db.ts unit-of-work.ts migrate.ts clock.ts oslo-time.ts logger.ts password.ts tokens.ts app-error.ts   # S00"; scripts line: add "start.mjs build-api.mjs"; Layer table Platform cell: "db, unit of work, clock, Oslo time (Temporal), logger, password, tokens, AppError". Add to AD-24: "`scripts/start.mjs` builds, then spawns `process.execPath` on the server bundle with `NODE_ENV=production` and `UV_THREADPOOL_SIZE=8`; `scripts/dev.mjs` does the same with `NODE_ENV=development`."

### F11 — high — `policy.can` has no file, owner or action list
Location: AD-14 "`policy.can(actor, action, subject)` is a pure function in the domain layer"; Layer table "Domain ... `modules/*/domain`"; AD-9 "transition table in the booking domain (S05)".
S02 (admin-only resources), S03 (read/create) and S05 (approve/reject/cancel) all need it. Add to AD-14: "`policy.can` lives in `apps/api/src/modules/auth/domain/policy.ts`, S00 implements the complete action union (`resource:*`, `booking:read|create|cancel|approve|reject`) from the rules in this AD; other modules import it through `auth/index.ts`; slices do not edit it."

### F12 — high — Documented start omits the native rebuild that `ignore-scripts=true` makes necessary
Location: AD-24 "The documented start is `npm ci`, `npm run db:seed`, `npm start`" versus AD-27 ".npmrc sets ... `ignore-scripts=true`; ... rebuilt by an explicit `npm run setup:native` ... that the README and CI call after `npm ci`" and AD-11 (better-sqlite3 is the native dependency).
Replace in AD-24: "The documented start is `npm ci`, `npm run setup:native`, `npm run db:seed`, `npm start`." State in AD-27: "`setup:native` rebuilds `better-sqlite3`".

### F13 — high — Dev-server port hard-coded to 5173 while `FELLES_VITE_PORT` exists
Location: AD-13 "plus the Vite `5173` origins only when `NODE_ENV=development`", "plus `localhost:5173` and `127.0.0.1:5173` in development"; AD-24 "development uses Vite on 5173 (`strictPort`)" and "Parallel worktrees set distinct `FELLES_PORT`/`FELLES_VITE_PORT`".
With a non-default `FELLES_VITE_PORT` every dev request is refused (403 `ORIGIN_REFUSED` / 421 `HOST_REFUSED`). Replace "the Vite `5173` origins" with "the Vite origins `http://localhost:VITE_PORT` and `http://127.0.0.1:VITE_PORT`" and "`localhost:5173` and `127.0.0.1:5173`" with "`localhost:VITE_PORT` and `127.0.0.1:VITE_PORT`", where `VITE_PORT = FELLES_VITE_PORT` (default 5173). AD-24: "development uses Vite on `FELLES_VITE_PORT` (default 5173, `strictPort`)".

### F14 — high — API composition root, seed and presenters are missing from the import rules
Location: Design Paradigm flowchart (`RT --> UC`, `UC --> PR`, no `RT --> PF`, no `PR --> CT`, no node for `app.ts`/`server.ts`/`db/seed`) and "Arrows are the only permitted import directions."
`app.ts`/`server.ts` must import http, platform and every module; `http/session-plugin.ts`/`error-handler.ts` import platform (clock, tokens, logger); presenters compute `expired` with `contracts/rules.ts` and return contract DTOs; `db/seed` imports platform (`oslo-time`, `db`, `password`), module indexes and contracts; the web `APP` needs the contracts route table.
Replace the API subgraph edges with: `RT --> UC`, `RT --> PF`, `UC --> DM`, `UC --> PR`, `UC --> RP`, `UC --> PF`, `RP --> PF`, `PR --> CT`; add nodes `ROOT[app.ts, server.ts, db/seed]` with `ROOT --> RT`, `ROOT --> UC`, `ROOT --> PF`; add `APP --> CT`. Add one sentence: "`app.ts`, `server.ts` and `db/seed` are the API composition root and may import every layer except `modules/*/routes.ts` internals."

### F15 — high — `trace.mjs` "fails when a MUST has no passing test" cannot run in a per-slice merge gate
Location: AD-26 "fails when a MUST has no passing test or a title has an unknown id" and AD-27/AD-20 "`scripts/trace.mjs` (which also runs in the merge gate)".
Before S07 most MUSTs have no test, so the gate fails. Replace with: "`trace.mjs --through <slice>` fails when a MUST whose owner slice is at or before `<slice>` (field `slice` in `requirements.json`, from the PRD owner table) has no passing test, or when a title has an unknown id; the merge gate passes the candidate's slice, `verify:full` on main and S07 pass `--through S07`."

### F16 — high — Smoke harness cannot be both NFR-01 evidence and a `NODE_ENV=test` harness
Location: AD-27 "the macOS job also runs `scripts/smoke.mjs` (fresh seed, start, log in, one booking, one conflict), which is the NFR-01 evidence" versus AD-6 "the Playwright, smoke and merge-gate harnesses boot the same production build with `NODE_ENV=test`" and AD-18 "every harness ... passes a temp `FELLES_DB_PATH`".
A smoke that sets `NODE_ENV=test` and a temp DB does not prove `npm start`. Replace in AD-6: "the Playwright and merge-gate harnesses boot ... with `NODE_ENV=test`; `smoke.mjs` runs the real `scripts/start.mjs` (`NODE_ENV=production`, real clock, no `FELLES_NOW`) against a temp `FELLES_DB_PATH` seeded by `npm run db:seed` in the same process environment". Adjust AD-18's harness sentence to "(Playwright, merge-gate and smoke pass a temp `FELLES_DB_PATH`)". Note `NODE_ENV` unset (seed, scripts) is treated as `development` for the 5173 allowlist only when `scripts/dev.mjs` sets it explicitly; add `NODE_ENV` (`development|test|production`, unset = `development`) to the config list in F31.

### F17 — high — Activity repository is touched by S00 and S06; auth too
Location: AD-20 "S00 also implements ... `activity/index.ts: listEventsForBooking`" versus tree `src/modules/activity/ writer.ts (S00) · read use cases (S06)`.
The read repository holding `listEventsForBooking` and the feed query would be one file edited by two slices. Replace tree line: "src/modules/activity/  index.ts (S00) · writer.ts (S00: recordEvent) · activity-events.repository.ts (S00: insert, listForBooking) · activity-feed.repository.ts and use cases (S06)". (Auth is handled in F3.)

### F18 — high — `bookings` presenter and DTO mapper have no owner
Location: AD-15 "DTOs are shaped per viewer in one presenter layer"; AD-16 "`expired: boolean` is computed in the presenter"; tree lists `presenter` only inside the auth shape.
S03 (create/read/list/schedule), S05 (transition responses) and S06 (dashboard `upcoming`) all need the same `BookingDto`/block projection. Add to AD-20: "`bookings/bookings.presenter.ts` is owned by S03 with the signature set stubbed by S00 (`presentBooking(row, viewer, nowMs)`, `presentBlock(row, viewer)`), exported through `bookings/index.ts`; S05 and S06 call it and do not edit it."

### F19 — high — Chart buckets and `confirmedNext7d` window disagree
Location: Contract Minimums dashboard "`confirmedNext7d` ... `chart:[7 × {date,confirmed,pending}]` ... buckets by Oslo start day" versus AD-5 "the 7-day dashboard window is likewise 7 × 24 h, strict: `end > now AND start < now + 7 × 24 h`".
An in-progress booking (started earlier today or yesterday) counts in `confirmedNext7d` and in no bucket if it started before today; a booking starting on Oslo day 8 before the same clock time counts in the window but not in the chart. Sum of bars can differ from the number shown. This is APPROVAL-BRIEF item 5 ("while the panel keeps the DEC-04 window") but the UX will show both. Add to the dashboard row: "The chart covers the seven Oslo days starting today and counts bookings by Oslo start day within that range (an in-progress booking from yesterday is not charted); its total may differ from `confirmedNext7d` and the panel must not state otherwise." Add the same wording to Open Question 3.

### F20 — high — Top three resources: definition incomplete
Location: AD-16 "Top three resources: SQL returns counts per resource, the use case sorts `count desc, compareNb(name), id`" and Minimums "`top:[≤3 {resource,count}]`" versus PRD DEC-04 "ranked by `confirmed` count, ... zero-count excluded" and the 7-day window.
Add to AD-16: "Counts are `confirmed` bookings in the AD-5 seven-day window per resource; zero-count resources are omitted; the use case returns at most three." Define `resource` in the row as the resource summary `{id,name,kind,symbol,colour}`.

---

## Medium

### F21 — medium — Frontmatter `binds` lacks ids used in ADs
Location: frontmatter `binds` omits `DEC-10` (AD-23 Binds), `PIL-05` (AD-20), `ORK-03`, `ORK-06`, `ORK-08`, `ORK-10` (AD-20, AD-26).
Add them: "..., DEC-10, ..., PIL-05, ORK-03, ORK-06, ORK-08, ORK-10".

### F22 — medium — Resource archive edge cases
Location: AD-10 "Archive (no `pending`/`confirmed` booking with `start > now`)", AD-4 `RESOURCE_ARCHIVED`.
Archiving an already archived resource has no stated outcome. Add to AD-10: "Archiving an archived resource answers 409 `RESOURCE_ARCHIVED`. Expired pending and in-progress bookings do not block archiving; an Expired request on an archived resource can still be rejected (AD-9)."

### F23 — medium — Table-name rule and `tx.now` aside, bookings/activity "other modules use their index.ts" omits `getBookingOwnerId`
See F6; kept as separate patch to the list in AD-1: "(`countFutureBlocking`, `BookingsReadPort`, `recordEvent`, `listEventsForBooking`" gains "`getBookingOwnerId`".

### F24 — medium — Bodyless wording
Location: Contract Minimums rows `POST .../approve` (empty "Minimum content"), `DELETE /api/session`, `POST .../archive`; AD-13 "bodyless POST/DELETE send `{}`"; AD-2 "Request schemas are `.strict()`".
Add to AD-13: "A bodyless contract declares body schema `z.object({}).strict()`; an empty body is treated as `{}` before parsing, and any key in it is `VALIDATION_FAILED`." Fill the approve row: "`{}`; 200 booking". State success statuses in AD-3 or Minimums: "POST create 201, login 200, logout 204, other POSTs 200".

### F25 — medium — `GET /api/dashboard` `upcoming` for Administrators
Location: Minimums dashboard "`upcoming:[≤5 bookings]`".
Add: "`upcoming` is always the viewer's own `isUpcoming` bookings, `start` ascending, for both roles".

### F26 — medium — Nav pill and `admin.pending` consumer unowned
Location: Minimums "the shell reads `admin.pending` for the navigation pill" versus AD-22 shell duties (no pill) and owner S06 for the dashboard.
Add to AD-22 S00 shell duties: "the Godkjenninger pill (reads `usePendingCount()` from `api/keys/dashboard`; S00 stub returns `null` until S06)". The frozen invalidation map must list `dashboard` for create, approve, reject, cancel.

### F27 — medium — Schedule parameters
Location: Minimums "`days` 1…7 (≤ 31-day range)".
The parenthetical is a stale month-view remnant. Replace with "`days` 1…7 (default 7); `from` any Oslo civil date; a malformed value is `VALIDATION_FAILED`".

### F28 — medium — "Every use case writes exactly one event" versus login/logout and no-op PATCH
Location: AD-17 "Each use case writes exactly one event" versus the same AD "a no-op writes no event" and AD-7 "Every mutation is a use case".
Replace: "Each booking or resource mutation use case writes exactly one event, or none for a no-op `PATCH`; login and logout write none."

### F29 — medium — Check order for lists: descending tie-break
Location: AD-16 "total-order tie-break (`start_at, id`)" with "past and default by `start` descending".
Add: "`id` follows the direction of `start_at`".

### F30 — medium — `RESOURCE_ARCHIVED` on approve is unreachable
Location: AD-9 (approve re-check list). Under AD-10 a pending booking with `start > now` cannot exist on an archived resource. Marked a defensive guard in F2's replacement; no further action.

### F31 — medium — Config variables incomplete
Location: AD-24 list ends at `FELLES_VITE_PORT`; AD-13 uses `FELLES_ALLOW_REMOTE_DEMO=1`; AD-6 and AD-18 read `NODE_ENV`/`VITEST`; AD-18 says env only through `config.ts`.
Add to the AD-24 list: "`FELLES_ALLOW_REMOTE_DEMO` (unset), `NODE_ENV` (`development|test|production`)"; and AD-18: "`openDatabase()` receives `config.nodeEnv` and `config.isVitest`".

### F32 — medium — Lint-ban scope for time APIs
Location: AD-5/AD-6 "lint-banned outside `i18n/format.ts`, `contracts/time.ts`, `platform/oslo-time.ts`" / "outside `platform/clock.ts` and `apps/web/src/app/clock.ts`".
`scripts/trace.mjs` (`runAt`), pino timestamps, `temp-db` retries and tests need `Date`. Add: "The bans apply to `apps/*/src` and `packages/*/src` excluding `*.test.ts(x)`; scripts, `e2e/` and `apps/api/test/` are exempt." (If F1 is accepted, the web clock path is `apps/web/src/api/clock.ts`.)

### F33 — medium — i18n literal-text rule has no lint
Location: AD-23 "components contain no literal user-facing text"; AD-22 names only `react/no-danger`.
Add to AD-22: "`react/jsx-no-literals` (`noStrings: true`) is an error in `apps/web/src/features` and `ui`." (eslint-plugin-react is already in Stack.)

### F34 — medium — "OQ-n" references clash with the spine's own list
Location: AD-27 "non-blocking until a remote exists (OQ-4)", Deferred "(OQ-2)", APPROVAL-BRIEF "(OQ-4)/(OQ-5)" versus Open Questions & Approvals items 2 ("New error copy") and 4 ("DEC-16 extension"). The references mean PRD OQ-2 (orchestrator) and OQ-4 (remote).
Replace with "PRD OQ-4" in AD-27 and "PRD OQ-2" in Deferred.

### F35 — medium — Contract freeze files
Location: tree "`session.ts resources.ts bookings.ts activity.ts dashboard.ts   # F2 for the last three at S03`" versus AD-20 "F2 at S03 acceptance (activity, dashboard, final schedule DTO)".
"Last three" = bookings, activity, dashboard, but `BookingDto` is needed by S05 and S06 before S03 accepts and only the schedule DTO is F2. Replace comment with "F1 for session, resources, bookings (BookingDto, create, transition inputs); F2 for activity.ts, dashboard.ts and the schedule DTO in bookings.ts (frozen at S03 acceptance)". Also AD-2 "One file per module plus `errors`, `time`, `rules`, `availability`" lacks `routes.ts`, `index.ts` and says "module" but the tree has `session.ts` for the auth module; add "`session.ts` (auth), `routes.ts`, `index.ts`".

### F36 — medium — `ResourceCard`, `BookingRow` etc. assigned to S00 but slot-picker pieces to S04: ok; the missing item is the `?booking=` host stub
Location: AD-20 "the `?booking=` detail host (implemented by S04)"; S02/S05 depend on `useBookingSheet`. Include `useBookingSheet` and the host as S00 stubs in `api/sheet.ts` (see F1) with S04 replacing the body.

### F37 — medium — Create at exactly `start == now` is born Expired
Location: AD-5 "create needs `start >= now`; ... start ≤ now is also what makes a pending request Expired".
Replace "create needs `start >= now`" with "create needs `start > now`" (consistent with cancel/approve and `isUpcoming`), or state the edge explicitly. Boundary tests use `buildApp({ clock })`, so pick one.

---

## Low

### F38 — low — erDiagram cardinalities and a missing link
Location: `bookings ||--o{ activity_events : audited_by`, `resources ||--o{ activity_events : changed_in`, `users ||--o{ activity_events : acts_in`.
Resource events have no booking, booking events have a resource id, and `subject_user_id` is a second user link. Replace the three lines with:
```
  bookings |o--o{ activity_events : audited_by
  resources |o--o{ activity_events : concerns
  users ||--o{ activity_events : acts_in
  users |o--o{ activity_events : is_subject_of
```
(Syntax valid; relationship labels are unique. The existing duplicate pair `users ... bookings : owns` / `decides_or_cancels` is valid Mermaid because the labels differ.)

### F39 — low — Mermaid flowcharts parse but two labels are fragile
`-->|same origin: SPA + /api|` and `-. verify:full + macOS smoke .->` contain a colon and `+`; recommended quoting for renderer robustness: `-->|"same origin: SPA + /api"|` and `-. "verify:full + macOS smoke" .->`. `subgraph machine [One machine, 127.0.0.1]` is fine.

### F40 — low — Table escaping
Stack row "Node.js | 24 LTS (`^24.15.0 \|\| >=26.0.0`)" and Minimums `\|null`/`null \| {...}` render correctly in GFM (escaped pipe in code span). No change; if the renderer used is not GFM, use `&#124;`.

### F41 — low — Binds fields that are not requirement ids
AD-6 "Binds: ... AD-11, AD-12", AD-19 "Binds: PIL-06, RUN-1, S00". Replace with "..., CR-3" (drop AD-11/AD-12; they consume the Clock) and drop "S00".

### F42 — low — Seed horizon wording
AD-5 "the date lies beyond the seeded horizon" versus AD-25 "bookings either side of ... 2027-03-28 for the DST suites". Replace AD-5 text with "(the date lies beyond the 30-day booking horizon of the seeded clock)".

### F43 — low — Host `[::1]` accepted but server binds 127.0.0.1 and Origin has no `[::1]`
AD-13: remove `[::1]` from the Host allowlist or add `http://[::1]:PORT` to Origins. Recommended: remove it.

### F44 — low — Order of Host and Origin refusals, and `Sec-Fetch-Site` code
AD-13 does not say which check runs first nor the code when `Sec-Fetch-Site` is not `same-origin`. Add: "Host is checked first (421), then Origin and `Sec-Fetch-Site` (both 403 `ORIGIN_REFUSED`)". Also state `RATE_LIMITED` from the global limiter carries `retryAfterSeconds: 1` (AD-12).

### F45 — low — `details.currentStatus` scope
AD-4 "each state error carrying `details.currentStatus`" is ambiguous for `RESOURCE_ARCHIVED` and `BOOKING_STARTED`. Replace with "`BOOKING_NOT_PENDING`, `BOOKING_NOT_CANCELLABLE`, `BOOKING_STARTED` carry `details.currentStatus` (booking status); `RESOURCE_ARCHIVED` has empty details".

### F46 — low — AD-16 generic limit sentence versus the activity exception
Replace "Every list declares its statuses, its sort ..., and `limit` (default 100, max 200); ... The activity list is ordered `id DESC` with `before` = an event id, default `limit` 20, max 100" with a lead "Every list except activity declares ..." and keep the activity sentence as its own exception.

### F47 — low — Stack versus text: `tsx`, `yaml`, test libraries
`tsx` is in Stack but no sentence says what runs TypeScript outside the bundle (`db:seed`, `demo:reset`, `dev`; `db:seed` runs before any build in the documented start). Add to AD-24: "`tsx` runs `apps/api` entries in development, `db:seed` and `demo:reset`". `yaml` (2.9.1) is named nowhere; either state its use ("`scripts/` read the PRD owner table front matter / `ownership.json` is JSON, so `yaml` parses `sprint-status`") or remove it from Stack. `@testing-library/user-event` and `@testing-library/jest-dom` are used implicitly by "Testing Library, jsdom"; add them or state they are not used. `eslint-plugin-react` is used (AD-22, F33), `pino-pretty` used (AD-28); no other Stack package is unused and no text package other than these is missing.

### F48 — low — `ORDER BY name` / `LIKE` ban has no mechanism
AD-16 "no `ORDER BY name` or `LIKE` feeds a user-visible result" is unenforceable as written. Add to AD-18: "A custom ESLint rule scans `*.sql.ts` constants and rejects `LIKE` and `ORDER BY` on `name`, `purpose` or `description`."

### F49 — low — Migrations at boot are stated only in AD-24
AD-19 should say who runs the runner: "The runner is invoked by `openDatabase()` callers at server boot, by `db:seed`, and by `temp-db`." (AD-24, AD-25, AD-26 each assume it.)
