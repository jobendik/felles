# Validation 2A (process structure) of epics.md (7 epics, 75 stories + Gate S00-CP)

Validator: fresh, read-only (this file is the only write). Document: `_bmad-output/planning-artifacts/epics.md` (status: draft, 2,307 lines). Authority: ARCHITECTURE-SPINE.md (AD-1, 9, 18-22, 26, 27, Structural Seed, Git row), AMENDMENT-1, AMENDMENT-2, PRD 4/7/8, step-04 rules. Line numbers are lines of epics.md unless "spine" is stated. Product content (coverage, ACs) was not the scope; only process structure.

Verdict: not ready for `final`. 1 blocker, 8 high, 13 medium, 8 low. The slice-as-integration-unit model (Amendment 2) is applied consistently in the Index, the state model and the tooling stories, and the earlier two blockers are closed. What remains is mostly the seam between the model and the file-ownership machinery (S00 cannot pass its own ownership check/gate as written), a few forward dependencies in S00 and S01, and human/gate acts that are assumed rather than assigned.

| Tier | Count |
| --- | --- |
| Blocker | 1 |
| High | 8 |
| Medium | 13 |
| Low | 8 |

---

## 1. Rebuilt dependency graph

### 1.1 Declared graph (Index, lines 2151-2228)

Acyclic; every declared edge points to a lower-numbered story, the Gate, or a slice-accepted gate. Gate S00-CP is a transitive prerequisite of every story from 1.8 on (1.8, 1.13, 1.19, 1.22 name it; all others reach it through those). S04, S05, S06 stories name only "S03 accepted" and same-slice stories (4.14 additionally "S02 accepted", which is subsumed). S01 (2.x) and S02 (3.x) name only "S00 accepted". Declared graph is clean.

### 1.2 Edges the AC text adds that the Index does not declare

| Edge | Evidence (quote) | Effect |
| --- | --- | --- |
| 1.3 -> 1.8 | 1.3 AC2 (l.390) "`buildApp({ clock })` can inject a fixed or steppable clock"; `buildApp` is Owned by 1.8 (l.2161) | AC not testable in 1.3 |
| 1.5, 1.6, 1.7 -> 1.8 (temp-db) | 1.6 AC2 (l.465) "three processes racing to migrate the same fresh database"; 1.7 probe suite; spine AD-19 "invoked ... by `temp-db`"; `temp-db` is Owned by 1.8 (l.2161), and 1.8 depends on the Gate which depends on 1.7 | forward edge that closes a loop through the Gate (H3) |
| 1.8 -> 1.10 | 1.8 AC3 (l.537) "walks the table with no session and with a Member session"; AC1 "access is checked first (401 ... 403)"; the actor and `mintSession` are 1.10 (l.2163) | forward edge (H3) |
| 1.14, 1.15, 1.17 -> 1.18 | 1.14 AC3 (l.696) "loads with the network disabled"; 1.15 AC3 (l.725) and 1.17 AC3 (l.773) "passes axe at 375 and 1440 px"; Playwright harness and axe helper are 1.18 (l.775-799); jsdom cannot set a viewport | forward edge (H3) |
| 1.15, 1.16, 1.17 -> 1.25 | 1.25 AC4 (l.949) "one helper provides the query client, router, session, clock and providers for every web test" | forward edge (H3) |
| 1.25 -> 1.18 | 1.25 AC2 (l.942) `[UI-2]` "nothing scrolls horizontally"; Index lists 1.13, 1.15, 1.16, 1.17 only | undeclared |
| 2.4/2.6 -> S06 | 2.6 AC1 (l.1185) "reaches Hjem with 'Hei, Ingrid'"; "Hei, {fornavn}" is Story 6.3 AC (l.1910) | S01 forward dependency (H4) |
| 2.3 -> S03/S05 | 2.3 AC3 (l.1116-1119) "a Member requests an action on another person's booking ... load, policy, state check, write is observable in tests"; booking use cases are S03/S05 | S01 forward dependency (H4) |
| 2.1 -> S00 `sessions.repository` write API | 2.1 AC1 session row inserted/deleted at login/logout; S01 Owns (l.2183) has no sessions write file; 1.10 AC2 lists read and purge only | undeclared S00 contract (H6) |
| 3.2, 3.3, 3.7 -> booking-insert helper | 3.3 AC2 (l.1264) "(inserted directly in the test)"; S02 Owns (l.2189-2195) lists no `helpers/s02.ts` or `e2e/support/s02.ts` | undeclared (H5) |
| 4.8, 4.9, 4.10, 6.1, 6.2 -> S03 test helper | 4.8 (l.1558), 4.9 (l.1576), 4.10 (l.1604), 6.1 (l.1875), 6.2 (l.1886) "inserting rows through the S03 test helper"; the helper is created in 4.2 (concurrency story) with no AC defining its capabilities | cross-slice contract with no AC (H5) |
| S03, S05, S06 -> `resources/index.ts` read port | 4.3 "embedded resource summary", 4.1 resource lookup, 5.1 "resource still active", 6.1 `top` resource {id,name,kind,symbol,colour}; spine AD-1 "modules call each other only through the other module's index.ts" | S02 owns the file; no AC in Epic 3 requires any export (H6) |
| 4.12 -> 4.11, 4.13 -> 4.11 | 4.12 AC1 (l.1646) "Enter on a block opens its detail or popover"; 4.13 AC2 (l.1674) "same ... popover behaviour as on desktop"; popover is built in 4.11 (l.1629); Index 4.12/4.13 depend on 4.10 only | undeclared, same slice (M) |
| 7.1 -> frozen CI/gate setting | 7.1 AC1 (l.1980) "route-enumeration test runs with the 501 gate switched on"; nothing says who sets it | undefined (M) |

### 1.3 Within-Epic-1 trace (what each story needs vs when it is built)

