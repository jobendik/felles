# Reconciliation review: ARCHITECTURE-SPINE vs the pilot process

Reviewer scope: process fit only (parallel agents, gates, traceability, scope, Windows, S00 realism). Read-only; no input edited.
Inputs read: spine (AD-1..AD-26, Structural Seed, Deferred), .memlog.md (tail), requirements.md Part B (11-14), PRD 4.0, 7 (PIL-01..09), 8 (PIL-10..13), 10 (ORK), 11 (OQ-1..6), plus PRD owner table rows for context.
Note: the Stack versions (Vite 8, TS 6, better-sqlite3 13 and so on) post-date what I can verify; S00 should `npm view` each before pinning (Deferred already covers some).

## Verdict

The spine is strong on determinism (clock, temp DBs, single origin, route table, schema freeze) and the stub-first idea is right. It is NOT yet safe for ORK-03 (S01 and S02 in parallel) or for S04/S05/S06 in parallel. The freeze list protects the big shared artefacts, but a set of small, unowned shared files, plus several files that are single-owner in the tree but multi-slice in practice, will produce merge conflicts or blocked slices. Several of the fixes are cheap and can be written into the spine as an "ownership manifest" (see F-05).

Counts: Critical 2, High 9, Medium 10, Low 5.

---

## CRITICAL

### F-01 (Critical) Unowned, unfrozen shared files guarantee S01 and S02 conflicts
Walk-through of what each slice touches under the spine:

- S01: `modules/auth/**`, `features/auth/**`, `e2e/auth.spec.ts`, tests colocated. Plus (unavoidably) strings for the login page, session keys, a login/logout mutation entry, maybe test helpers.
- S02: `modules/resources/**`, `features/resources/**`, `e2e/resources.spec.ts`. Plus strings for catalogue/admin pages, resource keys, mutation entries, maybe test helpers.

Files BOTH slices must edit that the spine neither freezes nor assigns to one owner:
1. `apps/web/src/i18n/nb.ts` (AD-21: every UI string in this one file). Both slices append to it. Same hunk region, guaranteed textual conflict.
2. `apps/web/src/api/keys.ts` and `api/invalidation.ts` (AD-19: one factory, one map). Both add entries. S00 owns them but the spine does not say they are pre-populated or frozen.
3. `apps/api/test/clients.ts`, `app-factory.ts`, `e2e/support/*` (S00 creates, slices will extend: `loginAs`, `createResource` helpers). Not on the freeze list.
4. `package.json` / `package-lock.json` of any workspace when a slice adds a dependency (the lockfile conflicts on any two dependency adds). Root scripts are frozen, but workspace dependency lists and the lockfile are not.
5. `apps/api/db/seed/data.ts` (S02 may need richer resources; S01 users). S00 owned, not frozen.
6. The contracts Norwegian message catalogue (`messages.nb`): AD-2 lists it as part of contracts but the file list has no `messages.ts`; if it lives in `errors.ts` it is frozen and any new message needs Jo.

Fix (put into the spine):
- Split by feature, pre-wired in S00: `i18n/nb/<feature>.ts` (auth, resources, bookings, approvals, dashboard, activity, common) with `i18n/nb.ts` as a frozen barrel that already imports all of them (empty objects). Same for `api/keys/<module>.ts` and `api/invalidation/<module>.ts` behind a frozen index. Restate AD-21 as "strings live under `i18n/nb/`, one file per owner".
- Same pattern for `apps/api/test/helpers/<slice>.ts` and `e2e/support/<slice>.ts`, with S00 keeping `app-factory.ts`, `temp-db.ts` frozen.
- Add to the ownership map: "dependency additions: one commit on main by the integrator before the parallel pair starts, else Jo-approved; `package-lock.json` is regenerated only on main". Pre-install every foreseeable dependency in S00 (chart approach for S06, see F-08).
- Make the messages catalogue location explicit and either frozen with all codes written in S00 or split per module like the rest.

