# Rubric review: ARCHITECTURE-SPINE.md (FELLES, initiative altitude)

Reviewer: rubric walker (good-spine checklist, `reviewer-gate.md`). Read-only; the spine was not edited.
Inputs read: spine, `.memlog.md`, SKILL.md, reviewer-gate.md, `docs/requirements.md`, PRD, UX `EXPERIENCE.md` (all), `DESIGN.md` (resource lists, typography, tokens).

## Verdict

Strong, convergent spine with a well-chosen paradigm and good coverage of the operational envelope. It is not ready to hand off as is. Several rules cannot be enforced as written, the import diagram contradicts two ADs, the shared web components that parallel slices need have no home, and the memlog's open questions never reached the spine.

Counts: critical 0, high 7, medium 20, low 14.

## Technology verification (checklist 4)

Spot-checked with `npm view` on 2026-10-19. Every pinned version in the Stack table that I checked is current and matches: typescript (latest is 7.0.2; the 6.0.3 pin is right because `typescript-eslint` 8.71.2 peers `>=4.8.4 <6.1.0`), react 19.3.1, react-router 8.4.0 (node >=22), vite 8.3.4, @vitejs/plugin-react 6.1.2 (peer vite ^8), zod 4.6.7, better-sqlite3 13.0.3 (node >=22), fastify 5.12.7, @fastify/static 10.1.6, @fastify/helmet 13.2.0, @fastify/cookie 11.1.3, temporal-polyfill 1.0.6, vitest 5.0.5 (node ^22.12 || ^24 || >=26), eslint 10.13.0, eslint-plugin-react-hooks 7.1.1 (ESLint up to 10), esbuild 0.28.2, @playwright/test 1.64.1, prettier 3.9.10, tsx 4.23.15, jsdom 30.1.3, @hookform/resolvers 6.0.0, lucide-react 1.59.0, react-aria-components 1.22.1, pino 10.4.0, @types/node 24.19.x.

Confirmed claims:
- The `eslint-plugin-jsx-a11y` 6.10.2 peer range stops at ESLint ^9.
- `@types/better-sqlite3` is at 9.6.0, so the Deferred note about local types is right.

Behavioural check that failed: see H-1 (scrypt `maxmem`).

---

## HIGH

### H-1. AD-11 scrypt parameters fail on Node without an explicit `maxmem`
Location: AD-11 Rule ("`N=2^16, r=8, p=2`, 64-byte key").
Problem: I ran `crypto.scryptSync('p','s',64,{N:65536,r:8,p:2})` on Node 25 and it throws `ERR_CRYPTO_INVALID_SCRYPT_PARAMS ... memory limit exceeded`. The default `maxmem` is 32 MiB and this configuration needs 128·N·r = 64 MiB. It passes with `maxmem` raised. The memlog spike must have set it, but the spine does not say so. Because "test config lowers N", the test suite will not catch the failure. The first failure will be `npm run db:seed` or the first production-parameter login.
Fix: add to AD-11: "`maxmem` is set to at least 2·128·N·r (verification derives it from the stored parameters). One `hashPassword`/`verifyPassword` pair in `platform/password.ts` is the only caller of `scrypt`. A test hashes with the production parameters once."

### H-2. Shared web components have no home, and the rules forbid every route to them
Location: AD-18 ("Web features couple only through URL helpers and the `ui/` kit", "Features never import other features"), AD-20 (the ui kit list), Namespace map.
Problem: UX needs the same components in parallel slices. The booking list row appears in Mine bookinger (S04), Godkjenninger (S05) and Hjem (S06). The Timeline appears in Aktivitet (S06) and in the Booking detail sheet "Historikk" (S04). The Resource card appears in Ressurser (S02) and Hjem (S06). Chip groups appear in Ressurser and Ressursadministrasjon. The Table, Segmented control and Demo pill appear too. AD-20 lists only primitives plus Toast, Skeleton, Alert, Badge, Field, Button, EmptyState and StatusBadge, and `ui/` is frozen. S04, S05 and S06 will each hand-roll the row and the timeline, which is exactly the divergence the spine exists to stop.
Fix: add an explicit domain-component layer, `ui/` or `shared/`, stubbed in S00 as typed components with fixed prop signatures. At minimum: `BookingRow`, `ResourceCard`, `Timeline` and `TimelineEntry`, `ChipGroup`, `SegmentedControl`, `DataTable` and `DemoPill`. State who owns bodies (S04: BookingRow and Timeline; S02: ResourceCard) and that other slices consume only. Alternatively allow `features/<x>/public.ts` imports, but then say so in AD-1, the diagram and the lint rule.

