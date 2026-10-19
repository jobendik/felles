# Validation 3A (process structure, delta) of epics.md (7 epics, 76 stories + Gate S00-CP)

Validator: fresh, read-only (this file is the only write). Document: `_bmad-output/planning-artifacts/epics.md` (2,473 lines, status: draft). Authority: ARCHITECTURE-SPINE.md (AD-1, 2, 3, 9, 18-22, 26, 27, Conventions Git row, Structural Seed), AMENDMENT-1/2/3, PRD 4/7/8, step-04 rules. Line numbers are lines of epics.md unless "spine" is stated. Scope: process structure and the integration model only. Part 1 was written before reading the previous report; Part 2 compares afterwards.

Verdict: the slice-as-integration-unit model, the S00 build mode, the gate prerequisites, the CI phasing and the S07 release mechanics are now present and consistent with Amendments 1-3. No blocker found. Four high findings remain: the Index "Owns" column cannot yet generate a complete `ownership.json` (prose cells, unowned files, split-module tests); the `BookingsReadPort` bodies cannot be replaced by S06 without editing an S00 file; the `--release` manual-evidence rule fails on main-only commits; and S00 seam tests that assert stub behaviour will break when slices replace stubs.

| Tier | Count |
| --- | --- |
| Blocker | 0 |
| High | 4 |
| Medium | 8 |
| Low | 11 |

---

## PART 1 - FRESH LOOK

### 1.1 Life of the key commits (command, verification set, can it pass)

| Step | Command | Verification set | Passes? |
| --- | --- | --- | --- |
| Precondition | Jo approves PRD/arch/epics, installs Node 24, instructs ff `planning/felles` -> `main`; push approval recorded once (l.312) | none | Prose, but assigned and recorded; fine |
| Story 1.1 on `slice/s00` | `git switch -c slice/s00`, `npm ci`, `npm run setup:native`, `npm run verify` (AC l.326-329) | `verify` only: typecheck, lint (+ custom-rule fixtures `[NFR-02]`), tests, build. No trace, no ownership check (no `ownership.json`) | Yes in substance. Wording defect: `npm ci` needs a lockfile that 1.1 itself creates (L1). Lockfile and root `package.json` are in no Owns cell (H1) |
| 1.2-1.7 (T00-02) | `npm run verify` + story tests | `verify` | Yes. `temp-db` now in 1.5 (closed). `temp-db` does not say it runs migrations; the runner arrives in 1.6 (L3) |
| Gate S00-CP | Jo reviews `contracts-summary.md` (1.4 script), schema snapshot/hash (1.7), copy, open questions | none; PIL-09 outside trace | Yes as a human act. Bootstrap hole: the scripts that record it (`ledger.mjs gate`, PL ids, `blocked` view) are Story 1.23, after the gate (M3) |
| 1.8-1.18 | `npm run verify` | `verify` | Yes. No forward edge on `temp-db`, `buildApp`, session (1.8 uses an inline cookie stub), web test helper (1.13), Playwright (1.18 before 1.26) |
| 1.19-1.25 (tooling) | `npm run verify`, fixture tests; `verify:full` now exists (1.20 AC2) | `verify:full` default set on `slice/s00` prints `INCOMPLETE` and exits 0 (1.20 AC2) | Yes. Ledger entries for 1.1-1.22 can only be back-filled after 1.23 (M2, M3) |
| 1.22 onward | `check-ownership` with S00 build mode (AC3) | n/a | Passes for stubs and frozen self-edits (B1 of the previous round is closed). It is not wired into `npm run verify` by any story (M1) |
| 1.29 | CI `verify:full` on 3 OS with `FELLES_SLICE=S00` derived by `--print-slice` | set = {S00} | Yes; first CI run of the whole project is here (M4) |
| 1.30 dry run | scratch clone, `slice/s99`: `check-ownership`, `verify:full --slice S99`, `merge-gate.mjs` | set = {S99} | Yes, including the "stub for another slice passes under S00 mode / refused after `s00-accepted`" cases (AC1) |
| 1.30 first real gate | `node scripts/merge-gate.mjs slice/s00` | candidate = merge of tip into main; `verify:full` with `FELLES_SLICE=S00`; ownership (stubs ignored, S00 owns frozen paths); integration set (route enumeration, schema snapshot, tokens, round-trips, sample Playwright spec); prerequisites none; all 1.1-1.30 need `implemented/tested/reviewed` | Passes. S00 creating stubs for S01-S06 is covered by 1.22 AC3 + 1.24 AC3 fixtures. Caveat: Story 1.30 itself needs a `reviewed` entry before the landing it describes; the landing ACs are slice acts that follow the review (L8) |
| Jo accepts S00 | `node scripts/accept-slice.mjs S00` on clean main | fresh `verify:full`, `FELLES_SLICE=S00`; tag last | Yes (1.25, 1.30 AC3) |
| S01 first story (2.1) / S02 first (3.1), parallel | `FELLES_SLICE=S01\|S02 npm run verify`; own ports (AD-24) | no trace in `verify`; ownership | Yes, provided `ownership.json` is complete (H1). Branch cut from main at `s00-accepted` carries ledger+tags |
| S01 last (2.6) / S02 last (3.7) | `ledger.mjs story ...` x3 per story on main, then `merge-gate.mjs slice/s0N`, then `accept-slice.mjs S0N` | set = ledger {S00} + S0N (+ the other if already integrated); prerequisite `s00-accepted` | Yes. Independent of each other (2.3 AC3 and 2.6 AC1 repaired). Either order; second rebuilt on new main by merge, slice SHAs preserved |
| S03 first (4.1) | `FELLES_SLICE=S03 npm run verify` | -- | Yes. `resources/index.ts` read port exists (1.11 stub, 3.1 body) |
| S03 acceptance with F2 | gate (needs `s01-accepted`, `s02-accepted`), F2 package to Jo, `accept-slice.mjs S03` | set = {S00,S01,S02,S03} | Yes (4.5). `schedule.ts`, `activity.ts`, `dashboard.ts` owned by S03 until `s03-accepted` (1.22 AC2). Residual: Owns cell gaps (H1, L5) |
| S04 / S05 / S06 parallel | each: `FELLES_SLICE=S0N npm run verify`, ... gate, accept | sets grow by whichever parallel slice landed first | Build-independent. Test coupling remains in three places: S03 test helper wording (M6), `BookingsReadPort` bodies (H2), S00 stub-asserting tests (H4) |
| S07 release | gate with `FELLES_SLICE=S07`, `FELLES_FORBID_501=1`; `s07-integrated` tag triggers `release.yml` -> `verify:release`; `accept-slice.mjs S07` -> `verify:release` | gate: default set; release: every MUST part, ledger ignored | Fails as written at the NFR-01 manual-evidence diff rule (H3). The other A3-4 repairs are present (smoke step cited, `release.yml`, `FORBID_501`, tag last) |