| Need | Built in | Used earlier by |
| --- | --- | --- |
| Clock, Oslo time, config, logger | 1.3 | 1.5 ok |
| AppError | 1.5 | 1.8 ok |
| Logger | 1.3 | 1.9 ok |
| i18n/format/links/api client | 1.13 | 1.14+ ok; (1.2's catalogue is contracts, not i18n) |
| temp-db, `buildApp` | 1.8 | **1.5-1.7, 1.3** |
| Session plugin, `mintSession`, policy | 1.10 | **1.8** |
| Playwright + axe | 1.18 | **1.14, 1.15, 1.17, 1.25** |
| Web test helper | 1.25 | **1.15-1.17** |
| trace/ledger/ownership/gate/accept | 1.19-1.24 | `verify` ownership check from 1.22 on; CI 1.28 |
| `verify:full` script definition | no story states it (1.21 owns only `verify:release`) | 1.23, 1.28, 1.29 |
| Merge gate "E2E smoke" | undefined (smoke.mjs is 1.28, after 1.23) | 1.23 |

### 1.4 Independence checks

- S01 and S02: genuinely independent in build. Separate module and feature directories; S02 authenticates through `mintSession` and the Playwright session fixture (1.10, 1.18); `countFutureBlocking`, `recordEvent`, `listEventsForBooking` are S00. The one-way couplings that remain are the S01 forward dependencies in H4 (they break S01's own landing, not S02).
- S04, S05, S06: the Index declares only the S03 gate. In AC text the three are independent of each other in build (5.4 was rewritten to test `BookingActions` in isolation; 4.8 and 6.x insert rows directly; the strip, sheet and host are seams). The test-level coupling is not between S04/S05/S06 but all three onto the S03-owned insertion helper (H5) and the S02/S03 module ports (H6).

---

## 2. Findings

### 2.1 Blocker

#### B1. The ownership machinery has no S00 build mode: slice/s00 cannot pass `check-ownership`, `--print-slice` or the merge gate as specified

Where: Index preface l.2127 ("one slice per path"); Index rows 1.8 (l.2161 "stub handlers in the module route files"), 1.11 (l.2164 "signature set of `modules/bookings/{bookings.repository,bookings.presenter,index}.ts`"), 1.18 (l.2171 "`e2e/<slice>.spec.ts` placeholders"), 1.19 (l.2172 `acceptance-ledger.json`), 1.22 (l.2175), 1.26 (l.2179 "stub pages and seam entry files `features/*/index.tsx`") against rows 2.1, 3.1, 4.1 (l.2196 same `bookings.repository`, `bookings.presenter`), 4.7/4.8/4.14 (`features/bookings/index.tsx`), 5.4 (`features/booking-actions/**` including `index.tsx`), 6.1; 1.22 AC1-2 (l.872-880); 1.23 AC1 (l.894-897); 1.28 AC2 (l.1010); 1.29 AC2 (l.1030-1033); spine AD-20 ("each a stub owned by the implementing slice in `ownership.json`"; "fails if [changed files] span several slices"; "`acceptance-ledger.json` ... never on a slice branch").

Evidence:
1. S00 must create files that the same Index assigns to other slices (route stubs in `modules/auth|resources|bookings|dashboard|activity/routes.ts`, seam entry files, `bookings.repository.ts`/`bookings.presenter.ts` signature sets, `i18n/nb/<feature>.ts`, `api/keys/<module>.ts`, `e2e/<slice>.spec.ts`, `e2e/support/<slice>.ts`, `apps/api/test/helpers/<slice>.ts`). The same path is listed in an S00 row and in a later slice's row, which violates the Index's own rule "one slice per path", and 1.22's test "every path ... is owned exactly once" cannot be written as stated.
2. 1.22 `--print-slice` "prints the single owning slice or fails when changes span several"; 1.23 "derives the slice from `ownership.json` and the changed files ... a candidate spanning several slices fails". The `slice/s00` candidate changes files owned by S00, S01, S02, S03, S04, S05, S06 at once. First real gate run (1.29 AC2) therefore fails, and CI on `slice/s00` (1.28 AC2: `FELLES_SLICE=S00` is set by hand for that branch only) would still fail `check-ownership` inside `verify` ("ownership check when a slice is set", AD-27) for every file outside S00.
3. From 1.22 on, `npm run verify` with a slice set runs the ownership check on S00's own later stories, which edit frozen files (`scripts/*`, `package.json`, `ci.yml`, `ownership.json`, `requirements.json`, contracts after the Gate); each would need a `Freeze-Approved` trailer. The ledger file is created on the slice branch by 1.19 although 1.22 classes it main-only.
4. The S07 candidate has the mirror problem: 7.x edits other slices' files under `Fixes: N.M` (1.22 AC2, l.880), so derived slice is S07 plus S04/S05/S06 and the gate's "spans several slices" rule rejects it.

Why it matters: this is the single gate through which everything lands (S00 -> S01/S02 -> all), and the only evidence that it works (the S99 dry run, 1.29 AC1) uses a fixture slice that does not hit stub creation, frozen self-edits or cross-slice Fixes edits.

Minimal fix text:
- Index preface, replace "one slice per path" sentence with: "Each path has one owner at any time. A path listed in an S00 row *and* in a later slice's row is a stub: S00 creates it, `ownership.json` records `{ "path": ..., "owner": "S0N", "createdBy": "S00" }`, S00 may create and edit it until `s00-accepted`, and only `S0N` may edit it afterwards. The same applies to frozen files and main-only files that S00 creates."
- 1.22 AC1 add: "`check-ownership` treats slice S00 as owning every `createdBy: S00` path and every frozen path until `s00-accepted` exists (no `Freeze-Approved` needed inside S00 except for `packages/contracts/**` and `migrations/0001-0099` after Gate S00-CP, which needs the re-approval of the Gate); `--print-slice` ignores `createdBy: S00` stubs when the branch is `slice/s00`." Add: "for `Fixes: N.M` commits the file counts as the slice of the *committing branch* (S07), so `--print-slice` and the gate see one slice."
- 1.23 AC1 add the same two sentences; add a fixture scenario "candidate slice/s00 touching stubs of S01-S06 passes; candidate slice/s01 touching an S02 stub fails".
- 1.29 AC1 add: "the dry run includes a branch that creates a stub for another slice under the S00 rule and is accepted, and the same edit after `s00-accepted` is refused".
- Index rows: keep dual listings but mark with `(stub)` in the S00 rows (1.8, 1.11, 1.18, 1.19, 1.26) so the generator can distinguish.

### 2.2 High

#### H1. Human acts per slice (gate run and Jo's acceptance) are assigned to a story only for S00, S03 and (partially) S01; no observable record exists for the others

Where: 1.29 AC3 (l.1035-1038, S00 acceptance and PIL-06 ramp decision recorded); 4.5 AC3 (l.1494-1497, S03: Jo runs `accept-slice.mjs S03`, records PIL-06 decision); 2.6 AC3 (l.1193-1195: "the condition for the merge gate to land the slice", but no landing or acceptance act); nothing at all in 3.7, 4.15, 5.5, 6.5, 7.8 for "the gate lands `slice/sNN`" or "Jo runs `accept-slice.mjs SNN`". Index dependencies "S01 and S02 accepted", "S03 accepted", "S04, S05 and S06 accepted" all rest on those acts.

Why: these are the acts every downstream dependency and ORK-02 depend on; PIL-07 "time waiting for acceptance" is measured against an act with no owner or record.

Fix: add to the last story of every slice (2.6, 3.7, 4.5, 4.15, 5.5, 6.5, 7.8) a final Given/When/Then: "Given all stories of slice SNN have `implemented`, `tested`, `reviewed` ledger entries on the slice tip; When the orchestrator runs `merge-gate.mjs slice/sNN` and then Jo runs `accept-slice.mjs SNN`; Then `sNN-integrated` and `sNN-accepted` exist, the ledger shows `accepted`, and `pilot-log.md` has an entry (date, SHA, waiting time) written on main." For S04/S05/S06 add "the integration cost of the parallel slices so far is noted for the PIL-06 decision".

#### H2. The merge gate enforces neither slice prerequisites (ORK-02) nor `tested`/`reviewed` on the exact commit (PIL-12, ORK-07)

Where: 1.23 AC1-3 (l.894-907) checks only `verify:full`, ownership and the shared set; 1.24 (l.917-920) checks story ledger entries only at acceptance, after code is already on `main`; Index 4.1/4.6/5.1/6.1/7.1 "S0N accepted" is prose; PRD PIL-12 (PRD l.204): "A branch merges to main only when `tested` and `reviewed` are recorded on its exact commit"; PRD 4.0 / ORK-02.

Consequences: an S03 candidate can land while S01 is only `integrated`; any slice can land unreviewed and be discovered only when Jo runs `accept-slice`. 7.8's counter-metric ("no slice was accepted before its gate passed") is satisfied trivially while PIL-12 is not.

Fix: add to 1.23 AC1: "the gate refuses a candidate whose prerequisite slices (from `requirements.json` `dependsOn`: S03 needs S01 and S02; S04, S05, S06 need S03; S07 needs S04, S05, S06; S01 and S02 need S00) lack an `sNN-accepted` tag, and refuses when any story of the slice lacks `implemented`, `tested`, `reviewed` ledger entries that cite commits reachable from the candidate tip." Move the ledger check in 1.24 to a re-check, not the first check. Add fixture scenarios for both refusals.

#### H3. S00 forward dependencies: the Index order cannot be followed literally

Where / evidence: see 1.2 and 1.3 above. In short:
- (a) 1.5-1.7 need `temp-db` (child-process and temp-file lifecycle, AD-26 dispose rule) which Index row 1.8 owns, and 1.8 depends on the Gate that depends on 1.7.
- (b) 1.8 AC3 walks the table "with a Member session" and checks access before the stub, which needs the 1.10 session plugin and `mintSession`.
- (c) 1.3 AC2 uses `buildApp`.
- (d) 1.14 AC3, 1.15 AC3, 1.17 AC3, 1.25 AC2 need a browser with a viewport (Playwright + axe, 1.18) and a render host; 1.15-1.17 also need the web Vitest provider helper that 1.25 AC4 builds.
- (e) `verify:full` as a script is defined by no story (1.21 owns only `verify:release`), and the gate's "E2E smoke" (1.23 l.896) is undefined (the `smoke.mjs` is 1.28).

Fix: (a) move `apps/api/test/temp-db.ts` into 1.5 or 1.6 Owns (Index and Owns column) and keep `app-factory.ts` in 1.8; (b) 1.8 AC3: "with no session and with a Member session built by an inline test cookie stub; the real-session variant is added in 1.10"; or make 1.8 depend on 1.10 and move the session plugin before the route kernel; (c) drop `buildApp` from 1.3 and test the injected Clock through `parseInstant` and the `Clock` type; (d) reorder: 1.18 right after 1.12, add 1.14, 1.15, 1.17, 1.25 -> 1.18 and the web test helper to 1.13 (it is a pure test util); state in 1.15/1.17 how component axe runs at a viewport (e.g. a dev-only Vite `gallery.html` entry excluded from the production build); (e) add to 1.20: "`npm run verify:full` = `verify` + Playwright + `trace.mjs` default set" and define "E2E smoke" in 1.23 as "the 1.18 sample spec on the production build of the candidate".

#### H4. Two S01 ACs depend on later slices, so S01 cannot reach its own landing condition

Where: 2.6 AC1 (l.1185) "reaches Hjem with 'Hei, Ingrid'" (greeting is S06, Story 6.3 AC1 l.1910; in S01 Hjem is the S00 stub page); 2.3 AC3 (l.1116-1119) "the order load, policy, state check, write is observable in tests ... a Member never receives a state-dependent error for a booking they may not read" (booking use cases and routes are 501 stubs until S03/S05). Evidence parts AUT-03@S01, E2E-07@S01, NFR-03@S01 (Index l.2185) and AUT-01@S01, AUT-04@S01 (l.2188) hang on them.

Fix: 2.6 AC1: "reaches Hjem (the S00 page `h1` and document title), the sidebar user block and the Mer sheet show her name and role". 2.3 AC3: limit to `policy.can` table tests and "the 403 for foreign-booking routes is not testable before S03 and is evidenced at 4.3 (`[AUT-03]`), 5.1/5.2 and 7.1"; move the ordering assertion to 4.3/5.2 where it already partly exists.

#### H5. Cross-slice test fixture contract has no owner and no AC; S02 has no helper or e2e support file in Owns

Where: 4.2 Owns `apps/api/test/helpers/s03.ts` (l.2197) described only as "concurrency suites"; consumed by 4.8, 4.9, 4.10 (via Playwright support), 6.1, 6.2 ("never through S05 endpoints"); Index lists `helpers/s01`, `s03`, `s05`, `s06` and `e2e/support/s01`, `s04`, `s05`, `s07` but no `helpers/s02.ts`, `e2e/support/s02.ts` (needed by 3.2 AC4, 3.3 AC2, 3.7 AC2 which require a future booking in the database) and no S03/S06 e2e support.

Why: S04, S05, S06 start after S03 is accepted and are not allowed to edit S03-owned files; if the helper cannot insert a rejected row with decision columns, an Administrator-cancelled row with reason, an Expired pending request, an in-progress booking from yesterday, each with its matching activity event and passing every trigger, those slices are blocked or edit an accepted file. The seed already builds exactly this (AD-25 "builds its own Tx per fixture row"), so the natural owner is S00.

Fix: add to 1.12 (or 1.11) an AC: "`apps/api/test/booking-fixtures.ts` exports `insertBooking(db, { resourceId, userId, startAt, endAt, status, purpose, decision?, cancellation?, withEvent })` that writes the row and its event through `recordEvent` with `tx.now` set to the row's instant; tests cover every status and every trigger; slices import it and do not edit it." Remove the helper from 4.2 Owns. Add `apps/api/test/helpers/s02.ts` and `e2e/support/s02.ts` to 3.3/3.7 Owns, `e2e/support/s03.ts` (or state 4.5 uses `app.inject` only) and `e2e/support/s06.ts` to 6.3.

#### H6. S00 seam signatures are incompletely specified for ports other slices must call; the owner files are then not editable

Where: (a) `resources/index.ts` is S02-owned (3.1 Owns, l.2189) and no AC in Epic 3 requires any export, yet S03 (create-booking resource lookup, embedded summary, `approvalRequired`), S05 (resource active check on approve) and S06 (`top` summary) must read resources through it (AD-1 "only through the other module's `index.ts`"). Note the cycle risk: `resources -> bookings` (`countFutureBlocking`) and `bookings -> resources`. (b) `BookingsReadPort` is a typed stub in `bookings/index.ts` (1.11 AC3, l.620; file S00-owned) but its methods are not listed; 6.1 Owns only `modules/dashboard/**` and `bookings-read.repository.ts` (l.2216) and so cannot add methods. (c) `sessions.repository.ts` / `session.service.ts` are S00 (1.10) but 1.10 AC2 (l.587-590) lists only read and purge; S01's login/logout (2.1) must create and delete sessions with SQL that belongs in that file; the lint rule in 1.10 AC4 bans test inserts only.

Fix: 1.11 AC3: "`resources/index.ts` is a typed S02 seam stub exporting `getResource(dbOrTx, id)`, `listSummaries(dbOrTx, ids)`; `BookingsReadPort` is enumerated: `listUpcomingForUser`, `countPendingApprovable`, `countConfirmedInWindow`, `topResourcesInWindow`, `chartBuckets`; each with signature and 501-equivalent body." 1.10 AC2: "`sessions.repository` exposes `insert`, `deleteByHash`, `purgeExpired`; `session.service` exposes `issue`/`revoke`; S01 calls them." Add the stub file to 3.1 Owns as `resources/index.ts (body)`.

#### H7. CI on slice branches is red by design and cannot carry PIL-11 parity until the last story

Where: 1.28 AC2 (l.1007-1010): CI runs `verify:full` on all three OSes; "`slice/sNN` branches derive [the slice] from `check-ownership --print-slice`"; spine AD-27 same; AD-26: `trace.mjs` exits 1 when an evidence part of the slice has no passing test. Index DoD (l.2149) requires only `verify` per story and `verify:full` "on the candidate".

Consequence: every push to a slice branch before its last story runs trace on an incomplete slice and fails on all three OSes, so a real Windows/macOS/Linux difference is invisible among the expected failures for 6 to 15 stories per slice. The sentence in AD-27 "prevents: a green local run that CI would fail" is not met in the one place it matters (per story).

Fix: 1.28 AC2: "on `slice/sNN` branches CI runs `verify` (including ownership with the derived slice) plus the Playwright suite on all three OSes, and runs the trace step only on a commit message trailer `Slice-Ready: SNN` or on the merge-gate candidate; the trace result of earlier pushes is reported as `INCOMPLETE <slice> <missing parts>` and does not fail the job." (AD-27 change needed: "trace step exit 1 is advisory on slice branches until `Slice-Ready`".)

#### H8. S07 landing is circular for NFR-01 and the `verify:release` trigger is undefined

Where: 7.7 AC1 (l.2092-2095): CI "on the S07 commit" must be green on all OSes and the macOS `smoke.mjs --require-full` result recorded in `manual-evidence/NFR-01.md`; Index 7.7 (l.2227) makes NFR-01@S07 an evidence part of the slice; 1.21 AC2 (l.856) allows a commit that differs from the cited one only under `manual-evidence/**`; 1.28 AC2 "a job on the S07 acceptance commit runs `verify:release`" (trigger undefined); 1.24 AC1 runs `verify:full` at acceptance (AD-27: "`verify:release` ... the S07 acceptance run").

Circle: the cited commit's CI `verify:full` includes the S07 trace over all S07 parts, including `manual-evidence/NFR-01.md`, which cites that CI run and therefore cannot exist at the cited commit; so no cited commit has a green `verify:full`. Also `accept-slice S07` runs the wrong command (`verify:full` instead of `verify:release`).

Fix: 7.7 AC1: "the cited evidence is the macOS job's `smoke.mjs --require-full` *step* of the CI run on the parent commit, and that step runs `if: always()` and is independent of the trace step"; Index: `NFR-01@S07` is satisfied by the manual-evidence file; trace for S07 verifies it from the file, not from CI status. 1.24: "for S07 `accept-slice` runs `verify:release`". 1.28 AC2: "a workflow `release.yml` triggers on tag `s07-integrated`" and 7.8 gets "Given tag `s07-integrated`, the release workflow ran `verify:release`".

### 2.3 Medium

- M1. S07 candidate slice derivation. See B1 point 4; additionally 7.1 "route-enumeration switch" (Owns l.2221) is a flag in an S00-frozen test and nobody sets it: define "the merge gate sets `FELLES_FORBID_501=1` when the slice is S07; `verify:release` sets it".
- M2. Gate S00-CP is not a sprint-status item and its evidence part cannot be satisfied. Index row (l.2160) lists evidence `PIL-09 (process)` with Owns "pilot-log.md entry only". If `requirements.json` carries `PIL-09@S00`, trace requires a passing test or `manual-evidence/PIL-09.md`, neither of which is a main-only pilot-log entry; and PIL-04 says sprint-status is the only delivery register, but `bmad-sprint-planning` derives entries from `### Story` headings, so the gate has no state. Fix: either drop the part (process requirement, not a MUST) and state "PIL-09 is evidenced by the pilot-log entry, outside trace", or make it `manual-evidence/PIL-09.md` produced in S00; add `gate-s00-cp` as a sprint-status key set by the orchestrator, with Epic 1 stories 1.8+ `blocked` until `done`.
- M3. Landed SHA versus ledger SHA. Story ledger entries "cite the slice-branch commit" (l.2137); main moves constantly (ledger, pilot-log, sprint-status commits are on main by design), so the candidate is built on a newer main (1.23 AC3). If the candidate is a rebase, every reviewed SHA is rewritten and unreachable from `main` (PIL-08 trail broken); if it is a merge commit, `reviewed @SHA` refers to a tip that is an ancestor, which is fine but not stated; PIL-02 says "a new commit invalidates earlier entries", which literally invalidates every story entry on the slice branch at the next commit. Fix: 1.23 AC2 "the candidate is a merge commit of the slice tip into main; slice commits keep their SHAs and the gate JSON is bound to the tree hash"; State model: "a story ledger entry stays valid while no later commit changes a path in that story's Owns cell; the gate re-checks this".
- M4. `accept-slice.mjs` for S07 (see H8) and non-atomic acceptance: tag, ledger change and sprint-status edits are separate objects (1.24 AC1); on partial failure the tag exists without ledger state (trace exits 2). Add: "a failed run leaves no tag; the script creates the tag last".
- M5. Owns column is not machine-readable for tests and entry files: 4.5 "S03 tests" (l.2200), 2.3/2.5 "S01 API tests", 5.5 "S05 API tests" (l.2215), 7.5 "measurement script"; module rows list single files (`modules/auth/{users.repository,...}.ts`) so colocated `*.test.ts` have no owner; the calendar page entry file is in no Owns glob (4.10-4.13 own only `calendar/grid|interactions|keyboard|mobile/**`); `apps/api/src/server.ts`, `apps/web/src/main.tsx`, `vite.config.ts`, per-workspace vitest configs appear in no Owns cell; the S00 stub page paths that the lazy route table imports are not named (1.26 l.963 "from files owned by their feature"). The 1.22 test "every path ... owned exactly once" will fail or silently assign these. Fix: add `modules/<m>/**/*.test.ts`, `apps/web/src/features/<f>/**/*.test.tsx` to each slice's Owns and name the page entry file per feature (for example `features/bookings/calendar/CalendarPage.tsx` under 4.10); add `server.ts`, `main.tsx`, configs to 1.1/1.8/1.26.
- M6. Contradictory statements on who renders which action. 1.17 AC2 (l.767) "BookingActions slot, which owns 'Avbestill' and the queue actions"; 5.3 AC3 (l.1803) the queue is built in `features/approvals` from `BookingRow`; 5.4 AC1 (l.1816) "does not duplicate the approve and reject buttons of the queue", "does not render 'Book igjen' (that belongs to BookingRow)"; 4.8 AC3 (l.1565) "hosts the frozen `BookingActions` slot (Avbestill when allowed, Book igjen when past or final)". The detail sheet footer's "Book igjen" is therefore delivered by nobody if the slot is a null stub (S04 tests) or by S04 if 4.8 is read with 5.4. Fix: 4.8 AC3: "the footer renders 'Book igjen' itself and hosts `BookingActions` for 'Avbestill' only"; 1.17: "the slot owns 'Avbestill' only; queue buttons are `features/approvals`".
- M7. F2 and bookings.ts. Index 4.4 Owns "schedule DTO exports in `packages/contracts/src/bookings.ts` (S03 until `s03-accepted`)" (l.2199) is not a path glob, while `bookings.ts` is also in 1.4 Owns (S00, l.2156) and carries F1 types (`BookingDto`). Ownership is per file, so S03 editing the schedule exports edits an F1 file. Likewise 1.4 owns `activity.ts` and `dashboard.ts` that 4.5 also owns. Fix: put the schedule DTO in its own file `packages/contracts/src/schedule.ts` (S00 creates it with a draft, S03 owns it until `s03-accepted`), re-exported by the frozen `index.ts`; mark activity/dashboard/schedule as `(stub)` in 1.4 (see B1 rule).
- M8. Seed content that the browser ACs rely on is not pinned. 2.6 (Ingrid), 4.15 (Fjellet, "Kundemøte Nordlys"), 7.2 (Ingrid, Magnus, Sofie, Jonas), 7.3 (Fjorden with a confirmed booking tomorrow, archived "Gammel projektor") assume names and rows that 1.12 AC1 (l.633) states only as counts; no slice may edit the seed (1.12 AC4). Also 1.3 AC3 (l.395) "a non-loopback `FELLES_HOST` is refused while synthetic data exists" needs `app_meta` (1.7) and the server start path; no story implements the startup refusal against the database and `server.ts` has no owner (see M5). Fix: 1.12 AC1 add "the seed equals the content pack of the UX design (named users Ingrid, Magnus, Sofie, Jonas; Fjellet, Fjorden, Projektor Epson, archived 'Gammel projektor'; a confirmed Fjorden booking on the day after the reference instant; three pending requests plus one Expired)"; give the startup refusal an AC in 1.9.
- M9. `Freeze-Approved:` is a self-asserted trailer (1.22 AC1, l.873-874) with no link to Jo. Anyone can add it. Fix: trailer value must be a pilot-log entry id (`Freeze-Approved: PL-2026-xx`) that `check-ownership` finds on `main`.
- M10. OQ-5 record. 7.7 AC2 (l.2097-2100) says "the decision is recorded" without a place; if Jo requires a real Mac, the S07 candidate cannot satisfy NFR-01@S07 and cannot land while the story "stays open". Fix: "recorded in `pilot-log.md` and as the first lines of `manual-evidence/NFR-01.md`; Jo decides at S07 planning (PRD OQ-5), before slice/s07 is branched".
- M11. i18n, key and invalidation file inventory is not enumerated in S00: 1.13 AC2-4 (l.663-671) says one key file per module "including `booking-actions`" and `i18n/nb/<feature>.ts` "including `common` and `booking-actions`". The Index later has slices own `i18n/nb/{auth,resources,bookings,approvals,dashboard,activity,booking-actions}.ts`, `api/keys/{session,resources,bookings,dashboard,activity}.ts`; `api/keys/booking-actions.ts` and `api/keys/approvals` are in nobody's Owns. If S00 does not create each file and its line in the frozen barrel, a slice edits `nb.ts` or `api/keys/index.ts` (frozen). Fix: 1.13 AC list the exact file set and "the barrels import all of them"; add `api/keys/booking-actions.ts` to 5.4 Owns.
- M12. SHOULD parts versus whole-slice landing. PRD 6 (l.164): SHOULD items "are last-in-slice stories and are listed as residual work if undelivered". The epics place throttling at 2.2 (of 6), RES-05 at 3.4 (of 7), BOK-08 at 4.9, VIS-06 at 6.4 (of 5), and the gate lands only when every part of the slice passes, so an undelivered SHOULD blocks the slice rather than becoming residual work. Fix: `requirements.json` marks SHOULD parts `level: SHOULD`; trace default set and the gate require MUST parts only; `--release` lists missing SHOULD parts as residual (7.8 already says this); optionally move the SHOULD stories last.
- M13. Orchestrator and OQ-2. The spine and epics assign the writing of story ledger entries, sprint-status transitions and pilot-log metrics to "the orchestrator" (State model l.2137; AD-20); PRD OQ-2 ("Before the first handoff; nothing is configured now") is not in the Epic 1 preconditions (l.310) and no story builds or specifies the writer. Fix: add to preconditions "OQ-2 resolved: who writes ledger, sprint-status and pilot-log (a human, a script or Agent Orchestrator)"; if a script, add a story (S00, delivery controls) `scripts/ledger.mjs` with the commands the DoD cites; also add push approval: PIL-11 "creating or pushing to a remote needs Jo's explicit approval" (the gate pushes), recorded once in the precondition with the pilot-log entry.

### 2.4 Low

- L1. Old naming remains in the spine: AD-20 "Story 1.4-CP" (spine l.190) is now "Gate S00-CP" after Story 1.7; the epics acknowledge the alias (l.312) but the spine, the APPROVAL-BRIEF ("T00-02") and AR1 (l.123 "T00-01 ... T00-03") are not mapped to stories (T00-01 = 1.1, T00-02 = 1.2-1.7, T00-03 = 1.8+). No leftover "one story, one branch" text remains in the spine or the epics (Git row l.275 and Index preface l.2131 agree).
- L2. Frontmatter `inputDocuments` (l.4-12) lists AMENDMENT-1 only; AMENDMENT-2 is the source of the 75-story shape. AR27 (l.164) cites "Amendment 1" only.
- L3. Epic 1 intro (l.312) "Stories 1.1-1.24 are verified with `npm run verify` ... gate does not exist yet" while 1.25-1.28 are also pre-gate; say "1.1-1.28".
- L4. 4.5 AC1 (l.1486) "a booking at the last bookable start 2026-11-18 08:00 Oslo succeeds and one minute later fails": one minute later is off the half-hour grid and fails for the wrong reason; use 08:30.
- L5. Intra-kit import direction is undefined in the diagram: `ui` must import `i18n` (jsx-no-literals) and `api/links` (1.17 BookingRow), but the diagram shows `ui · api · i18n` as one node. Add the allowed arrows to the 1.1 lint fixture list (`ui -> i18n, api/links`; `api -> i18n/format`; `api` never imports `ui`).
- L6. Duplicate assertions of the same behaviour in two slices: "Du er logget ut." / "Økten er utløpt." on `/logg-inn` in 1.25 AC3 (S00 stub with stubbed session) and 2.4 AC4 (S01 page). Keep S00's as the router/cache behaviour, and S01's as the page text.
- L7. 3.2 AC4 (l.1247-1249) "DEC-15 documented in a test fixture" is not a testable criterion before S03; move to 4.1 AC2 (already present) and delete.
- L8. Acceptance record content. PRD PIL-02 asks for `done` "with date and SHA in the ledger"; `acceptance-ledger.json` holds `{ slice, state, sha }` and the date lives only in the annotated tag. State "date and Jo's identity are the tag's tagger fields and are copied into the pilot-log entry".

---

## 3. Life of the key commits (command, verification set, can it pass)

| Step | Command | Verification set / trace | Can it pass? |
| --- | --- | --- | --- |
| First S00 story (1.1) on `slice/s00`, branched from `main` after the planning ff | `npm ci`, `npm run setup:native`, `npm run verify` | `verify` has no trace and no ownership check (no slice set, no `ownership.json`). Includes the `[NFR-02]` fixture lint tests | Yes. Precondition (Jo's approval, Node 24, ff, OQ-2, push approval) is prose only (M13, M2) |
| Mid-S00 (1.8-1.21) | `npm run verify` | no trace; ownership check absent until 1.22 | 1.5-1.8 hit the temp-db/Member-session forward edges (H3); 1.14-1.17 hit the viewport forward edge |
| After 1.22 | `npm run verify` with `FELLES_SLICE=S00` | ownership check on S00 files | **Fails** on stubs for other slices and on frozen self-edits (B1) |
| 1.28 (CI exists) | CI `verify:full` on 3 OSes with `FELLES_SLICE=S00` | set = {S00}; every S00 part needs a passing test | Passes only at 1.28/1.29 when all S00 parts exist; red before (H7 for other slices) |
| 1.29 first gate run | `merge-gate.mjs` on `slice/s00` | derive slice from changed files; `verify:full` with `FELLES_SLICE=S00`; ownership; integration set; empty ledger; tag `s00-integrated`; ledger commit | **Fails** at the derivation step (B1); "E2E smoke" undefined (H3e) |
| Jo accepts S00 | `accept-slice.mjs S00` on clean main | fresh `verify:full`; set = {S00} | Yes once the gate has landed; record: tag + ledger + sprint-status; no pilot-log step (L8, H1) |
| First S01 (2.1) and S02 (3.1) in parallel, `slice/s01`, `slice/s02` worktrees from main at `s00-accepted` | `npm run verify` with `FELLES_SLICE=S01|S02` | no trace in `verify`; ownership against the slice | Yes: ownership passes if `ownership.json` was generated with the B1 fix; separate ports per AD-24. Push to remote: CI trace red by design (H7) |
| Mid-S01 (2.3) | `npm run verify` | AC3 needs booking use cases | 2.3 AC3 and 2.6 AC1 cannot pass (H4) |
| Last S01 story (2.6): slice landing | gate with `FELLES_SLICE=S01` | set = ledger {S00 accepted} + S01; all 14 S01 parts must pass; with S02 possibly already integrated, S02 parts too | Passes only if H4 is fixed. Gate does not check ledger review entries or prerequisite acceptance (H2) |
| S02 landing after S01 | gate rebuilds S02 on new main | set now includes S01 | Yes; independent as long as S02 parts do not need S01 files |
| First S03 story (4.1) | `npm run verify` | no trace | Yes; the gate would also allow it with S01/S02 only `integrated` (H2) |
| S03 landing + Jo acceptance | gate; `accept-slice.mjs S03`; F2 package | set = {S00, S01, S02, S03} | Yes (4.5); freeze of F2 stated; helper contract missing for S04-S06 (H5); schedule DTO ownership per-file (M7) |
| S04/S05/S06 in parallel, each from `s03-accepted` | `verify`, then gate per slice | sets include previously landed parallel slices after rebuild | Yes in build; test coupling only via H5/H6 |
| S07 release | gate with `FELLES_SLICE=S07`, then `verify:release` | set = all ledger slices + S07, then `--release` ignores ledger and requires every part | Landing is circular on NFR-01 (H8); the 501-switch has no setter (M1); `accept-slice S07` runs `verify:full` not `verify:release` (H8, M4); derived slice for Fixes commits (B1.4) |

---

## 4. State model review (item 5)

What is unambiguous: story state = sprint-status; ledger entries are evidence per story commit; slice state = ledger + tag; requirement state computed (`evidenced`/`verified`); one acceptance act sets both story `done` and slice `accepted`.

Remaining ambiguities:
1. The gate (not only Jo) is where code reaches `main`, but `reviewed` is checked only at acceptance (H2).
2. Slice state `integrated`/`accepted` is delivery status stored outside sprint-status (ledger + tags) while PIL-04 says one register. The epics resolve this by calling the others "evidence" (l.2140); the two are written in the same act, but `accept-slice` is not atomic (M4, L8).
3. Story `done` appears nowhere between `integrated` and `accepted`; during that wait all stories show `review`. Acceptable but should be stated as intended.
4. Ledger SHA validity versus PIL-02 "a new commit invalidates" and the rebased/merged candidate (M3).
5. Gate S00-CP has no state key (M2).
6. Actor undefined: "the orchestrator" (M13).

---

## 5. Status of the earlier validator's blocker and high findings (previous 65-story version)

Source: `epics-validation-independent.md`. Status against the current document.

| ID | Earlier finding | Status | Evidence |
| --- | --- | --- | --- |
| B1 | Slice-level verification set vs story-level branches; first story of every slice cannot merge | CLOSED | Index preface (l.2131-2133) and Amendment 2: the slice is the integration unit; 2.6 AC3 (l.1193-1195) "condition for the merge gate to land the slice"; DoD (l.2149) "`verify` green on the slice branch ... `verify:full` with `FELLES_SLICE` on the candidate". Residuals are new (H7 CI, H1 no landing ACs) |
| B2 | S00 bootstrap undefined; gate tooling circular | CLOSED | Epic 1 intro (l.310-312) preconditions and bootstrap; Index row 1.23 depends on 1.18, 1.20, 1.22 (no cycle: 1.19 -> 1.20 -> 1.23); 1.28 AC2 `FELLES_SLICE=S00` on `slice/s00`; 1.29 first real gate run creates `s00-integrated`. New residual: B1 of this report (ownership has no S00 mode) |
| H1 | Contract checkpoint does not gate anything | CLOSED | "Gate S00-CP" (l.497-517) with Index dependencies of 1.8, 1.13, 1.19, 1.22 (l.2161, 2166, 2172, 2175; all later stories reach it transitively); 1.29 AC2 hash comparison. Residuals M2 (gate has no state/evidence artefact), M13 (Jo-approval precondition has no record) |
| H2 | Story 1.4 (checkpoint story) had forward dependencies | CLOSED | Schema moved to 1.7 after 1.3 (clock, config, logger), 1.5 (db, UoW, AppError), 1.6 (runner); Index 1.7 depends 1.6. New forward edge on `temp-db` remains (H3a) |
| H3 | Other S00 dependency-order errors (tokens, i18n before UI, web test helper, session endpoint) | PARTIAL | Closed: i18n/formatters now 1.13 before UI 1.14-1.17; tokens 1.14 after 1.13 (l.2166-2167). Still open: web Vitest helper in 1.25 used by 1.15-1.17 (l.949), Playwright/axe 1.18 after 1.15/1.17 (H3d); 1.8 -> 1.10 (H3b) |
| H4 | Seam registration not specified (BookingActions, host, strip, api/sheet ownership) | CLOSED | 1.26 AC2 (l.966-969) seam entry files, frozen props, providers, host mounted by shell; 4.7/4.8/4.14 Owns name entry bodies; `api/sheet.ts`/`slots.ts` S00-only (l.675). Residuals: ports (H6), dual listing (B1), "Book igjen" attribution (M6) |
| H5 | Availability strip placeholder in S02 / 4.12 lacks 4.7 | CLOSED | 3.5 AC1 (l.1307-1308) renders `<AvailabilityStrip>` from the slot hook, "no S02 code refers to another slice's story"; 4.14 depends on 4.7 and S02 accepted (l.2209); 4.14 AC3 "only `features/bookings/**` changes" |
| H6 | `modules/bookings/routes.ts` owned by two slices | CLOSED | 1.8 AC2 (l.534) names `routes.ts` (S03) and `transitions.routes.ts` (S05); Index 5.1/5.2 Owns `transitions.routes.ts` |
| H7 | Epic 5 declared independent of S04 but 5.4 tests S04 artefacts | CLOSED | 5.4 AC1-3 (l.1813-1826) test `BookingActions` in isolation with props and `onChanged`, integration deferred to 7.2; Epic 5 intro (l.1724) states independence |
| H8 | Smoke test needs login/booking that are 501 stubs | CLOSED | 1.28 AC3 (l.1012-1014) phased smoke with `PENDING <slice>`; `--require-full` only in S07 job; 7.7 AC1 uses it (l.2094) |
| H9 | State model: five registries, no mapping between `done` and `accepted` | CLOSED | State model (l.2135-2140) and 1.24 AC1-2: `accept-slice` sets all stories `done` and the ledger `accepted` in one commit; `verified` defined; 1.22 AC2 main-only class. Residuals M3, M4, M13, L8 |
| H10 | F2 contract freeze has no owning story | PARTIAL | Ownership added: 4.4 and 4.5 Owns (l.2199-2200), 1.22 AC2 (l.879), 4.5 AC3 (l.1494-1497). Still open: per-file ownership cannot express "schedule DTO exports" inside `bookings.ts`, and 1.4 also owns `activity.ts`/`dashboard.ts` (M7, B1) |
| H11 | 2.5 implements behaviour in S00-owned shell/api files | CLOSED | Shell identity, logout, cache clear and multi-tab are now S00 ACs (1.13 AC1 l.661, 1.25 AC3 l.944-947); 2.5 reduced to session lifetime, concurrent sessions and cookie flags (l.1152-1173), Owns "S01 API tests". Note L6 duplicate wording |
| H12 | Evidence parts missing per slice (UI-4/5, BR-4, RES-04@S03, NFR-03@S07, VIS-02 cancel, BR-3@S03, E2E-08@S03 tag) | CLOSED | Index parts now include UI-4/UI-5 for S01, S02, S04, S05, S06 (rows 2.4, 3.4, 4.7, 4.9, 5.3, 6.3, 6.5), BR-4@S01/S02/S03/S05 (rows 2.1, 3.2, 4.1, 5.1, 5.2), RES-04@S03 and E2E-08@S03 (row 4.1), BR-3 AC in 4.1 (l.1402-1405), `[E2E-08]` tag in 4.1 AC4 (l.1399), NFR-03@S07 (row 7.1), VIS-02@S07 (row 7.2), VIS-02@S05 (row 5.4) |

Count: 14 earlier blocker/high findings: 12 CLOSED, 2 PARTIAL (H3, H10), 0 OPEN. Of the 12 closed, B2 and H1 leave new residual issues recorded above (B1 of this report, M2, M13).