### H-3. The freeze and ownership rule has no enforcement mechanism
Location: AD-18 Rule; Deferred "Orchestrator integration of the freeze list and file ownership (OQ-2)".
Problem: AD-18 says frozen files change only with Jo's approval and each directory has an owner. Nothing in verify, CI or the repo can detect an edit to `packages/contracts/**`, migrations, tokens or lint configs by a slice agent. PIL-06 makes this the entry gate for parallelism and ORK-10 depends on it. Deferring "integration" to the orchestrator lets two units diverge, so it fails checklist item 3. Also, `bookings` is split between S03 and S05 inside one module ("S05 files" are unnamed) and shares `routes.ts`, `index.ts` and the repository.
Fix: add to AD-18 or AD-25 a committed `ownership.json` (path globs, owner slice, `frozen: true`) and `scripts/check-ownership.mjs`. Run it in `verify` and CI. It diffs `git diff --name-only <merge-base>` against the declared story `OWNS` list, and fails on any frozen-path edit unless the story ledger carries a `FREEZE-APPROVED` entry. Name the S05 file set in `modules/bookings` (for example `transitions.ts`, `approve.use-case.ts`, `cancel.use-case.ts`) so S03 and S05 never co-edit a file. The orchestrator part stays Deferred; the repository-side check does not.

### H-4. The import diagram contradicts AD-2 and AD-19 and omits the presenter
Location: Design Paradigm mermaid plus "Arrows are the only permitted import directions".
Problem: the diagram has `WK --> CT` but no `WF --> CT`. Under AD-19, features run `zodResolver` over contract schemas and use DTO types, so feature code must import contracts directly. Under the diagram as written it cannot. Repositories map rows to branded ids and DTO types from contracts, but there is no `RP --> CT`. The presenter layer (AD-15, `presenter.ts` in the seed) appears in neither the diagram nor the Namespace map. S00 will generate the `no-restricted-imports` rules from this diagram, so either legitimate imports are blocked in every slice or S00 quietly deviates.
Fix: add `WF --> CT`, `RP --> CT`, `PF --> CT` if needed, and a Presenter node (`RT --> PR`, `PR --> DM`, `PR --> CT`). Add a Presenter row to the Namespace map. Add one sentence saying cross-module calls go `UC --> other module index`.

### H-5. List and read authorisation scope is not fixed for `/api/bookings`, and the route inventory is missing
Location: AD-14, AD-15; Capability map; memlog route table (not carried into the spine).
Problem: AD-14 covers reading one booking, and AD-15 covers schedule blocks and activity. Nothing says what `GET /api/bookings` returns per role: a Member's list is scoped to their own bookings, an Administrator may filter by user or status (the approvals queue), and a Member cannot widen the filter. This is the BR-6 / DEC-03 leak path, and S03 and S05 could implement it differently. Handoff items 5, 6 and 7 (single-booking read, availability payload, per-booking "Historikk") are only half-landed. The routes `GET /api/bookings/:id`, `GET /api/resources/:id/schedule` and the booking-scoped activity filter are named only in the memlog. The spine never states which module owns the schedule route (resources path, bookings module).
Fix: add a short route inventory to AD-3 or the Structural Seed: method, path, access and owning module for each route. Add to AD-15: "`GET /api/bookings` is scoped in the use case through `policy`: Member always `userId = actor`; filters never widen it; Administrator may filter any user. Activity accepts `bookingId` and obeys the same subject rule." Say `BOOKING_CONFLICT` carries no other booking's id, user or purpose in `details`.