### 1.2 Dependency graph re-derived

Declared (Index): acyclic. Every edge goes to a lower-numbered story, the Gate, or a `sNN accepted` gate. Gate S00-CP is reached by 1.8, 1.13, 1.19, 1.22 and thus transitively by all later S00 stories. S01/S02 name only "S00 accepted"; S03 "S01 and S02 accepted"; S04/S05/S06 only "S03 accepted" (4.14 adds a subsumed "S02 accepted"); S07 "S04, S05 and S06 accepted". Within slices 4.12 and 4.13 now name 4.11 (previous M fixed).

From AC text, edges not declared in the Index:

| Edge | Evidence | Effect |
| --- | --- | --- |
| 1.5 (`temp-db`) -> 1.6 (runner) | AD-19 "invoked ... by `temp-db`"; 1.5 AC4 (l.459-462) has no migration step; 1.6 AC2 races processes "on the same fresh database" | `temp-db` must gain `migrate` in 1.6 (L3) |
| 1.26 -> 1.27 | 1.26 AC2/AC4 (l.1036, 1046) "nothing scrolls horizontally ... Playwright harness at 375 and 1440"; the routed app (router, pages, `main.tsx` mount) is 1.27 | forward edge for the Playwright half of UI-2@S00 (M5) |
| 1.14 -> unowned | 1.14 AC3 (l.740) "offline load is exercised by the first page-level Playwright test"; 1.18 has no such assertion | orphan assertion (L2) |
| 1.8 -> 1.10 (only `GET /api/session`) | 1.8 AC2 (l.551) "`GET /api/session` ... S00 handlers"; handler is the session plugin of 1.10 | route must be a placeholder until 1.10 (L3) |
| 1.20 -> 1.22 | AD-27 `verify` includes "ownership check when a slice is set"; no story wires it | M1 |
| 4.8, 4.9, 4.10, 6.1, 6.2 -> S03 helper | l.1679, 1697, 1730, 2025, 2036 "through the S03 test helper"; 1.12 AC3 (l.668-671) defines S00 `booking-fixtures.ts` | contradictory (M6) |
| S06 -> `bookings/index.ts` | 1.11 AC3 (l.647) port "with stub bodies" in `bookings/index.ts`; 6.1 Owns only `bookings-read.repository.ts` | H2 |
| 7.7 / 7.8 -> main-only files | 1.21 AC2 diff rule vs ledger/pilot-log commits | H3 |

No cycle found. No S01 -> S02/S03+ edge and no S04/S05/S06 cross-edge in the AC text.

### 1.3 Ownership, seams and leftovers checked (explicitly requested)