### F-02 (Critical) `bookings` and `activity`/`dashboard` modules are single-owner on paper, multi-slice in practice (S03, S05, S06)
The tree says `modules/bookings`: "create/read/list/schedule (S03); cancel/approve/reject (S05)". But the architectural unit is one `routes.ts`, one `bookings.repository.ts`, one `presenter.ts`, one `index.ts`, one `domain/` per module (AD-1, namespace map). Concretely:
- S05 must edit `bookings.repository.ts` (compare-and-set UPDATE functions), `domain/` (transition table is S05 content but S03's create path uses status), `presenter.ts` (cancel/approve responses, reason fields), `index.ts` (exports for S06), and the route handlers in `routes.ts`. These are S03-authored files; edits there are fine for S05 alone, but...
- S06's dashboard (VIS-03/04, VIS-06 chart) needs bookings aggregates: upcoming for me, pending count excluding Expired, 7-day confirmed count, top 3 resources. Under AD-1 `dashboard` may only call `bookings` through `bookings/index.ts`, and may not write its own SQL on the `bookings` table. So S06 must add exported read functions to `bookings/index.ts` + `bookings.repository.ts`, the same files S05 is editing in parallel. Conflict, and a hidden cross-slice signature dependency.
- S05 and S06 both consume `activity/writer.ts` and `activity` indexes (S00 writer; fine) but S06's read use cases sit next to the writer in `modules/activity/`; low risk if the writer is frozen.

Fix:
- Split files inside shared modules and record per-file owners: `bookings/bookings.repository.ts` (S03, frozen after S03 acceptance), `bookings/booking-transitions.repository.ts` + `bookings/transitions.routes.ts` + `bookings/domain/transitions.ts` (S05), `bookings/bookings-read.repository.ts` + `bookings/read-port.ts` (S06, aggregate queries). Route registration: S00 places each stub in the file of the implementing slice (AD-18 already says that; extend it to multiple route files per module, `modules/bookings/index.ts` frozen with the full export list typed in S00).
- Add an AD-1 exception: a module's `*-read.repository.ts` owned by a consuming slice may read another module's tables read-only, listed in the manifest. Or have S00 declare a `BookingsReadPort` interface (signatures derived from `contracts/dashboard.ts`) that S06 implements.
- Ensure S03's acceptance checkpoint re-freezes `bookings/index.ts` before S05/S06 start.

---

## HIGH

### F-03 (High) S01 and S02 are not independently verifiable: session behaviour lives in S01, but S02 needs an authenticated actor
`GET /api/session`, `POST /api/login`, `POST /api/logout` are S01 handlers (501 stubs in S02's worktree). S02 needs: (a) API tests with an Administrator and a Member: possible via `clients.ts` minting sessions directly in the DB, but the spine does not say `clients.ts` does that; (b) the web shell knowing the role to show admin navigation, and `serverNow`, both from `GET /api/session` (AD-6), which is 501 in S02's tree; (c) Playwright `loginAs(admin)`, with no test-only HTTP route allowed (AD-24) and login not implemented. Result: S02's UI and E2E cannot run until S01 merges, which defeats ORK-03 in practice, and `http/session-plugin.ts` (S00) needs a sessions repository that is declared under `modules/auth` (S01).
Fix: S00 owns (and implements, not stubs) cookie to actor resolution (`session-plugin`, sessions repository, `tokens.ts`) and the read-only `GET /api/session`; S00 test kit provides `mintSession(db, userId)` and a Playwright fixture that inserts a session row into the per-worker temp DB before boot and sets the cookie. S01 then owns login, logout, throttling, login UI and policy tests. Record this as a (small) S00 addition for Jo's approval (F-12).

### F-04 (High) Cross-module SQL in S02: archive guard needs future bookings, but `bookings` does not exist yet
RES-04 (S02) requires "no future pending/confirmed booking". AD-1 forbids reaching into another module's SQL; AD-10 requires the guard inside the same transaction. The `bookings` module is S03 and does not exist while S02 builds; S02's own guard test uses direct inserts (per PRD RES-04 row), so S02 will in practice put SQL on `bookings` into `resources.repository.ts`, breaking AD-1 and the ESLint rule (or it fails lint).
Fix: S00 ships `bookings/bookings.repository.ts` with one finished function `countFutureBlocking(db|tx, resourceId, nowMs)` and exports it via `bookings/index.ts` (trivial SQL, schema is S00). S02 calls it. Add the same for "is resource referenced by any booking" if needed. Document in the manifest as an S00-implemented seam.

### F-05 (High) Ownership and freeze are prose, not machine-checkable; PIL-06 asks for a recorded partition and Jo's approval, ORK-10 for deterministic gating
The partition is a comment column in a tree diagram. Nothing stops an agent editing a frozen file, and "needs Jo" has no technical expression (OQ-2 is deferred to the orchestrator, but the repo-side half belongs in S00).
Fix: add to S00 `ownership.json` (path glob to owner slice, plus `frozen: true` globs) and `scripts/check-ownership.mjs <slice> <base>`: lists changed files against the owner map, fails on any file outside the slice's globs or any frozen path without a `Freeze-Approved: <ref>` commit trailer (the approval record the ledger already needs). Tag `s00-freeze` / `s03-freeze` and diff against the tag. Run it in `verify` (when a slice env var is set) and in the merge gate (F-07). This also gives the orchestrator a concrete input for file ownership in task cards (PIL-05).

### F-06 (High) Delivery ledger and pilot log live in the repo but have no branch discipline (breaks ORK-03, PIL-04)
PIL-02/04: status in `sprint-status` and story-file ledgers under `_bmad-output/implementation-artifacts/`, metrics in `_bmad-output/pilot-log.md`. The spine's Git row says "One story, one branch, one worktree" and is silent on where these files are edited. If each slice branch updates sprint-status.yaml and the log, S01 and S02 collide on the shared file every time, and a ledger commit changes the SHA the evidence refers to ("a new commit invalidates earlier entries").
Fix: add a rule to AD-18/Git row: slice branches never edit sprint-status, other stories' files, or `pilot-log.md`; ledger entries are written on `main` (or a dedicated `pilot-state` worktree) by the orchestrator/human, referencing the code SHA; the log is append-only with `merge=union` in `.gitattributes`. Each story file is touched by its own branch only.

### F-07 (High) Merge gate for ORK-07/ORK-10/PIL-12 is not defined; the spine only gives "run verify:full somewhere"
PIL-12: merge only when `tested` + `reviewed` are on the exact commit and shared integration tests are green on the *merge candidate*. The spine's CI is non-blocking until a remote exists (OQ-4), so locally nothing defines the candidate, which tests are "shared integration tests", or what is recorded.
Fix: define in AD-25: `scripts/merge-gate.mjs <branch>`: creates a throwaway worktree at `merge-base(main, branch)` merged (no-ff, no commit) with the other already-queued branches, runs `npm ci` if lockfile changed, then `verify:full` plus `check-ownership`, emits a JSON result bound to the candidate tree hash and exits non-zero on failure. Name the shared integration set explicitly: route-enumeration test (AD-3), schema snapshot, tokens check, contract round-trip tests, E2E smoke path. Merge is a fast-forward of the verified candidate only (so what was tested is what lands). Merge order is serial (one at a time), which is what makes ORK-10 deterministic.

### F-08 (High) `ui/` freeze plus unbuilt consumers: S04/S05/S06 will need kit components that are frozen or not yet decided
`ui/` "tokens and primitives" are frozen after S00 (AD-18). AD-20 lists: modal, sheet, popover, tooltip, switch, radio group, tabs, toast, skeleton, alert, badge, field, button, empty state, status badge, `useRovingGrid`. Not listed but needed by S02/S04/S05/S06: select/combobox (resource and filter pickers), table or list rows, card/stat tile, segmented control or checkbox, textarea (reason, purpose), confirm dialog with required reason, date input wrapper, the SVG chart for VIS-06 (no chart dependency in the Stack, text alternative required), calendar grid and slot picker (the two consumers of `useRovingGrid`). Building `useRovingGrid` in S00 before its only consumers (calendar and slot picker, S04) is guessing, and every miss becomes a frozen-file change needing Jo.
Fix: (a) state where feature-local components go (`features/<x>/components`), (b) allow ui/ *additions* (new files only, no barrel: import by path `ui/<name>`) by the owning slice without Jo, while modifications to existing frozen primitives still need Jo, (c) move `useRovingGrid`, chart and calendar grid to S04/S06 ownership, with S00 only freezing tokens plus the primitives the shell and S01/S02 need, (d) decide the chart approach (hand-rolled SVG, no new dependency) in the spine so S06 does not touch the lockfile.

### F-09 (High) Contracts frozen at S00 with no amendment procedure and some shapes still undecided
Deferred says dashboard aggregate shape and activity payload fields are "owned by contracts at the S00 freeze". So S00's agent must design VIS-03/04/05 DTOs and the chart series before any consumer exists, and then any miss in S03..S06 requires a Jo-approved change to a frozen file while up to three agents are running (PIL-06 says approval "not just a log entry").
Fix: two-step freeze. F1 at S00 acceptance: `errors`, `time`, `rules`, `routes` skeleton, `session`, `resources`, `bookings` request/response shapes. F2 at S03 acceptance (a natural checkpoint, ORK-02 already gates it): `activity.ts`, `dashboard.ts`, schedule DTO final. Add an "amendment path": additive-only change (new optional field, new error code, new message) proposed as a one-commit contracts PR to main by the integrator, approved by Jo, then rebased by all running branches; breaking change stops all parallel work (PIL-06 intent). Record in AD-18. This tightens, not loosens, the freeze, but makes it operable.

### F-10 (High) Password hashing parameters will fail at runtime as written
AD-11: scrypt `N=2^16, r=8, p=2`. Node's `crypto.scrypt` enforces a memory limit (default `maxmem` 32 MiB); this needs about 128*N*r = 64 MiB, so it throws `ERR_CRYPTO_INVALID_SCRYPT_PARAMS` (memory limit exceeded) unless `maxmem` is set. Also every login, seed and test login then costs hundreds of ms of libuv threadpool time (4 threads), slowing every API integration suite and E2E and tempting agents to weaken tests.
Fix: AD-11 states `maxmem = 128 * N * r * 2` explicitly; hashing parameters come from config (`FELLES_SCRYPT_N`, tests and seed-for-tests use N=2^10..2^12, stored parameters are honoured at verify time per the existing rule); S00 test for round-trip with both profiles. Keep the production profile for `db:seed` default.

### F-11 (High) Windows pitfalls the spine leaves open (grouped, each needs a line in AD-22/AD-25)
1. **Line endings**: Windows checkouts default to CRLF; `tokens check` (committed `tokens.css` vs generated), Prettier `--check`, the schema snapshot comparison and the migration checksum will all differ between Windows and the Linux/macOS CI jobs. Fix: commit `.gitattributes` (`* text=auto eol=lf`, `*.sql text eol=lf`), Prettier `endOfLine: "lf"`, generators write LF, checksum computed over LF-normalised bytes.
2. **Spawning npm on Windows**: since Node 20.12/22 `spawn("npm.cmd")` without `shell: true` throws EINVAL. `scripts/dev.mjs`, `smoke.mjs`, merge-gate and Playwright `webServer.command` must invoke `process.execPath` with a JS entry (for example `node ./node_modules/vite/bin/vite.js`, `node apps/api/dist/server.js`) or use `shell: true` deliberately. State this rule.
3. **SQLite file locking**: Windows refuses to delete or rename an open DB, `-wal`, `-shm`. Temp-DB helper must close the connection before removal and use `fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })` (antivirus also holds files briefly). `demo:reset` (AD-23) says it "deletes the database file": must delete `felles.db`, `felles.db-wal`, `felles.db-shm`, and fail with a clear Norwegian/English message if the server still holds the file (EBUSY/EPERM), whereas on macOS/Linux it would silently unlink under a running server. Same for `db:seed` against a running server (SQLITE_BUSY).
4. **Process termination**: Playwright and tests killing the server child get `TerminateProcess` on Windows (no SIGTERM handlers run, no WAL checkpoint). Acceptable, but the spine should say graceful shutdown handles SIGINT/SIGTERM for macOS/Linux and that tests must not depend on shutdown hooks. The AD-8(b) child-process race test must spawn via `process.execPath`, not a shell.
5. **Relative DB path**: `FELLES_DB_PATH` default `data/felles.db` resolves against `process.cwd()`. `npm -w apps/api` scripts run with cwd = workspace directory, so dev and start would use different files. Fix: resolve relative paths against the repository root (found from `import.meta.url`), and have `config.ts` log the absolute path at startup.
6. **Native module**: `better-sqlite3` ships prebuilt binaries only for supported Node ABIs. With Jo's local Node v25.9.0 (OQ-B) there may be no prebuild and the build needs Visual Studio Build Tools and Python; with `engine-strict` the install is refused anyway. Fix: S00 step 0 is "on Windows: `npm ci` on Node 24, confirm the prebuilt binary loads, record the exact minor". Offer `node:sqlite` as the documented fallback only if a prebuild is missing (the repository layer isolates it).
7. **Parallel worktrees on one machine**: fixed ports (3000 API, 5173 Vite) and `data/` collide when two worktrees run `npm run dev`. Fix: `FELLES_PORT`/`FELLES_VITE_PORT` per worktree (derive from a `.env` the orchestrator writes), Vite `strictPort: true` and proxy target from the same variable. Playwright already uses free ports per worker; say the same for vitest listening servers (port 0).
8. **Path length**: worktrees nested under a long parent plus `node_modules` can exceed MAX_PATH (260). Document `git config core.longpaths true` and keep worktrees short (`C:\wt\s01`). Each worktree also needs its own `npm ci` (native build included): budget this in the S01/S02 start (time metric, PIL-07).

### F-12 (High) Scope changes against PRD 4.0 that need Jo's approval but are only half-flagged
- **S00 growth.** PRD 4.0 S00 = repo, schema, shared contracts, seed, scripts, verify gate, CI file, app shell/navigation/layout, activity-event writer. The spine adds: complete route table with 501 stubs for every contracted route, the whole `ui/` kit (about 16 components with React Aria wrappers and a11y tests), `useRovingGrid`, api client/keys/invalidation, i18n and formatters, token generator and its check, custom ESLint boundary rules, Playwright config and fixtures, API test kit, env/config, static serving, origin guard, helmet, logger, smoke script, trace script, whole-schema triggers and snapshot test. Memlog records this as an assumption "needs Jo approval at the S00 contract freeze", but the spine itself does not flag it, and the approval brief should state it plainly together with the effect (one agent, PIL-06 ramp, the longest slice; no parallelism available during it).
- **Schedule endpoint moved to S03.** PRD 4.0 and the owner table put VIS-01 (anonymous blocks, week view) and BOK-07 in S04. The spine puts the "schedule route in `modules/bookings`" and the AD-15 anonymous/detail projection in S03 so S04 is UI only. Reasonable, but it changes S03's contents (and acceptance gate ORK-02), and the memlog says "needs confirmation at epics". The spine body states it without the flag. Needs Jo's explicit yes, and the epics must move VIS-01 API evidence and E2E-01/02's schedule assertions accordingly.
- **Session read in S00** (F-03) and **`countFutureBlocking` in S00** (F-04) are further S00 additions.
- **Node 24 pin** with `engine-strict` forces Jo's machine off v25.9.0 (OQ-B). That is an environment change for Jo, not a requirement change, but it blocks the first install: put it in the approval brief as a pre-S00 action.
- **`features/booking-actions` as its own feature folder** differs from the PRD VIS-02 wording ("S04 owns the module and exposes a cancel slot; S05 supplies the action"). Compatible, but mention it.
Fix: add a short "Deviations from PRD 4.0" section to the spine/approval brief listing these five with the approval question for each.

---

## MEDIUM

### F-13 (Medium) BookingDetail sheet vs BookingActions slot: the import rule contradicts the wiring (S04 and S05)
"Features never import other features" (diagram note) but the `?booking=` detail host is a "typed stub" with no declared location, and the `BookingActions` slot is `features/booking-actions` (S05) which the S04 `bookings` feature (Mine bookinger rows, calendar block popover, detail sheet) must render. If the host lives in `features/bookings`, it imports `features/booking-actions`: forbidden. If it lives in `app/`, `app` imports features, which the diagram does not allow (though the router must import pages anyway, so the diagram is already inexact).
Fix: state in AD-1/AD-19: `app/` is the composition root and may import feature pages and slot components; features receive slots via props or a registry (`app/slots.ts` exports `BookingActionsSlot` with a frozen props type: `{ booking: BookingDto; viewer: ViewerDto; placement: 'sheet' | 'row'; onChanged(): void }`). The host (sheet component) is owned by S04; the slot stub renders `null`; S05 replaces the body of `features/booking-actions/index.tsx`. Check the props cover: cancel with required admin reason (reason dialog composed from the `ui/` modal), approve and reject if the sheet shows them for admins, and conflict/stale-state error mapping. Also say who owns `useSession` and the clock (`app/` S00), since shell shows name and role (AUT-04) before S01 exists.
Concrete file walk, S04 vs S05: S04 touches `features/bookings/**`, `e2e/bookings.spec.ts`, `i18n/nb/bookings.ts`; S05 touches `features/booking-actions/**`, `features/approvals/**`, `modules/bookings` transition files, `e2e/approvals.spec.ts`, `i18n/nb/approvals.ts`. With F-01/F-02/F-13 applied there is no shared file. Without them: `nb.ts`, `invalidation.ts`, `bookings.repository.ts`, the sheet file.

### F-14 (Medium) Invalidation map and nav config for S04/S05/S06
`api/invalidation.ts` maps mutation to key prefixes: create booking (S04), approve/reject/cancel (S05) must invalidate schedule, mine, approvals, dashboard, activity (S06 queries). If S06's keys are added later, S05's map is incomplete and the dashboard goes stale (EXPERIENCE: server is truth). The nav config is frozen, but the admin approvals badge (pending count) needs a data source: from `GET /api/dashboard` (S06) or an approvals list (S05)? Unstated.
Fix: S00 defines the complete key factory (all prefixes for all modules) and the complete mutation-to-prefix table, frozen; add a test that every contracted mutation route has an invalidation entry (derived from the route table). State the badge's endpoint and owner in contracts.

### F-15 (Medium) PIL-01/PIL-08: `[ID]` test titles give requirement to test, but not evidence, SHA or story
`scripts/trace.mjs` extracts id to test file/title. PIL-01 needs "acceptance evidence recorded against a commit SHA" with pass result; PIL-08 needs requirement to story to run to commit to evidence shown on screen. Gaps: (a) a skipped, todo or failing test still shows as a title, (b) no result data or SHA, (c) non-automatable MUSTs (NFR-05 README fresh-clone, NFR-01 manual, contrast) have no record format, (d) the prefix convention is unenforced and `describe` nesting changes titles, (e) a MUST with zero tests is not flagged, (f) story ids are absent.
Fix: Vitest and Playwright run with a JSON reporter; `trace.mjs` consumes results and emits `trace.json` (`reqId, testFile, title, status, sha, dirty, tool, runAt`) and exits non-zero when a MUST has no passing test or a test title lacks a known id (the known list comes from a machine-readable `requirements.json` generated from the PRD owner table). Forbid `.skip`, `.todo`, `.only` via ESLint (`no-only-tests`, `no-skipped-tests`) and `forbidOnly`. Add a `manual-evidence/<reqId>.md` convention for non-automatable MUSTs with SHA and checker. Add a `Story: <id>` tag (annotation or title suffix) so trace links story to test. Write the output under an untracked `_bmad-output/evidence/` keyed by SHA so writing it does not change the SHA being evidenced.

### F-16 (Medium) ORK-06 (a real test failure blocks completion) needs hardening in the gate itself
`verify` as a plain `&&` chain is correct on cmd.exe and bash, but: (a) Playwright `retries` > 0 would turn a real failure into "flaky pass": set `retries: 0` locally and in CI; (b) ESLint warnings must fail (`--max-warnings 0`); (c) Vitest must not pass on zero tests per project (`passWithNoTests: false`, default but state it) because a slice with deleted tests would stay green; (d) a stubbed route left as 501 must not survive: add an S07-owned test that no contracted route returns `NOT_IMPLEMENTED`; (e) S00 tests must not assert 501 (they would fail when slices land); (f) the failure injection needed to observe ORK-06 should be a documented branch-level edit (break an assertion in a throwaway commit), never a runtime flag or test-only route.
Also record the exit code and test counts in the verify result JSON (F-15) so the board can show "test result" (ORK-04).

### F-17 (Medium) ORK-10 and test determinism
Good: fixed `FELLES_NOW`, temp DBs, per-worker servers. Gaps: concurrency tests (AD-8 a, b, d) are timing-based; define N and require the assertion to hold for any interleaving (exactly one 201), plus barrier-start so they are not accidentally serial. Run concurrency suites in a single vitest worker to avoid CPU starvation flake across parallel agents on one machine. Ban real time in E2E waits (`waitForTimeout`). Add `NODE_ENV`/`VITEST` guard also for Playwright (`FELLES_DB_PATH` must be set to a temp path and equal to the harness-created path; fail otherwise) because the opener's guard keys only on VITEST/NODE_ENV=test and the E2E server is a production build.

### F-18 (Medium) E2E-01..03 and E2E-07 "early" (spec section 14 Phase B) have no UI at S03
Spec: run E2E-01..03 and 07 early; PRD gives E2E-01/02 to S03 (with S04 UI). The spine only describes Playwright against the production build. Say that S03 evidence for E2E-01/02/03/07 is API-level (Playwright `request` fixture or `app.inject`, same titles and ids) and that the UI variants are added by S04.

### F-19 (Medium) PIL-09 wording vs spine: "S00 contracts approved before application code starts"
PIL-09 requires Jo's approval of PRD, architecture, epics and S00 contracts before application code. The spine produces the contracts *in* S00 (code). Two readings: contract design is approved as a document first, or S00 is the first code and Jo approves at S00 acceptance (which PIL-06 entry gate implies). The spine should state which: recommend a contract draft (route table + DTO list as a reviewable markdown or the contracts package at a "draft" tag) approved by Jo mid-S00, then S00 acceptance. Otherwise the pilot log will show a PIL-09 violation.

### F-20 (Medium) Migrations: ranges are fine, but other schema artefacts and ordering are single files
The schema snapshot is one committed file (conflict if two slices ever change schema; acceptable since each change needs Jo). The runner behaviour for out-of-order versions is unspecified: dev DB with 0200 applied then merging 0100 should apply the lower pending version, not refuse. S04 has no range (correct) but S07 may need one. Fix: runner applies any unapplied version in ascending order and only fails on checksum mismatch of applied ones; add an S07 range (0700s); state that a migration needing a data backfill is Jo-gated too.

### F-21 (Medium) S00 deliverable list is complete in breadth but unrealistic as one task, and it sets the contract in the dark
Implied S00 deliverables, from the spine: scaffold (three workspaces, TS, ESLint with boundary rules, Prettier, scripts, `.nvmrc`, `.gitattributes` missing), contracts (8 files, route table with schemas/errors per route, message catalogue, rules), platform (db, UoW, migrate, clock, logger, password, tokens, config), http (registerRoute, error handler, origin guard, session plugin, static, helmet), complete schema with triggers and snapshot test, activity writer, seed generator, test kit, Playwright config and fixtures, ui kit and tokens generator, app shell, router, nav, i18n, api client, CI file, smoke, trace, demo-reset, README skeleton. This matches PRD 4.0 only partly (F-12). Risk: single agent, long, high review cost for Jo, and every detail frozen at the end.
Missing or implicit items that must be added to be able to freeze: `.gitattributes`, `ownership.json` + check script (F-05), `requirements.json` + trace reporter (F-15), `merge-gate` script (F-07), full key/i18n/test-helper split barrels (F-01), session minting and `GET /api/session` (F-03), `countFutureBlocking` (F-04), `bookings` read port (F-02), `BookingActions` props type and slot registry (F-13), port/worktree env (F-11.7), scrypt profile config (F-10), a tiny `docs/` ownership note for the orchestrator.
Fix: keep S00 as one slice but cut it into the spec's three tasks with an explicit Jo checkpoint after T00-02 (schema + contracts draft: F-19), and move to later owners what has no S00 consumer (`useRovingGrid`, chart, calendar grid: F-08; smoke and trace can land with a first-pass in S00 and be completed in S07). Define S00 acceptance as: `verify:full` green on Windows, CI file lints, route-enumeration test green with all stubs, one worked "hello slice" proving a slice can add a route, a string, a key and a test without touching frozen files (this is the best dry run for ORK-03).

### F-22 (Medium) Test and seed data conflicts across parallel branches
Seed (S00) already has everything but S01..S06 tests will want scenario data (for example S05's Expired pending request, S06's 7-day window). Without a rule each slice edits `db/seed/data.ts`. Fix: tests build scenarios with their own builders in `apps/api/test/helpers/<slice>.ts` over the minimal base seed; `data.ts` is frozen at S00; any seed change needs a SEED-1 check and Jo approval only if it changes the E2E baseline (`FELLES_NOW=2026-10-19T07:00:00Z`).

---

## LOW

### F-23 (Low) `useSession`/clock location and AUT-04 ownership
Shell (S00) shows name and role (AUT-04, S01 evidence). Say that the hook is `app/session.ts` (S00) and S01 evidences it.

### F-24 (Low) `npm run` scripts on cmd.exe
The rule "no Bash-only syntax" should list the concrete traps: no `VAR=x cmd` prefixes (use `scripts/*.mjs` or `process.env` in Playwright config), no single-quoted arguments, no shell globs (use `fs.glob` in Node 22+ or the tool's own glob), no `rm`, `cp`, `&` background, `$(...)`. `trace.mjs` normalises path separators to `/` in its output so the table is identical on all three OSes.

### F-25 (Low) Dev DB next to OneDrive or network paths
WAL needs a local file system and shared memory. Add a one-line README warning (the repo is under `C:\Projects`, fine) and have `db.ts` fail loudly if `journal_mode=WAL` is not returned.

### F-26 (Low) Process-visible items the spine could cheaply support
ORK-04/05/09: the verify result JSON (F-15/F-16) feeds "test result"; `merge-gate` and `check-ownership` print branch, owner slice and head SHA, which the board can display. ORK-02 (S03 not before S01/S02 accepted) is orchestrator logic (OQ-2); the repo side is `s01-accepted`/`s02-accepted` tags created by Jo's acceptance, which `check-ownership` for S03 can require. Optional.

### F-27 (Low) Stack versions are unverified from here
Many versions in the Stack table (React 19.3.1, Vite 8.3.4, TS 6.0.3, better-sqlite3 13.0.3, Vitest 5.0.5, ESLint 10 with jsx-a11y peers, react-router 8.4.0) cannot be confirmed by this reviewer. S00 first task: `npm view` each, install, run `verify` on an empty skeleton on Windows, and commit the lockfile before any slice starts; the known ESLint 10 versus jsx-a11y and `@types/better-sqlite3` items are already in Deferred.

---

## Direct answers to the six questions

1. **S01 ∥ S02:** Not yet conflict-free. Source folders are cleanly disjoint (auth vs resources, features/auth vs features/resources, separate migration ranges, route stubs per owner), but F-01 (nb.ts, keys, invalidation, test helpers, lockfile, seed, messages) and F-03 (S02 cannot authenticate without S01 behaviour) break it. With the F-01, F-03, F-04, F-05 fixes it is conflict-free.
2. **S04/S05/S06 after S03:** Not yet. Problem files: bookings repository/routes/presenter/index (S05 vs S06, F-02), the detail host versus slot and the import rule (F-13), invalidation and badge source (F-14), ui/ growth and chart (F-08), contracts amendments (F-09), schedule endpoint ownership (S03 by assumption, F-12). The schedule endpoint being in S03 does remove the biggest S04 vs S03 dependency.
3. **PIL-01/08/10/11/12, ORK-06/10:** PIL-10 and PIL-11 are well covered. PIL-01/08 are only half-covered (titles without results/SHA/story, F-15). PIL-12/ORK-10 lack a defined merge candidate and shared integration set (F-07). ORK-06 mostly works via verify exit codes but needs F-16 hardening.
4. **Scope changes needing Jo:** yes, five (F-12): S00 growth, schedule endpoint to S03, S00 session read and future-booking function, Node 24 pin, `booking-actions` feature split.
5. **Windows pitfalls:** F-10 (scrypt maxmem, cross-platform bug) and F-11 (CRLF, npm.cmd spawn EINVAL, SQLite/WAL file locking and demo:reset, relative DB path vs workspace cwd, better-sqlite3 prebuild on Node 25, worktree port and path collisions), F-24.
6. **S00 list:** breadth is right, but it is oversized for one pass and misses about ten enabling items (F-21); freeze in two steps (F-09) and cut S00 at a contract checkpoint (F-19).