### H-6. The approvable-pending count has no owner
Location: nothing in the spine; EXPERIENCE (nav pill "Godkjenninger, 3 venter", Mer dot, Hjem "+ 1 utløpt"); VIS-03/04, CR-3.
Problem: the count appears in the app shell (S00) on every page, on Hjem (S06) and in the queue (S05). The spine does not say which endpoint supplies it, which slice implements it, or which query key is invalidated after approve, reject and cancel. S05 and S06 run in parallel. The shell stub in S00 cannot compile a call to an endpoint nobody has contracted.
Fix: decide in AD-15 or AD-19: "the count comes from `GET /api/dashboard` (`access: authenticated`, Member gets `null`), or a dedicated `GET /api/approvals/summary` (`admin`) contracted in S00 with fields `approvable`, `expired`. The shell consumes it through a stubbed hook. `api/invalidation.ts` invalidates it on every booking mutation."

### H-7. Open questions and assumptions from the memlog never reached the spine
Location: whole document; memlog `(question) OQ-A/OQ-B`, `[ASSUMPTION]`s, "EXTENSION needing Jo", the missing `APPROVAL-BRIEF.md`.
Problem: the spine has no Open Questions / Assumptions section, and `companions: [APPROVAL-BRIEF.md]` points at a file that does not exist yet. Items that need Jo are therefore invisible in the deliverable:
- Node 25.9.0 on Jo's machine is outside `engines` (`^24.15.0 || >=26`). With `engine-strict`, the first `npm install` fails.
- 429 and 500 extend DEC-16's status list, while AD-4's heading says "DEC-16, confirmed" and does not flag the extension.
- S00 scope growth needs Jo's approval at the freeze.
- The schedule endpoint is assumed to be in S03.
- Resource-name uniqueness is deferred, but the schema freezes in S00.
Fix: add an "Open questions / Assumptions" section (or entries under Deferred with a revisit condition). Mark the AD-4 extension as `[needs Jo]`. Create `APPROVAL-BRIEF.md` or remove the companion link. Add a `preinstall` Node version check message that names the fix.

---

## MEDIUM

### M-1. "Expired rows purged on access" contradicts "GET never mutates" and AD-7
Location: AD-11 vs AD-13 vs AD-7.
Problem: `GET /api/session` is the bootstrap call, and a purge there is a write outside `UnitOfWork`. Repository writes require `Tx`.
Fix: purge inside the login use case's transaction and at startup (and optionally a timer); on read, only treat expired rows as absent.

### M-2. A frozen server clock breaks the throttle and session expiry in E2E
Location: AD-6, AD-12, AD-24.
Problem: `FELLES_NOW` freezes time. In the Playwright suites (fixed `FELLES_NOW`) five failures then lock the email forever, because the 10 s window never elapses. The web clock then drifts from the server clock anyway.
Fix: `FELLES_NOW` sets an offset clock that still advances (`now = FELLES_NOW + monotonic elapsed`) with a separate `FELLES_CLOCK=frozen` for API tests, or state that throttle and session timers use the monotonic source. Say it explicitly in AD-12.

### M-3. Relative paths resolve against the working directory
Location: AD-22 (`data/felles.db`), `static.ts`, `db:seed`, `npm start`.
Problem: npm workspace scripts run with the workspace directory as cwd. The seed and the server can open different databases, and the static directory is fragile once the API is bundled to `dist/server.js`.
Fix: "Relative `FELLES_DB_PATH` resolves against the repository root, found from the config module's location. The SPA directory is fixed as `dist/web`, produced by `npm run build`."

### M-4. Helmet defaults can break Safari on localhost
Location: AD-13.
Problem: `@fastify/helmet` merges its default directives (including `upgrade-insecure-requests`) unless `useDefaults: false`. On macOS Safari an http://127.0.0.1 origin can then have sub-resources upgraded to https and the app fails (NFR-01). HSTS is also sent over http.
Fix: add "`contentSecurityPolicy: { useDefaults: false, directives: {...} }`, `hsts: false` unless the request is https. Test asserts the exact header." The CI smoke test cannot catch this in Chromium, so the header test is the guard.

### M-5. Several frontend rules have no enforcement
Location: AD-19 (all HTTP through `api/call`; query keys from one factory), AD-20 (features use `ui/` wrappers only), AD-21 (no literal user-facing text; one date formatter).
Problem: only AD-1, AD-6 and AD-16 name a lint mechanism. The Stack has no `eslint-plugin-react` / i18n plugin.
Fix: add to AD-1's lint set: `no-restricted-imports` for `react-aria-components` outside `ui/`; `no-restricted-globals` for `fetch` outside `api/`; `no-restricted-properties` for `toLocale*` and `Intl.DateTimeFormat`/`NumberFormat` outside `i18n/format.ts`; a literal-string rule (`react/jsx-no-literals` or a custom rule that also covers `aria-label` and `title`).