* Two owners of one path: none across slices. Same-slice duplicates only (`transitions.routes.ts` in 5.1/5.2; `features/bookings/index.tsx` in 4.7/4.8/4.14; root `package.json` in 1.1/1.21; `manual-evidence/**` in 7.4-7.8). Time-based pairs (`README.md`, `manual-evidence/**`, F2 files) are encoded in 1.22 AC2.
* A story that must edit an S00 file: found for `bookings/index.ts` (S06 port bodies, H2), the contracts round-trip test for the F2 DTOs (4.5 "round-trip tests are updated" but the test is 1.4's, frozen S00; H1), and any S00 test asserting a stub body (H4). Not found for barrels (`nb.ts`, `api/keys/index`, `api/invalidation/*` frozen; every `i18n/nb/<f>.ts` and `api/keys/<m>.ts` is in exactly one slice's Owns).
* Seam entry files: assigned (1.27 AC2; 4.7/4.8/4.14 and 5.4 Owns). Page entry file of `/kalender` is in no Owns glob (H1).
* Helpers: `mintSession` (1.10), `temp-db` (1.5), `booking-fixtures.ts` (1.12) are S00; `helpers/s01,s02,s03,s05,s06` assigned. `helpers/s04` is not needed.
* e2e support: 1.18 AC4 creates `e2e/<slice>.spec.ts` placeholders for S01-S07, but the real spec names in the Index are `auth`, `resources`, `bookings`, `approvals`, `overview`, `sweep`, `lifecycle`, `admin-and-overview`, `accessibility` (M7).
* Contracts F1/F2: `schedule.ts` is its own file (4.4), `activity.ts`/`dashboard.ts` S03 until `s03-accepted` (4.5, 1.22 AC2). Row 1.4 does not list `schedule.ts` and does not mark the three drafts `(stub)` (L5).
* README / manual-evidence: S00 until `s00-accepted`, S07 afterwards (preface l.2292, 1.22 AC2). Consistent.
* Leftovers of old numbering or the old one-story-one-branch model: none found. "1.4-CP" appears only as the declared alias (l.314). "Story 1.1-1.29 pre-gate" and 1.19-1.25 as delivery controls match the numbering. The 76-story count matches (30+6+7+15+5+5+8). Stale text that remains: Index 1.26 Owns "web Vitest helper" (now 1.13), Index 7.1 Owns "route-enumeration switch" (the switch is in 1.8's frozen test), 1.22 AC2 "schedule DTO exports" (now a file) (L4, L5). "S03 test helper" x5 (M6).
* Contradictions with the spine or amendments: `bookings.repository.ts` "full signature set with S03/S05/S06 tags" (1.11 AC3) versus spine AD-20 where S05 and S06 have their own files (H2). Everything else checked (gate prerequisites, merge-commit candidate, `Freeze-Approved` as PL id, `Slice-Ready`, SHOULD parts, `release.yml`, `FORBID_501`, tag last, S99 dry run, state vocabulary) matches.

---

## FINDINGS

### High

#### H1. The Index "Owns" column cannot generate a complete, conflict-free `ownership.json`

Where: Index preface l.2292 ("*Owns* cells are path globs only ... the source from which `ownership.json` is generated"); rows 1.1, 1.6, 1.7, Gate, 1.20, 1.21, 1.23, 1.26, 1.28, 1.30, 2.3, 2.5, 4.2, 4.5, 5.5, 7.1, 7.5, 7.8 (l.2318-2394); 1.22 AC1 test "every path under apps/, packages/, e2e/ and scripts/ is owned exactly once" and AC3 "colocated test files ... each have exactly one owner" (l.927, 937); 4.10-4.13 Owns (l.2371-2374).

Evidence:
1. Many cells are prose, not globs: "root configs", "snapshot harness under `apps/api/test/`", "probe suite", "reporter configuration", "S01 API tests", "concurrency suites", "S03 tests", "S05 API tests", "measurement script", "evidence pack document", "freeze package document", "offline alert", "web Vitest helper".
2. Colocated tests of split modules have no possible single owner: `modules/bookings/**` is written by S00 (1.11 tests), S03, S05, S06; `modules/auth/**` by S00 (policy tests) and S01; `modules/activity/**` by S00 and S06. 1.22 AC3 asks for one owner per `modules/<m>/**/*.test.ts`.
3. The `/kalender` page entry file is in no glob: 4.10-4.13 own only `calendar/{grid,interactions,keyboard,mobile}/**`, and S00 must create a stub page that route `/kalender` imports (1.27 AC1).
4. 4.5 AC3 "round-trip tests are updated" for `activity`, `dashboard`, `schedule`, but the round-trip test is Story 1.4's single test (S00, frozen); S03 can edit it only if the test files are split per contract file and owned by S03.
5. Root files (`package-lock.json`, root `package.json`, `.github/workflows/release.yml`, `contracts-summary.md`) are covered by no cell and by neither the exactly-once test nor the frozen list wording.

Why it matters: the first S0N branch fails `check-ownership` on files the story must create, or the S00 agent invents ownership rules that Jo never approved. The previous M5 asked for exactly this and is only partly done.

Minimal fix text:
- Index preface: replace "*Owns* cells are path globs only" with "Owns cells list path globs; test files follow the rule below; a file matched by no glob is a check failure, and the S00 agent adds root files to the frozen list explicitly."
- Add rule: "Test files are named by owner: API tests `apps/api/test/<slice>/**` (and helpers `apps/api/test/helpers/<slice>.ts`), colocated tests `<name>.<slice>.test.ts` (for example `approve-booking.s05.test.ts`) inside split modules (`modules/bookings`, `modules/auth`, `modules/activity`); in unsplit modules and in features, `*.test.ts(x)` follows its source file. Contracts round-trip tests are one file per contract file: `packages/contracts/src/{schedule,activity,dashboard}.test.ts` are S03 until `s03-accepted`."
- 4.10 Owns add `apps/web/src/features/bookings/calendar/CalendarPage.tsx` (S00 stub, `createdBy: S00`); 1.27 AC1 names the stub page file for every route.
- Replace prose cells by globs (2.3/2.5 -> `apps/api/test/s01/**`, 4.2/4.5 -> `apps/api/test/s03/**`, 5.5 -> `apps/api/test/s05/**`, 7.5 -> `scripts/measure-latency.mjs` owned by S07, 7.8 evidence pack -> `manual-evidence/evidence-pack.md`).

#### H2. S06 cannot replace the `BookingsReadPort` stub bodies without editing S00 files; `bookings.repository.ts` signature tags contradict the spine

Where: 1.11 AC3 (l.647): "`bookings/index.ts` exports ... the typed `BookingsReadPort` enumerating `listUpcomingForUser`, ... `chartBuckets` with stub bodies ... and `bookings.repository.ts` holds the full signature set with S03/S05/S06 tags"; 1.11 Owns (l.2329) lists `bookings/index.ts` without `(stub)`; 6.1 Owns (l.2382) `modules/dashboard/**`, `modules/bookings/bookings-read.repository.ts`; spine AD-20: `bookings.repository.ts` (S00 signatures, S03 implements), `booking-transitions.repository.ts` (S05), `bookings-read.repository.ts` behind the port (S06).

Why it matters: after `s00-accepted`, `bookings/index.ts` is S00-owned and frozen. The port bodies sit in it, so S06 (and a Fixes-less S05 for transitions signatures tagged in `bookings.repository.ts`, S03-owned) must edit a file they do not own, or the stub stays the live implementation and the Administrator dashboard returns stub values while S06's own file is unused. The previous H6 enumerated the methods but not where the bodies live.

Minimal fix text:
- 1.11 AC3: "`bookings/index.ts` re-exports `bookingsReadPort` from `bookings-read.repository.ts` and `presentBooking`/`presentBlock` from `bookings.presenter.ts`; S00 creates `bookings-read.repository.ts` with the five stub bodies (`createdBy: S00`, owner S06). `bookings.repository.ts` holds only the S03 signature set and `countFutureBlocking`; the S05 transition functions are declared in `booking-transitions.repository.ts` (S00 stub, owner S05)."
- 1.11 Owns: mark `(stub)` on `bookings.repository.ts`, `bookings.presenter.ts`, `bookings-read.repository.ts`, `booking-transitions.repository.ts`; `bookings/index.ts` stays S00 and is never edited by a slice.

#### H3. `--release` evidence rule fails on main-only commits, so S07 cannot pass `release.yml` or `accept-slice.mjs S07`

Where: 1.21 AC2 (l.908) "`--release` accepts a commit whose only changes against the cited commit are under `manual-evidence/**`"; 7.7 AC1 (l.2255) cited commit is on the slice branch; 1.24 AC1 (candidate = merge of the slice tip into main); 1.23/1.24 write ledger entries, `acceptance-ledger.json`, sprint-status and `pilot-log.md` on main during S07; 7.8 AC4 (l.2287) release workflow on `s07-integrated`.

Why it matters: the landed S07 commit is a merge of the slice tip into a main that has received every S07 ledger entry, pilot-log entry and sprint-status change since the branch point. The tree differs from the cited slice commit in main-only paths, so the NFR-01 (and UI-3, NFR-05, NFR-06) manual-evidence parts are rejected at `release.yml` and at Jo's `accept-slice.mjs S07` (which runs on the main tip after the follow-up ledger commit). This is the last gate of the pilot and cannot pass as written.

Minimal fix text: 1.21 AC2 replace the clause with "`--release` accepts a commit whose changes against the cited commit are only under `manual-evidence/**` or under the main-only paths of Story 1.22 (`_bmad-output/implementation-artifacts/**`, `pilot-log.md`, `acceptance-ledger.json`), and it never evaluates the cited commit against the follow-up ledger commit."

#### H4. S00 seam tests that assert stub behaviour will fail when a slice replaces the stub, and the slice may not edit them

Where: 1.27 AC1 (l.1056-1059) "all nine Norwegian routes render stub pages ... titles, `h1`, focus"; 1.13 AC2 (l.698) "`usePendingCount()` exists as a stub returning `null`"; 1.11 AC3 stub bodies of `BookingsReadPort` and `resources/index.ts`; 4.9 AC3 (l.1709) "the S04 test uses the slot stub"; 1.26 AC4 pill with `usePendingCount`. Only 1.8 AC3 states "never asserts 501 as correct behaviour".

Why it matters: S00 tests are frozen S00 files and run in every candidate (`verify` runs all tests). The first time S02 replaces the Ressurser stub (a page that fetches data), an S00 route-table test that renders the real lazy page without data mocks fails, and so on for S06 (`usePendingCount`), S04/S05 (slot stubs). The slice agent either edits a frozen test (needs Jo, `Freeze-Approved`) or the gate refuses. Same risk for S04's own test that asserts a missing "Avbestill" once S05 lands.

Minimal fix text: add to Epic 1 intro or 1.27: "S00 tests of seams assert the contract (route table entries, `titleKey`, props and signatures, access rules, focus and title behaviour against a stub page injected by the test) and never the body of a stub; a slice-owned test must not assert the absence of a feature that another slice supplies." Add to 1.27 AC1: "the route test renders each route with an injected test page component, not the lazy production page."

### Medium

#### M1. The ownership check is not wired into `npm run verify`; the slice and the diff base are undefined locally

Where: AD-27 (`verify` includes "ownership check when a slice is set"); DoD l.2314 "`npm run verify` green on the slice branch; ownership check passes"; 1.22 (l.916-946) defines the script, `--print-slice`, rules, but no wiring or base; 1.29 AC2 derives the slice only in CI.
Fix: 1.22 AC1 add "`npm run verify` runs `check-ownership` against the merge-base with `main` when `FELLES_SLICE` is set or the branch is `slice/sNN` (slice = the branch name, which must equal `--print-slice`); an empty change set passes; a path matched by no glob fails."

#### M2. Ledger staleness is defined but not enforced, and shared files make it fire constantly

Where: 1.23 AC3 (l.969) "marks an entry stale when a later commit changed a path in that story's Owns cell"; spine AD-20 validity sentence; 1.24 AC1 does not say whether a stale entry counts as missing; the State model (l.2302) does not state the rule. Shared cells: 1.1 (root configs, `eslint.config.js`, workspace `package.json`) are edited by 1.4, 1.12, 1.14, 1.20, 1.21 and 1.29; 3.1's `routes.ts` by 3.2/3.3; 4.1's `routes.ts`/`bookings.repository.ts` by 4.2-4.4; 2.1's use case by 2.2.
Why: either the gate ignores staleness (the ledger proves nothing about the final tree) or it refuses almost every slice until the whole slice is re-reviewed at the tip. Entries for 1.1-1.22 can only be recorded after 1.23 exists, so they are back-filled anyway.
Fix: State model and 1.24 AC1 add "a stale entry counts as missing; the orchestrator re-records `tested` and `reviewed` at the slice tip, and a ledger entry may cite the final commit of the story's last change in its Owns cell". 1.23 AC1 add "back-filling entries for stories whose commits predate the script is allowed on main."

#### M3. Gate S00-CP bootstrap: the recording tools arrive after the gate

Where: Gate AC2/AC4 (l.522-534) record Jo's decision in `pilot-log.md` and set `gate-s00-cp` "by the orchestrator"; `ledger.mjs gate`, the PL id generator and the `blocked` view are 1.23 (l.960-969). `Freeze-Approved` commits in 1.8-1.22 (contracts after the Gate) need a PL id that exists on main (1.22 AC4). `blocked` is not a native BMad state (PIL-02 forbids custom states); 1.23 says "reads as `blocked`", the Gate says "stays `blocked`". The Gate row is not a story but sits in the Index with slice S00; if `gen-requirements` maps it as a story, the gate would demand ledger entries for it.
Fix: Gate AC2: "until Story 1.23 exists the entry is written by hand in the same format (`PL-<date>-<n>`) and `ledger.mjs gate` back-fills the key"; 1.23 AC2: "`blocked` is a computed display of `ready-for-dev` plus an open gate, never a stored state"; 1.19 AC1: "the Gate row is excluded from the story-to-slice map and from the all-stories-done check".

#### M4. CI first exists at Story 1.29

Where: 1.29 AC2 creates `ci.yml`; AD-27 "prevents a Windows-only pass"; PIL-11 parity; the remote exists (l.312). Stories 1.1-1.28 (28 stories, most of the code) are verified on Windows only; the first Linux/macOS run happens at the end of S00 where failures are most expensive.
Fix: Move a minimal `ci.yml` (`npm ci`, `setup:native`, `verify` on the three systems, non-blocking) into Story 1.1 or 1.6; 1.29 keeps the full matrix, `fetch-tags`, `release.yml` and the smoke job.

#### M5. 1.26 depends on 1.27 for its Playwright criteria; 1.14 has an orphan browser assertion

Where: 1.26 AC2 and AC4 (l.1036, 1046) viewport and horizontal-scroll checks "with the Playwright harness at 375 and 1440 px"; the routed app is 1.27 (Index 1.27 depends on 1.26). 1.14 AC3 (l.740) "the browser-level offline load is exercised by the first page-level Playwright test" (1.18 has no such assertion).
Fix: move the Playwright halves of `[UI-2]` to Story 1.27 (add the AC there), and in 1.18 AC1 add "the sample spec loads the production build with the network blocked to external hosts and asserts no remote font request" or delete the 1.14 sentence.

#### M6. "S03 test helper" survives in five stories and contradicts the S00 fixture helper

Where: 4.8 AC2 (l.1679), 4.9 AC1 (l.1697), 4.10 AC2 (l.1730), 6.1 AC3 (l.2025), 6.2 AC1 (l.2036) versus 1.12 AC3 (l.668-671) `apps/api/test/booking-fixtures.ts` (S00, "slices import the helper and do not edit it") and 4.2 Owns `helpers/s03.ts` ("concurrency suites").
Why: an S04/S06 agent looks for `helpers/s03.ts`, finds no insertion capability, and either extends an accepted S03 file or invents its own.
Fix: replace each phrase with "the S00 `insertBooking` fixture helper"; 4.2 Owns "`apps/api/test/helpers/s03.ts` (concurrency only)".

#### M7. e2e placeholder names (1.18) do not match the real spec and support names; S03 has no support file

Where: 1.18 AC4 (l.839-841) `e2e/support/<slice>.ts`, `e2e/<slice>.spec.ts` for every slice S01-S07; Index Owns: `e2e/auth.spec.ts`, `resources.spec.ts`, `bookings.spec.ts`, `approvals.spec.ts`, `overview.spec.ts`, `sweep.spec.ts`, `lifecycle.spec.ts`, `admin-and-overview.spec.ts`, `accessibility.spec.ts`; `e2e/support/s01,s02,s04,s05,s06,s07` only (4.5 uses `app.inject` or the `request` fixture).
Fix: 1.18 AC4 "creates only `e2e/support/<slice>.ts` (S01, S02, S04, S05, S06, S07) and no spec placeholders; each slice creates the spec files named in its Owns cell; S03 evidence uses `apps/api/test/s03/**`".

#### M8. S07 landing details: Owns on main-only paths, NFR-01 file before the branch, smoke mode selection

Where: 7.8 Owns (l.2394) "`pilot-log.md` entry" and "evidence pack document" (path unspecified) versus 1.22 AC2 (`pilot-log.md` main-only; slice branches never edit it); 7.7 AC2 (l.2259) OQ-5 decision "recorded ... as the first lines of `manual-evidence/NFR-01.md` before `slice/s07` is branched" (the file is S07-owned and cannot be committed on main by the slice); 1.29 AC2/AC3 give `smoke.mjs --require-full` no rule for when CI uses it ("the S07 job" is undefined); `release.yml` has no stated runner OS and is not in the Index Owns of 1.29.
Fix: 7.8 Owns: "`manual-evidence/evidence-pack.md`; the pilot-log entry is written on main by `ledger.mjs`". 7.7 AC2: "recorded in `pilot-log.md` before `slice/s07` is branched and copied as the first commit of `slice/s07` into `manual-evidence/NFR-01.md`". 1.29 AC2: "the macOS job runs `smoke.mjs --require-full` when the derived slice is S07 or the ref is `main` after `s06-accepted`; `release.yml` runs on `ubuntu-latest` and macOS".

### Low

* L1. 1.1 AC1 (l.326-327) runs `npm ci` before any lockfile exists. Say "`npm install` once to create the lockfile, then `npm ci`" and put the lockfile in the frozen list.
* L2. 1.14 AC3 offline assertion has no owner (see M5).
* L3. `temp-db` migration step and the placeholder `GET /api/session` handler before 1.10: add "`temp-db` applies the migrations once 1.6 exists (1.6 edits `temp-db.ts`)" to 1.6 AC and "until 1.10 `GET /api/session` is a placeholder returning `{ user: null }`" to 1.8 AC2.
* L4. Leftover Owns text: Index 1.26 "web Vitest helper" (built in 1.13 AC6); Index 7.1 "route-enumeration switch" (the switch is in 1.8's frozen test); remove both.
* L5. `(stub)` marks and file list: row 1.4 omits `schedule.ts` and does not mark `activity.ts`, `dashboard.ts`, `schedule.ts` as `(stub)`; row 1.11 does not mark `bookings.repository.ts`, `bookings.presenter.ts`; row 1.19 marks `acceptance-ledger.json (stub)` although it is frozen, not created for another slice; 1.22 AC2 says "the schedule DTO exports" (now `schedule.ts`). The generator for `createdBy: S00` cannot distinguish them.
* L6. 1.12 AC5 "Given the per-slice fixture index ... does not edit the seed" is unclear against the spine's "per-slice fixture files behind an S00-owned index"; say "the seed has no per-slice fixtures; slices build scenario data with `insertBooking` in their own helpers".
* L7. 2.6 AC2 expiry variant "a mutation is attempted": in an S01-only app the only mutation is "Logg ut"; say so.
* L8. Test titles in ACs lack the story tag: 1.1 `[NFR-02] verify gate rejects a violation`, 1.21 AC3 names `[SEED-1]`, `[RUN-1]`, `[UI-2]` without `(@N.M)`; DoD requires it. Also Stories whose last AC is a slice landing (1.30, 2.6, 3.7, 4.5, 4.15, 5.5, 6.5, 7.8) should say "performed after the story's `reviewed` entry; the story is `done` only through acceptance".
* L9. SEED-2 is "optional" in the PRD; 1.19 knows only `MUST` and `SHOULD` for `level`; state "optional parts are SHOULD".
* L10. F2 risk: S02 uses `resource.*` event schemas from `contracts/activity.ts`, which S03 may still change until `s03-accepted` although S02 is already accepted; add "the S00 draft of `activity.ts` already holds all seven event types; S03 may only add".
* L11. "Merge-gate candidate" in 1.20 AC2 has no detection mechanism (env var or flag); define `FELLES_GATE=1` set by `merge-gate.mjs`, and the gate JSON's storage location (1.24 AC1 "emits JSON bound to the tree hash").

---

## PART 2 - CLOSURE of the previous round (epics-validation-2a-process.md)

### Blocker and high findings

| ID | Status | Evidence |
| --- | --- | --- |
| B1 ownership has no S00 build mode | CLOSED | Preface l.2292 "a path an S00 row creates for another slice is a `(stub)` recorded as `createdBy: S00` and owned by the later slice after `s00-accepted`"; 1.22 AC3 (l.936) "slice S00 may create and edit them and every frozen path until `s00-accepted` ... `--print-slice` ignores `createdBy: S00` stubs on `slice/s00`"; 1.22 AC4 "a `Fixes: N.M` commit on `slice/s07` counts as slice S07"; 1.24 AC3 and 1.30 AC1 fixtures. Residual marker/file gaps are H1/L5 |
| H1 no landing/acceptance act per slice | CLOSED | Last-story ACs: 2.6 (l.1292-1295), 3.7 (l.1471-1474), 4.5 (l.1610-1613), 4.15 (l.1848-1851), 5.5 (l.1995-1998), 6.5 (l.2122-2125), 7.8 (l.2285-2288), each "orchestrator runs `merge-gate.mjs slice/sNN` and Jo then runs `accept-slice.mjs`" with tags, ledger, `done`, pilot-log entry |
| H2 gate does not check prerequisites or review | CLOSED | 1.24 AC1 (l.985) "refuses a candidate whose prerequisite slices (`dependsOn`) lack an `sNN-accepted` tag or any story of which lacks `implemented`, `tested` and `reviewed` ledger entries citing commits reachable from the candidate tip"; fixtures AC3 (l.996). Staleness semantics left open (M2) |
| H3 S00 forward dependencies | CLOSED | `temp-db` in 1.5 Owns (l.2322); 1.8 AC3 "a cookie stub built inline" + 1.10 AC3 real-session variant; 1.3 AC2 "exercised through the `Clock` type"; web test helper 1.13 AC6; Playwright 1.18 before 1.26; `verify:full` defined 1.20 AC2; "E2E smoke" defined 1.24 AC1. New smaller residuals M5, L2, L3 |
| H4 S01 depends on later slices | CLOSED | 2.3 AC3 (l.1211-1214) limited to `policy.can` table, "foreign-booking 403 ... evidenced in S03, S05 and S07"; 2.6 AC1 "reaches Hjem (its `h1` and document title)" |
| H5 cross-slice fixture helper has no owner or AC | PARTIAL | S00 helper defined: 1.12 AC3 `booking-fixtures.ts`; `helpers/s02.ts`, `e2e/support/s02.ts` in 3.7 Owns. But five stories still say "through the S03 test helper" (M6) and `e2e/support` naming is inconsistent (M7) |
| H6 seam ports under-specified | PARTIAL | 1.11 AC3 enumerates `getResource`, `listSummaries`, the five `BookingsReadPort` methods; 1.10 AC3 gives `sessions.repository` `insert/deleteByHash/purgeExpired` and `session.service` `issue/revoke`. Still open: where the port bodies live and who owns the files S06/S05 must fill (H2) |
| H7 CI on slice branches red by design | CLOSED | 1.20 AC2 (l.882) `INCOMPLETE <slice> <missing parts>` exits 0 until `Slice-Ready: SNN` or the gate candidate; 1.29 AC2 (l.1105) `verify` + Playwright blocking, trace advisory. Detection mechanism is L11 |
| H8 S07 NFR-01 circular, `verify:release` trigger undefined | CLOSED | 7.7 AC1 cites "the macOS `smoke.mjs --require-full` step of the CI run on the parent commit, which runs independently of the trace step"; 1.29 AC2 `release.yml` on `s07-integrated`; 1.25 AC2 `accept-slice` S07 runs `verify:release`, tag last; 1.21 AC1 and 1.24 AC1 set `FELLES_FORBID_501=1`. A new defect in the evidence rule is H3 |

Count: B1 + H1-H8 = 9 items: 7 CLOSED, 2 PARTIAL (H5, H6), 0 OPEN.

### Medium findings M1-M13 (process-related)

| ID | Status | Evidence |
| --- | --- | --- |
| M1 S07 slice derivation / 501 switch setter | CLOSED | 1.22 AC4; 1.21 AC1 and 1.24 AC1 set `FELLES_FORBID_501=1` for S07 and `verify:release`. Leftover Owns text L4 |
| M2 Gate S00-CP has no state | CLOSED | Gate AC4 (l.534) key `gate-s00-cp`, "PIL-09 is evidenced by the pilot-log entry, outside the trace check"; 1.23 AC2 `ledger.mjs gate S00-CP done --approval`. Bootstrap order is new M3 |
| M3 landed SHA vs ledger SHA | PARTIAL | Merge-commit candidate stated (1.24 AC1 "throwaway merge commit ... slice commits keep their SHAs") and `ledger show` stale marker (1.23 AC3); the State model and the gate do not say what staleness means (M2 above) |
| M4 non-atomic acceptance | CLOSED | 1.25 AC2 (l.1014) "the tag is created last so a failed run leaves none"; S07 runs `verify:release` |
| M5 Owns not machine-readable | PARTIAL | 1.1 now names `main.tsx`, `vite.config.ts`; 1.8 `server.ts`; 1.22 AC3 names the colocated-test rule. Prose cells, split-module tests and the calendar page remain (H1) |
| M6 who renders "Book igjen" / "Avbestill" | CLOSED | 1.17 AC2 (l.809) slot owns "Avbestill" only; 4.8 AC3 (l.1686); 5.4 AC1 |
| M7 F2 and `bookings.ts` per-file ownership | PARTIAL | `schedule.ts` is its own file (1.4 AC4 l.430, 4.4 Owns, 1.22 AC2). Row 1.4 omits it and lacks `(stub)` marks (L5) |
| M8 seed content not pinned; startup refusal | CLOSED | 1.12 AC1 (l.660) names Ingrid, Magnus, Sofie, Jonas, Fjellet, Fjorden, "Gammel projektor", the Fjorden booking, three pending plus one Expired; 1.9 AC4 startup refusal; `server.ts` in 1.8 Owns |
| M9 `Freeze-Approved` unverifiable | CLOSED | 1.22 AC4 (l.941) "the value must be a pilot-log entry id (`PL-<date>-<n>`) that exists on `main`" |
| M10 OQ-5 record location | CLOSED | 7.7 AC2 names `pilot-log.md` and `manual-evidence/NFR-01.md` before `slice/s07` is branched (placement detail M8 above) |
| M11 i18n/keys file inventory | CLOSED | 1.13 AC4 (l.710-713) lists every `i18n/nb/*.ts` and `api/keys/*.ts`; `booking-actions.ts` in 5.4 Owns, `approvals.ts` in 5.3 Owns |
| M12 SHOULD parts block whole-slice landing | CLOSED | 1.19 AC2 `level`; 1.20 AC1 "SHOULD parts are reported as residual work without blocking"; 7.8 AC1 residual list |
| M13 OQ-2 orchestrator and push approval | CLOSED | Epic 1 preconditions l.312 (push approval recorded once; OQ-2 resolved by the Story 1.23 script); Story 1.23 `ledger.mjs` |

Count: 13 items: 10 CLOSED, 3 PARTIAL (M3, M5, M7), 0 OPEN.

Previous lows L1-L8 (not requested): numbering/aliases (L1, L3) and the amendment list (L2) are closed; L4 (08:30 horizon) is closed (4.5 AC1); L5 (lint direction `ui -> i18n`, `api/links`) is closed in 1.1 AC3; L6/L7/L8 are not process findings.