### M-6. AD-24's traceability rule is not part of any gate
Location: AD-24 vs AD-25.
Problem: `scripts/trace.mjs` only reports. A MUST with no tagged test passes `verify`, which defeats PIL-01 ("a gap is a planning defect").
Fix: `trace.mjs --check` in `verify` fails when a MUST id in `requirements.json` has no `[ID]` test (with an explicit waiver list for manual-evidence items such as NFR-01, NFR-05).

### M-7. Handler and use-case wiring is not fixed
Location: AD-3, AD-6, AD-7, AD-24.
Problem: the spine says use cases "receive a Clock" and `buildApp({config, db, clock})` exists. It does not say how handlers and use cases receive `db`, `uow`, `clock` and the actor, or whether use cases are sync or async. This matters because async scrypt must run before `UnitOfWork.run`, and S01 and S02 write the first use cases in parallel.
Fix: add to AD-3: `registerRoute(contract, handler)` calls `handler(ctx, input)` with `ctx = { actor, deps: { uow, db, clock, config, log } }`. Use cases are plain functions `(deps, actor, input) => Promise<Result>`. Anything async (scrypt, I/O) happens before `uow.run(fn)`. `fn` is synchronous. Freeze the `Ctx` type in S00.

### M-8. Dashboard day-bucketing is undefined
Location: Deferred "Dashboard aggregate shape"; DEC-04 vs EXPERIENCE bar chart.
Problem: DEC-04 defines a rolling window (`end > now && start < now+7d`). The chart needs per-day stacked bars. Whether bars are Oslo calendar days from today, and whether a booking spanning the window edge or midnight counts in one bar, decides whether the bar totals equal VIS-04's headline number. Deferring to "contracts at S00" hands an Administrator-visible calculation to the stub-building slice.
Fix: add one rule to AD-5: "VIS-04 counts use the DEC-04 rolling window; chart buckets are seven Oslo days starting today, a booking belongs to the bucket of its start, and the chart total may differ from the headline; the Tabell view shows the bucketed numbers." Or change the chart to the same window. Either way, decide it in the spine.

### M-9. AD-1 forbids "reaching into each other's SQL" but does not forbid it
Location: AD-1 Rule.
Problem: the dashboard module must aggregate bookings, resources and activity. The Rule only says SQL lives in `*.repository.ts`. It says nothing about which tables a repository may touch, and nothing about how the SQL restriction is linted (which import is restricted: `better-sqlite3` and `platform/db` outside `*.repository.ts`).
Fix: add a table-ownership list (auth: users, sessions; resources: resources; bookings: bookings; activity: activity_events; app_meta: platform). State that `dashboard.repository.ts` is the one read-only cross-table repository. Restrict imports of `better-sqlite3` and `platform/db` to `*.repository.ts`, `platform/` and `db/`.

### M-10. QueryClient defaults are open
Location: AD-19.
Problem: TanStack defaults (retry 3, `refetchOnWindowFocus`) conflict with UX ("no auto-refresh that moves content", "Prøv igjen" on 5xx, offline alert). Three parallel UI slices will each tweak per-query options.
Fix: one `app/query-client.ts`: queries `retry` only for network or 5xx and at most once, `refetchOnWindowFocus: false`, `staleTime` stated; mutations `retry: 0`. Features may not override these.

### M-11. `npm start`, migrations and first run are under-specified
Location: AD-22, AD-17.
Problem: the documented start is `install`, `db:seed`, `start`, but the spine does not say whether `start` builds (the memlog says "build if needed"), whether migrations run at startup or only in `db:seed`, or what happens when `data/` is missing or the database is empty. RUN-1 is a MUST.
Fix: "`npm start` builds when `dist/` is missing or stale, then runs migrations on boot (creating `data/` if needed) and serves. `db:seed` migrates a fresh file then seeds and refuses a non-empty database."

### M-12. `demo:reset` ignores the WAL sidecar files and a live server
Location: AD-23.
Problem: deleting only `felles.db` while `-wal` and `-shm` remain gives a stale-WAL mismatch. On Windows deletion fails with EBUSY if the server is running.
Fix: delete `db`, `db-wal`, `db-shm`; abort with a clear message if the file cannot be opened exclusively.

### M-13. Content-type and framework-error mapping gaps
Location: AD-4, AD-13.
Problem: "Bodies must be `application/json`" has no status or code (400 vs 415). It does not say that bodiless POSTs (`approve`, `cancel` with no body, `DELETE /api/session`) are allowed. Malformed JSON, unknown route and 405 responses are not mapped to the envelope. 501 `NOT_IMPLEMENTED` is missing from the status mapping.
Fix: add to AD-4: 400 `VALIDATION_FAILED` for malformed JSON and wrong content type (requests without a body are exempt), 404 `NOT_FOUND` for unknown `/api/*`, 405 handled the same way, 501 `NOT_IMPLEMENTED`. `setErrorHandler` and `setNotFoundHandler` both live in `error-handler.ts`.

### M-14. Vite proxy target and IPv6
Location: AD-22.
Problem: the server binds `127.0.0.1`. A Vite proxy to `localhost:3000` resolves to `::1` first on Node 17+ and gets ECONNREFUSED on some Windows and macOS setups.
Fix: "dev proxy target is `http://127.0.0.1:${FELLES_PORT}`."

### M-15. Symbol list equality check is not delivered by AD-20
Location: AD-2 vs AD-20 vs DESIGN.md.
Problem: AD-2 says the tokens check asserts the symbol and colour lists equal `DESIGN.md`. AD-20 only checks that a contracts colour id has a `res-<id>` token. The symbol list is in a body table, not the front matter that `gen-tokens.mjs` reads.
Fix: either move symbols into the DESIGN.md front matter, or have the check parse the "Resource symbols and colours" table, and write that in AD-20.

### M-16. Email normalisation is undefined
Location: AD-11, AD-12, AD-23.
Problem: the throttle key is the "normalised email", but normalisation is not defined, nor is how emails are stored (collation, uniqueness). The seed and the login lookup can disagree.
Fix: "Emails are trimmed and lower-cased in contracts (`emailSchema`); stored lower-case with `UNIQUE`; the same function keys the throttle."

### M-17. The Capability map references governance the ADs do not contain
Location: Capability → Architecture Map, rows NFR-06 and others.
Problems:
- NFR-06 says "indexes in schema, AD-16", but AD-16 and AD-17 define no indexes.
- RES-03/RES-04 admin routes are not tied to AD-3, and BOK-01 is not tied to AD-4.
- AD-12, AD-18 and AD-26 appear in no row (AD-26 is not mapped to any capability).
- NFR-04 omits AD-12 and AD-26.
- UI-1 (eight pages) is mapped to `ui/i18n/app` instead of `features/*`.
Fix: add one AD-17 sentence ("S00 schema includes the indexes: bookings(resource_id, start_at), bookings(user_id, start_at), bookings(status, start_at), activity_events(subject_user_id, id)"), add the missing AD refs, and map UI-1 to `features/*`.

### M-18. Seed has absolute DST rows next to relative rows
Location: AD-23.
Problem: the generator is "driven by a reference instant", but the DST rows are pinned to 2026-10-25 (absolute). Under a real clock after that date they are past; under another reference they can overlap the relative rows and trip the overlap trigger.
Fix: "DST rows are absolute-dated on a dedicated resource, always inserted, and excluded from the relative set. The generator asserts no overlap."

### M-19. "Resource name uniqueness" Deferred conflicts with the schema freeze
Location: Deferred, AD-17.
Problem: "until epics decide" is fine only if that happens before S00. The schema is frozen in S00 and a new unique index is a migration needing Jo.
Fix: "Decide before S00 freezes the schema (epics step); default: unique, case-insensitive among active resources, error `RESOURCE_NAME_TAKEN`" or "default: not unique, no constraint" so the freeze has an answer.

### M-20. Browser clock and the frozen server clock
Location: AD-6.
Problem: `now = serverNow + monotonic elapsed` is computed at one bootstrap. After a long idle tab (the sleeping laptop case) monotonic time may not advance, and the label "Utløpt" can lag the server. Not stated when `serverNow` is re-synced.
Fix: "re-sync on every `GET /api/session` refetch (focus, login) and replace the offset."

---

## LOW

- L-1. Frontmatter `binds` omits ids that AD Binds lines use (DEC-03/04/08/09/10/17/18, PIL-01/12, ORK-03/06/08/10, E2E-01…10, CR-2/3). Either generate it from the ADs or drop ids that are not capabilities.
- L-2. AD-2's file list omits `routes.ts` (which the tree and the same sentence's "route table" need) and says nothing about where `messages.nb` lives.
- L-3. AD-17 number ranges skip S04 and S07, and AD-17 contradicts itself mildly: the whole schema is S00, so the per-slice ranges are only exceptions needing Jo. Say so.
- L-4. AD-10 says a resource is never deleted but nothing enforces it. Add a `BEFORE DELETE` trigger on `resources` (and `users`) or state that no delete function exists.
- L-5. AD-5 does not say whether the "not in the past" boundary is inclusive (DEC-08 says `start ≥ now`). A booking starting exactly now is created but is immediately Expired and not cancellable.
- L-6. AD-11 ignores the `FELLES_COOKIE_SECURE` env var that AD-22 defines. Reference it in AD-11.
- L-7. AD-19: `api/call` redirects to Innlogging on 401, but login's own 401 `INVALID_CREDENTIALS` must not redirect. Say "except `public` contracts".
- L-8. The activity `before` cursor is not defined (id vs time, order). Specify: `before` = activity id, order `id DESC`; lists have a default and maximum `limit`.
- L-9. The Stack lists `@types/node` as `^24`, an unpinned range. Pin to the verified 24.19.x. `@types/better-sqlite3` 9.6.0 is the only typings package; note that it targets an older major.
- L-10. AD-25 and the Deferred ESLint note: peer conflict on `npm install` is a hard error in npm 11 (ERESOLVE). Decide now: pin ESLint 9.x, or `overrides` for `jsx-a11y`. S00 should not discover it on first install.
- L-11. The chart (VIS-06) has no library decision. State "hand-written SVG, no chart dependency" in AD-20 so S06 does not add one.
- L-12. No graceful-shutdown rule (SIGINT/SIGTERM close the server then `db.close()` so WAL checkpoints), and no `TZ` independence statement (the server must not rely on `process.env.TZ`; AD-6 bans `new Date()` but not `getHours()`/`toLocale*` on the server).
- L-13. The Mermaid diagrams look valid (checked by reading; not rendered by a tool). The ER diagram omits the approver relation (`users ||--o{ bookings : decides`) that APP-02 requires.
- L-14. `status: draft` is correct pre-gate. Header comment: the spine is long for a "seed minimal" rule. AD-13's CSP string, AD-11's byte-level formats and AD-24's per-worker detail are decisions, not padding, but the Structural Seed tree (about 25 lines of file names) could drop the files nobody can diverge on (`logger.ts`, `tokens.ts`).

---

## Checklist walk

1. Divergence points: well covered (time, errors, transactions, routes, identity, schema, ownership). Missed: shared web components (H-2), list scope (H-5), approvable count (H-6), handler wiring (M-7), QueryClient defaults (M-10), dashboard bucketing (M-8).
2. Enforceable rules: AD-1, 3, 6, 8, 9, 16 and 17 are well enforced. Weak: AD-18 (H-3), AD-19/20/21 (M-5), AD-24 (M-6), AD-2/AD-20 symbols (M-15), AD-10 deletion (L-4).
3. Deferred: the freeze integration (H-3), the dashboard shape (M-8) and name uniqueness (M-19) could let units diverge. The rest are safe.
4. Technology: versions verified current; one behaviour fails as specified (H-1); ESLint/jsx-a11y is a known conflict (L-10).
5. PRD coverage: all capability ids are mapped; handoff items 5-7 are only partly landed (H-5, H-6).
6. Operational envelope: deployment, environments, config, logging, CI and backup are decided or deferred, and the infra and provider position (none, local) is explicit. Gaps are in start, migrate and reset mechanics (M-3, M-11, M-12, L-12).
7. Seed minimality: no template comments, valid-looking mermaid; the open-questions section is missing (H-7).
8. Capability map: mostly accurate; see M-17.
9. Internal consistency: AD-11 vs AD-13 (M-1), diagram vs AD-19 and AD-2 (H-4), AD-4 heading vs the DEC-16 extension (H-7), AD-2 vs AD-20 (M-15), frozen clock vs AD-12 (M-2).
