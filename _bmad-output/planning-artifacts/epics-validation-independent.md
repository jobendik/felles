# Independent validation of epics.md (7 epics, 65 stories)

Validator: independent, read-only. Document: `_bmad-output/planning-artifacts/epics.md` (status: draft, 2,065 lines). References: ARCHITECTURE-SPINE.md (AD-1, 9, 18-22, 26, 27), AMENDMENT-1-proposal.md, PRD sections 4, 7, 8, step-04-final-validation.md. Line numbers below are lines of epics.md unless stated "spine" or "PRD".

Verdict: not ready to mark `final`. 2 blockers, 12 high, 14 medium, 8 low. Both blockers are process-structure defects (how stories reach `main` and how S00 bootstraps), not content gaps; the product content (coverage of MUSTs, ACs) is largely good.

Summary of tiers

| Tier | Count |
| --- | --- |
| Blocker | 2 |
| High | 12 |
| Medium | 14 |
| Low | 8 |

---

## 1. Blockers

### B1. Slice-level verification set vs story-level branches: the first story of every slice cannot merge, and the ledger/tag model deadlocks

Where: spine AD-20 (line 190), AD-26 (line 226), Consistency Conventions "Git: One story, one branch, one worktree" (spine line 275); epics.md 1.18 (lines 816-819), Index preface (1925-1929), 2.6 last AC (1050-1052), 1.21 (884-887).

Evidence (quotes):
- AD-20: merge gate "derives the candidate's slice ... runs `verify:full` with `FELLES_SLICE` set to that slice ... In the same push the gate adds the annotated tag `sNN-integrated` on the landed commit and one follow-up commit recording it in `acceptance-ledger.json` (`{ slice, state, sha }`".
- AD-26: verification set = "the slices recorded in `acceptance-ledger.json` (state `integrated` or `accepted`) plus the slice in `FELLES_SLICE` when set. It exits 1 when an evidence part of a slice in the set has no passing test".
- Amendment 1 validation table: scenarios are whole-slice candidates ("S01 and S02 candidates, each without the other: exit 0 / exit 0"). Nothing in the prototype tested a partial slice.
- epics.md 1.18: the gate "derives the slice, builds a throwaway merge candidate ... runs `verify:full` with `FELLES_SLICE` ... tags `sNN-integrated` and commits the ledger entry in the same push". DoD (1929): "`verify:full` green on the merge candidate". Branches and DoD are per story; the Index gives each story only some of the slice's parts.

Why it breaks, precisely:
1. Take Story 2.1 (first S01 story). Its candidate has slice S01, so `FELLES_SLICE=S01`, so every S01 part must pass: AUT-03@S01, BR-6@S01, E2E-07@S01, NFR-03@S01 (Story 2.3), UI-1@S01, UI-3@S01 (2.4), AUT-01@S01 UI part and AUT-04 UI (2.4-2.6). None exist yet. Exit 1, the gate refuses. The same holds for 3.1 (S02: RES-04, E2E-08 come in 3.3, UI-1 in 3.4), 4.1 (S03: BOK-04, E2E-02/03 in 4.2; E2E-01, BR-1 in 4.5), 5.1 (S05: APP-01 in 5.3, BOK-06 in 5.2), 6.1 (S06: VIS-05 in 6.2, VIS-06 in 6.4), 7.1 (S07: NFR-01 in 7.7). Only the last story of each slice can ever pass.
2. Even if a first story were forced through, the gate then writes `s01-integrated` and a ledger entry for S01. From that moment S01 is in the verification set of every later candidate, including the remaining S01 stories and the parallel S02 stories. They all fail until S01 is complete. That destroys the S01 || S02 independence that Amendment 1 was written to protect, and the next S01 story cannot merge because the incomplete S01 is already in its own ledger set.
3. A single ledger row per slice and an annotated tag `sNN-integrated` per slice cannot represent "story 2.1 landed, 2.2 not yet".
4. Local `verify:full` has the same problem: with no `FELLES_SLICE` and an empty ledger it exits 2 (empty set); with `FELLES_SLICE=S01` it exits 1 until the last story. A build agent therefore has no green `verify:full` for any intermediate story, although the Definition of Done demands one.
5. Story 1.21 first AC is infeasible for the same reason: a hello-slice branch editing S01-owned files needs `FELLES_SLICE=S01` (or the gate fails ownership/slice derivation), and then `trace.mjs` demands all S01 evidence parts, which do not exist: "`verify:full` passes with `FELLES_SLICE` set" cannot hold.
6. Story 2.6 AC 3 ("When the S01 stories are complete ... each have a passing named test at the S01 commit") shows the slice-level intent is real, which confirms the model rather than the per-story merge in the Index.

Minimal fix (no change to AD-20/AD-26 text, no script change): make the merge-gate unit the slice, keep stories as branches into the slice.

Add to the Index preface (after line 1929) and to Story 1.18 AC 2:

> Branching model. Each story is developed on `story/N.M` and merged into the slice integration branch `slice/sNN` (not main) after `npm run verify`, `npm run test -- -t "(@N.M)"`, the ownership check and review. The merge gate (`merge-gate.mjs`) and the AD-26 verification set operate on the slice: `slice/sNN` is the candidate, lands on `main` once, only when every evidence part of slice sNN passes, and creates `sNN-integrated`. Story ledger entries (`implemented`, `tested`, `reviewed`) are per story and per commit on the slice branch; `sNN-integrated` and `sNN-accepted` are per slice. A story that depends on another story of the same slice depends on its merge into `slice/sNN`; a story that depends on another slice depends on `sNN-accepted`.

Replace the Definition of Done item "`verify:full` green on the merge candidate" with: "`npm run verify` green on the story branch; `verify:full` with `FELLES_SLICE=<slice>` green on the slice candidate at the last story of the slice".

Replace 1.21 AC 1 with: "Given a scratch clone with a fixture slice `S99` (one fixture entry each in `ownership.json` and `requirements.json`, one evidence part) ... the dry run uses `FELLES_SLICE=S99`", so the dry run does not need real S01 evidence.

Alternative (if story-level landing on main is wanted): add `dueStory` to each `requirements.json` part, `storiesLanded` to the ledger row, and let the verification set for a partial slice contain only parts whose `dueStory` has landed or is the candidate. That is an Amendment 2 to AD-26 and needs Jo; the slice-branch rule above needs only an epics edit.

### B2. S00 bootstrap is undefined: nothing says how Stories 1.1-1.17 are integrated, and the gate tooling (1.18-1.20) has a circular and forward dependency

Where: Epic 1 intro (357), 1.1, 1.18 (803-828), 1.19 (830-851), 1.20 (853-874), 1.21 (876-897), Index rows 1.18/1.19 (1950-1951); spine AD-20 ("Tags and the ledger live on `main`: before S00 starts, `planning/felles` ... is fast-forwarded into `main` on Jo's instruction"), AD-26 exit-2 list.

Problems:
1. Stories 1.1-1.17 are built before `ownership.json`, `merge-gate.mjs`, `trace.mjs` and the ledger exist, yet the document treats every story as gated ("merge candidate"). No AC, dependency or sentence says where S00 commits live (a long-lived `slice/s00` branch? directly on `main`?) or which command verifies them. `npm run verify:full` (AD-27) includes `trace.mjs`; with no ledger the trace exits 2 ("ledger missing", "set empty"), so `verify:full` is unusable until 1.19 and then only with `FELLES_SLICE=S00`, which (B1) fails until 1.20. CI (1.20) "pushes to main set no `FELLES_SLICE`" would exit 2 on every push until `s00-integrated` exists.
2. 1.18 (gate) depends only on 1.1 (Index row 1.18) but its AC runs `verify:full`, which needs `trace.mjs` (1.19), Playwright (1.11), the shared integration set (route enumeration 1.6, schema snapshot 1.4, tokens check 1.12, contract round-trips 1.3, E2E smoke 1.11/1.20). 1.19 depends on 1.18. That is a soft cycle plus forward dependencies. 1.18 AC 4 validates against "a prototype repository", which is scratchpad code (Amendment 1 "Not yet verified: the real trace.mjs"), not a deliverable of the story.
3. Who creates `s00-integrated`? The tag is made by the merge gate on landing. If S00 never lands through the gate, 1.21 AC 3 ("`s00-integrated` and `s00-accepted` tags and the ledger entry exist") has no producer for the first tag.
4. `planning/felles` fast-forward timing is contradictory: spine says before S00 starts; epics places it only as the last "And ... beforehand" clause of the last S00 story (line 897) and nowhere in Epic 1's preconditions ("Depends on: nothing", line 307). Consequence: the agent building 1.1 does not know the base branch, and tags/ledger "live on main" before they exist.

Minimal fix: add a "Bootstrap" paragraph under Epic 1 intro and amend the Index:

> S00 bootstrap. Precondition (not a story): Jo has approved PRD, architecture, this document (PIL-09) and instructs the fast-forward of `planning/felles` into `main`. S00 is built by one agent on `slice/s00` branched from that `main`; stories 1.1-1.17 are verified with `npm run verify` only. Stories 1.18 and 1.19 are built in this order: 1.19 `trace.mjs` and `requirements.json` first (it needs the ledger file format, created empty in 1.19), then 1.18 gate and accept scripts. Story 1.21 performs the first and only real run of the merge gate on `slice/s00` (S00 as a whole-slice candidate), which creates `s00-integrated` and the first ledger row; Jo then runs `accept-slice.mjs S00`.

Fix the Index: row 1.18 depends on 1.11, 1.12, 1.19; row 1.19 depends on 1.3, 1.11 (reporters) and 1.1 (not 1.18). Add to 1.18 AC: "the prototype scenarios of Amendment 1 are re-implemented as committed fixture tests of the real scripts". Add to 1.20: "until `s00-integrated` exists CI runs with `FELLES_SLICE=S00` on `slice/s00` pushes".

---

## 2. High

### H1. The Jo contract checkpoint after Story 1.4 does not gate anything

Where: 307 ("Gate: Jo checkpoint after the contract draft"), 357, 440-442 (1.3 AC 4), 892 (1.21 AC), Index rows 1.5-1.8 (1937-1940).
Evidence: the checkpoint appears only as prose in the epic intro, as "a reviewable summary is produced for Jo's checkpoint after Story 1.4" (1.3) and as "Jo's checkpoint after Story 1.4 and this dry run are recorded before acceptance" (1.21). No story from 1.5 on lists the checkpoint under Dependencies (1.5 depends on 1.1, 1.2; 1.6 on 1.3, 1.4, 1.5). The only check is at the end of S00, after 17 further stories were built on contracts Jo may reject. Epic 1 also says "Depends on: nothing" although PIL-09 requires Jo's approval of PRD, architecture and epics first. PIL-09 literally says no application code before the S00 contracts are approved; the spine and epics compromise (checkpoint after T00-02, code before it) without stating that this is a conscious reading Jo accepted.
Why: if Jo rejects routes/DTOs/schema at the end, rework spans 1.5-1.21; contracts can also change after the review (1.6, 1.8, 1.9 touch error codes and DTO use) with no re-review.
Fix text:
- Add a pseudo-story gate to the Index: "1.4-CP Jo contract checkpoint: dependencies 1.3, 1.4; done when Jo records approval of the route table, DTO list, schema snapshot hash and a contracts content hash in `pilot-log.md`". Make 1.5, 1.6, 1.8, 1.9, 1.10 depend on `1.4-CP`.
- Add to 1.21 freeze package: "contracts content hash equals the hash approved at 1.4-CP, or the diff was re-approved".
- Epic 1 "Depends on": "Jo's approval of PRD, architecture and this epics document (PIL-09); S00 contracts approved at 1.4-CP, which Jo accepts as the PIL-09 reading".

### H2. Story 1.4 (the checkpoint story) has forward dependencies

Where: 1.4 (lines 454, 466-469), Index row 1.4 (depends 1.1, 1.2).
Evidence: AC needs `config.nodeEnv`/`isVitest` ("default development path is refused under test", from config, 1.5), logging "logged absolute" (logger, 1.7), `Tx` "carries `now`" (Clock, 1.5) and "surfaces as `DATABASE_BUSY`" (AppError and envelope mapping, 1.6; the status mapping is in 1.6).
Fix: reorder or re-declare: 1.4 depends on 1.5 (move Clock/config before the schema story) and states "`DATABASE_BUSY` is raised as `AppError` defined in this story's `platform/app-error.ts` (moved from 1.6)"; logging of the DB path uses `console` until 1.7 or move `platform/logger.ts` into 1.5.

### H3. Other S00 dependency-order errors (declared dependencies do not cover what the ACs use)

- 1.12 (tokens, deps: 1.1) AC 1 needs contracts symbol/colour ids (1.3) and "Norwegian names exist in the i18n catalogue" (i18n structure from 1.16).
- 1.13-1.15 (deps 1.12/1.13) use UI strings ("Lukk", "Prøv igjen", "Forkaste endringene?", "Begrunnelse"), which must live in `i18n/nb/*` (`react/jsx-no-literals` in `ui`), the status-label function, `api/links` (BookingRow "through the URL helper") and the activity DTO: all from 1.16 (deps 1.1, 1.3). 1.16 must precede 1.13.
- 1.11 AC 4 (web Vitest helper "providers (query client, router, session, clock)") needs 1.16 and 1.17 but depends only on 1.6-1.10.
- 1.17 uses `GET /api/session` (1.8) and the route stubs but does not depend on 1.8.
Fix: Index dependencies: 1.12 -> 1.3; 1.16 -> 1.3, 1.12 and ordered before 1.13; 1.13 -> 1.16; 1.15 -> 1.14, 1.16; 1.11 split: API/Playwright part after 1.10, web Vitest provider helper moved to 1.17; 1.17 -> 1.8.

### H4. Seam registration without editing S00 files is not specified; BookingActions, `?booking=` host and the availability strip have no S00 stub or registration path

Where: 1.15 AC 2 (line 741), 1.16 AC 4 (771-773), 1.17 (775-801), 4.7 Owns (row 1973), 4.8 AC 3 and row 1974 ("`?booking=` host"), 5.4 (1600-1621), Index row 5.4 (1983), spine AD-20 (line 190), AD-22, structural seed `booking-actions (S05, stub in S00)` (spine line 366).
Evidence:
- No story creates the S00 stub of `features/booking-actions` or defines the frozen props. 1.15 only says "supplied by the frozen `BookingActions` slot"; 5.4 AC 1 recites "the frozen `BookingActions` props (`booking`, `viewer`, `placement`, `onChanged`)" that no earlier AC defines.
- 4.8 "Owns `?booking=` host": no file path. The host must be mounted somewhere in the S00 shell (`app/`, owned and frozen by 1.17); 1.17 AC mentions neither host nor mount point.
- The spine contradicts itself: AD-20 says "S04/S05 replace [the] bodies" of `api/sheet.ts`/`api/slots.ts`; AD-1/AD-21 say `api/` is below features (features import api, never the reverse) and `app/` "supplies their implementations through providers". A body in `api/sheet.ts` cannot import `features/bookings` (layer violation), so the only legal registration is `app/` importing a feature entry, i.e. an edit to a frozen file unless S00 pre-wires it. Index 4.7 lists "`api/sheet.ts` body" as owned, while 1.16 owns `apps/web/src/api/**` entirely: two owners of one path.
- `ui/BookingRow` cannot import `features/booking-actions`, and features cannot import features. The Mine bookinger list (S04), the detail-sheet footer (S04), the queue (S05) and Hjem (S06) all need BookingActions; the route by which they render S05's component is not described.
- Only `usePendingCount` is complete: 1.16 stub, 6.3 Owns `api/keys/dashboard.ts`.
Fix text (add to 1.16 and 1.17 ACs, Index rows, and 1.21):
> S00 creates a typed seam entry file in each feature directory (`features/bookings/index.tsx` exporting `BookingSheet`, `BookingDetailHost`, `AvailabilityStrip`; `features/booking-actions/index.tsx` exporting `BookingActions` with the frozen props; each a stub), owned by the implementing slice in `ownership.json`. `app/providers` (S00) imports these entries once and provides them through `api/sheet.ts`, `api/slots.ts` and the `?booking=` host mount; the `api/` files contain only context hooks and are never edited by slices. A slice replaces the body of its entry file and never edits `app/` or `api/`.
Add to 1.21 AC 1: the dry-run branch replaces the body of one seam entry (e.g. `features/booking-actions/index.tsx`) and the check passes. Remove "`api/sheet.ts` body" from Index row 4.7. Add `features/bookings/index.tsx` seam file to 4.7/4.8 Owns and `features/booking-actions/index.tsx` to 5.4.

### H5. Availability strip: S02 placeholder filled by S04 requires editing S02-owned files; Story 4.12 also lacks a dependency on 4.7

Where: 3.5 AC 1 (line 1165), 4.12 (1478-1494), Index rows 3.5 (1964) and 4.12 (1978); spine Deferred (line 419), AR30 (line 167).
Evidence: 3.5: "the availability strip area renders its documented placeholder until Story 4.12 fills it" (an S02 AC that points at a later slice's story). Index 4.12 Owns: "`features/resources/detail` strip slot filled via `features/bookings/availability-strip/**`" - the first part is an S02 directory. Features may not import features (AD-1), and S04 may not edit S02 files. 4.12 AC 2 "after a successful booking the strip already shows the new Din booking segment" requires the booking sheet (4.7), but 4.12 depends only on "S03 accepted; Epic 3 (S02) accepted".
Fix: the strip is a seam of H4 (`AvailabilityStrip` from `features/bookings/index.tsx`, rendered by 3.5 through the `api/slots` hook; 3.5 AC: "renders `<AvailabilityStrip resourceId>` from the slot hook; the S00 stub renders nothing"). Change 4.12 Owns to `features/bookings/availability-strip/**` only; 4.12 depends on S03 accepted, S02 accepted and 4.7. Remove the 3.5 reference to 4.12 from its AC (keep it in a note).

### H6. `modules/bookings/routes.ts` is owned by two slices

Where: Index rows 4.1 (1967), 4.3 (1969), 4.4 (1970) ("routes.ts"), 5.1 (1980), 5.2 (1981) ("routes"); 1.6 Owns (row 1938 "stub handlers in every module `routes.ts`") and AC 2 ("stub in the file of its owning slice"); spine AD-20 bookings split and structural seed (spine line 356).
Evidence: the spine splits the bookings module by owner for the repository only. Routes are not split. Under the Index, S03 owns create/read/list/schedule in `routes.ts` and S05 adds approve/reject/cancel to the same file. `check-ownership` (1.18) fails any file outside the slice, and S03's slice is finished and accepted by then, so S05's branch cannot edit it.
Also: 4.3 and 4.4 (parallel after 4.1) both edit `routes.ts` and `bookings.repository.ts`, and 4.1/4.3/4.4 all edit `bookings.repository.ts`; harmless only if a slice has one agent working stories serially (see M3).
Fix: in 1.6 AC 2 name the files: "`modules/bookings/routes.ts` (S03: create, list, get, schedule) and `modules/bookings/transitions.routes.ts` (S05: approve, reject, cancel) are created with 501 stubs and registered in `app.ts`; `modules/dashboard/routes.ts` and `modules/activity/routes.ts` likewise". Update Index rows 5.1 and 5.2 to `transitions.routes.ts`.

### H7. Epic 5 is declared independent of S04 but Story 5.4 tests against S04 artefacts

Where: Epic 5 intro (1519: "depends ... on nothing in Stories 4.6-4.13"), 5.4 AC 2 and 3 (1615-1621), Index preface/4.8 (1411).
Evidence: 5.4 AC 2: "the row moves to 'Tidligere' after the refetch" (Mine bookinger list, 4.9); AC 3: "the owner sees it in the Booking detail sheet ... the sheet shows the new status" (detail sheet, 4.8). A S05 branch built before or without S04 cannot test these. Also 5.4 AC 1 says BookingActions gives Administrators "approve and reject where the queue rules allow", duplicating 5.3's queue buttons.
Fix: rewrite 5.4 so every AC uses only the component under test with props and the S05 queue: replace "the row moves to Tidligere" with "`onChanged` is called and the bookings queries are invalidated through the map"; replace "owner sees it in the Booking detail sheet" with "`GET /api/bookings/:id` returns the cancellation" (already 5.2) and leave the in-sheet checks to 7.2 (which already covers them); delete the approve/reject sentence from AC 1.

### H8. Story 1.20 smoke test needs login (S01) and booking creation (S03), which are 501 stubs in S00

Where: 1.20 AC 3 (871-874); spine AD-27 (smoke "fresh seed, start, log in, one booking, one conflict"); Index row 1.20 (1952), `scripts/**` frozen (spine AD-20 "root scripts").
Evidence: `POST /api/session` is S01 and `POST /api/bookings` is S03 (Contract Minimums). In S00 both return 501, so `smoke.mjs` as written fails on the macOS CI job from the first run until S03 lands, and 1.20's own CI AC ("macOS ... smoke") cannot be demonstrated. Because root scripts are frozen, S07 (7.7) cannot fix it without `Freeze-Approved`.
Fix: 1.20 AC 3: "`smoke.mjs` runs phases, each skipped with a printed `PENDING <slice>` while its route answers 501 (seed and start, `GET /api/health`, `GET /api/session` in S00; login after S01; one booking and one refused conflict after S03). `smoke.mjs --require-full` fails on any pending phase and is the only mode used by the S07 job (7.7)". 7.7 AC: "the macOS job runs `smoke.mjs --require-full`".

### H9. State model: five registries and no stated mapping between story `done` and slice `accepted` (PIL-02, PIL-03, PIL-04, PIL-12)

Where: PIL-02/03/04 (lines 172-175), Index DoD (1929), 4.5 (1343), 1.18 AC 3, spine AD-20 and AD-26.
Evidence:
- PIL-04: "Delivery status lives only in the sprint-status file ... one authoritative source". The epics introduce (a) sprint-status states, (b) per-story ledger entries `implemented/tested/reviewed @SHA` (PIL-02, in the story file), (c) `acceptance-ledger.json` with slice states `integrated/accepted`, (d) annotated tags `sNN-integrated/accepted`, (e) `pilot-log.md`. The DoD says "`done` only by Jo" per story, while acceptance in the architecture is per slice (`accept-slice.mjs`). The document never says whether Jo marks each story `done` and then accepts the slice, whether `accept-slice` sets sprint-status `done` for the slice's stories, or which of (a) and (c) wins on disagreement.
- Spine: "Slice branches never edit `sprint-status`, other stories or `pilot-log.md`; the ledger is written on main". The story ledger lives in the story file, but the DoD makes it a branch deliverable ("story ledger carries ... with SHA"). No ownership class for `_bmad-output/implementation-artifacts/**` and `pilot-log.md` is defined in 1.18.
- Vocabulary: `verified` is used for ORK status (PRD section 10) and for requirement evidence (7.7 "NFR-01 cannot reach `verified`") with no definition; "reviewed" and "merge candidate" SHAs differ (the gate lands a throwaway candidate, PIL-02 says a new commit invalidates earlier entries).
Fix: add a "State model" section after the Index preface:
> Story state (sprint-status, orchestrator on main): backlog, ready-for-dev, in-progress, review, done. Story ledger entries `implemented`, `tested`, `reviewed` cite the story-branch tip SHA and are written on main by the orchestrator after the matching run; `done` is Jo's, and `accept-slice.mjs` sets all stories of the slice to `done` in the same commit as the `sNN-accepted` tag and ledger state, so there is one act of acceptance. Slice state (acceptance-ledger.json + tags): `integrated` (landed by the gate with all slice evidence passing) then `accepted` (Jo). Requirement state is computed: evidence part passing at an integrated slice = `evidenced`; at an accepted slice = `verified` (PIL-13 terminology). Agent completion is at most `implemented` (PIL-03). `check-ownership` classifies `_bmad-output/implementation-artifacts/**`, `pilot-log.md`, `acceptance-ledger.json` as main-only; a slice branch touching them fails.

### H10. F2 contract freeze has no owning story

Where: 4.5 AC 3 (1340-1343), Index row 4.5 ("no production files"), 1.3 (Owns all contracts files, row 1935), spine AD-20 ("F1 at S00 acceptance, F2 at S03 acceptance (activity, dashboard, final schedule DTO)"), AR27.
Evidence: contracts are S00-owned and frozen; the F2 files (`activity.ts`, `dashboard.ts`, the schedule DTO inside `bookings.ts`) must be finalised during S03, yet no S03 story lists them in Owns and 4.5 states "no production files". Edits are either impossible under `check-ownership` or the "F2 freeze" is a no-op ("presented with the evidence").
Fix: 1.18 `ownership.json`: "`packages/contracts/src/{activity,dashboard}.ts` and the schedule DTO exports are owned by S03 until `s03-accepted`, frozen afterwards". Add those paths to the Owns cell of 4.4 (schedule) and 4.5 (activity and dashboard DTO finalisation), and an AC to 4.5: "the F2 files are final, round-trip tests updated, `Freeze-Approved` not needed because S03 owns them".

### H11. Story 2.5 (and AUT-04's UI part) implements behaviour in S00-owned shell and `api/` files

Where: 2.5 (1009-1030), Index row 2.5 (1958), 1.16 AC 1 (759), 1.17 AC 1-2 (785-791), AD-21.
Evidence: 2.5 requires the sidebar user block, avatar initials, Mer sheet identity, "Logg ut ... overlay closes ..., query cache cleared", multi-tab user-id change detection and 401 handling. The shell with user block and "Logg ut" is built in 1.17, and `api/call` clears the cache on `UNAUTHENTICATED` and the session re-anchoring is in 1.16 (S00, frozen). Index 2.5 Owns only `features/auth/**` and session key entries. Either 2.5 duplicates S00, or S01 must edit `app/**` and `api/**`.
Fix: move shell identity, cache clearing and multi-tab behaviour fully into 1.16/1.17 ACs with tests using a stubbed session, and reduce 2.5 to the S01 parts that really are S01: the Login-page-side behaviours and the browser proof that the S00 shell shows the signed-in identity after the real login (a test in `e2e/auth.spec.ts`, 2.6). Keep AUT-04@S01 in 2.1 (API) and 2.6 (browser).

### H12. "All slices" rows lack per-slice evidence parts, and some Index parts have no AC that delivers them

Where: Index parts column (rows 1933-1997) against PRD 4.6 and 4.7.
Evidence:
- UI-4 and UI-5 ("all UI slices", PRD 4.6) exist only as UI-4@S00 (1.13) and UI-5@S00 (1.16). No UI-4/UI-5 part in S01, S02, S04, S05, S06, and none in S07 (7.4 covers UI-2, UI-3, E2E-10 only). Loading/empty/error/confirmation and Norwegian formatting are in many ACs but not tagged, so the release gate cannot detect a slice that omits them.
- BR-4 ("every slice") only at S00 (1.3, 1.6). Validation ACs exist (3.2, 4.1, 5.1, 5.2) but are not parts of S02/S03/S05.
- BR-3@S03 is listed on 4.1 (row 1967) but no S03 AC exercises "never overwritten or deleted" (4.1-4.4 contain no update/delete/replace attempt; only 1.4 and S05 ACs do).
- E2E-08@S03 (archived-not-bookable) is listed on 4.1, but the AC tags it `[RES-04]`/`[BR-2]` (line 1250), not `[E2E-08]`; the trace needs a test titled with that id.
- RES-04@S03 (PRD 4.2 owner "S03: booking engine rejects archived Resources") has no part.
- NFR-03 "S07 verifies" (PRD 4.6) has no S07 part (coverage map line 271 says Epic 7).
- VIS-02 cancel half ("open details or cancel") is evidenced nowhere before 7.2, and 7.2 carries no VIS-02 part.
Fix: add parts: UI-4@S01/S02/S04/S05/S06, UI-5@S01/S02/S04/S05/S06, BR-4@S01 (login 400), BR-4@S02, BR-4@S03, BR-4@S05, RES-04@S03, NFR-03@S07 (in 7.1 or 7.4), VIS-02@S07 (7.2); add one AC line to 4.1: "an UPDATE of purpose or time, a DELETE and an `INSERT OR REPLACE` through the repository's public surface are absent, and the database rejects them (`[BR-3]`)"; retag the archived-resource AC `[E2E-08]`. Add a generic last AC to every UI story: "loading, empty and error states per EXPERIENCE State Patterns, tagged `[UI-4]`; dates and counts through `i18n/format` tagged `[UI-5]`".

---

## 3. Medium

### M1. New `ui/` primitives needed by slices are not in any Owns cell; ownership checker must support add-only directories
3.6 needs Switch and RadioGroup wrappers (UX-DR15), 4.11 needs Tabs (tablist), 6.3 needs Stat tile (UX-DR17), 2.5 Avatar (UX-DR25). The S00 primitive list (AD-22; 1.13-1.15) contains none of them, spine allows slices to add new files to `ui/`, but Owns for 3.6, 4.11, 6.3 list only feature directories, so `check-ownership` would reject them, and 1.18 AC 1 does not define add-only handling for frozen directories (`ui/`) versus modification. Fix: add `ui/Switch.tsx`, `ui/RadioGroup.tsx` to 3.6, `ui/Tabs.tsx` to 4.11, `ui/StatTile.tsx` to 6.3 Owns; add to 1.18 AC 1 "files added under `ui/` pass; a modified existing `ui/` file needs `Freeze-Approved`". (Alternatively move Switch, RadioGroup, Tabs, Avatar into 1.13.)

### M2. i18n, keys and invalidation barrel files are missing from Owns, and the invalidation map is both "frozen complete" and per-owner
Owns omit `i18n/nb/resources.ts` for 3.5-3.7 (3.4 only), `i18n/nb/bookings.ts` for 4.6, 4.8-4.12 (4.7 only), `i18n/nb/booking-actions.ts` for 5.4, `api/keys/resources.ts`, `api/keys/bookings.ts`, `api/keys/activity.ts`. 1.16 AC 2 says every mutation contract gets an invalidation entry in S00 ("complete frozen mutation map", AD-21) while 2.5 owns "invalidation session entries" and the spine (AD-20) lists per-owner `api/invalidation/<module>.ts`. Fix: 1.16: "S00 creates all `i18n/nb/<feature>.ts` (including `booking-actions`) and `api/keys/<module>.ts` files and writes every invalidation entry; slices add key factories and strings only in their own files"; list the files in each story's Owns; remove invalidation entries from 2.5.

### M3. Test helper files are owned by the last or a different story but used earlier
`apps/api/test/helpers/s03.ts` owned by 4.2 yet 4.1 (first S03 story) needs helpers; `helpers/s01.ts` owned by 2.3 but used by 2.1/2.2; `helpers/s05.ts` owned by 5.5 but 5.1/5.2 need it; `e2e/support/s07.ts` owned by 7.2 but 7.3/7.4 use it; `e2e/bookings.spec.ts` owned by 4.13 while 4.9-4.12 need Playwright axe/horizontal-scroll specs (S05 and S06 own no e2e file at all, S06 has no `helpers/s06.ts`). jsdom (1.11 web project) cannot verify viewport width or horizontal scroll, so these ACs ("passes axe at 375 and 1440 px, no horizontal scroll") need Playwright files. Fix: state "within a slice stories are executed serially by one agent (PIL-06); a slice's helper and e2e files are owned by the slice, not by one story" and add `e2e/<slice>.spec.ts` ownership for S05 and S06 (e.g. `e2e/approvals.spec.ts`, `e2e/overview.spec.ts`) to 5.3 and 6.3/6.5.

### M4. The Owns column is not machine-readable and has overlapping globs, though it is declared the source of `ownership.json`
Line 1922 says the Index is "the source for `requirements.json` and `ownership.json`". Cells contain prose ("S03 tests and the F2 package; no production files", "hello-slice branch (throwaway), freeze package document", "evidence pack document, pilot log", "strip slot filled via", `{catalogue}/**` with a stray brace in 3.4, line 1963), unresolved paths ("`?booking=` host", "route and nav tables"), overlap (1.16 `apps/web/src/api/**` vs 2.4 `api/keys/session.ts`; 1.11 `e2e/support/**` vs `e2e/support/s01.ts`; README owned by 1.20 (S00) and 7.6 (S07); `manual-evidence/` owned by 1.19 convention, 7.8 whole directory and 7.4-7.7 individual files). Fix: add a rule "Owns cells are path globs only, most specific glob wins, one slice per path; README and `manual-evidence/**` are mapped to S07 after `s00-accepted`", and restate the prose cells as paths; generate `ownership.json` by a script with a test that every path under `apps/`, `packages/`, `e2e/`, `scripts/` is owned exactly once.

### M5. Evidence form of "gate-type" parts and the test-tag syntax
NFR-02@S00, RUN-1@S00/S07, SEED-1@S00, UI-2@S00, BR-4@S00 are not naturally tests, but the Index rule is "a part is satisfied when a passing test titled `[REQ] ... @N.M` (or a valid manual-evidence file) exists" (line 1925). Which test is titled `[NFR-02]` or `[RUN-1]` is not stated. The test command `npm run test -- -t "@N.M"` (line 1928) is a regex/substring filter: `@1.1` matches `@1.10`-`@1.19`, `@4.1` matches `@4.10`-`@4.13`, and `.` is a wildcard; `npm run test` is Vitest only, so stories whose evidence is Playwright (2.6, 3.7, 4.13, 7.x) have no command. Fix: tag syntax `(@N.M)` with the closing parenthesis in the filter (`-t "\(@4\.1\)"`), add "`npm run test:e2e -- -g ...`" for browser stories, and name the gate tests (e.g. `[NFR-02] verify gate fails on a lint violation` as a fixture test, `[RUN-1]` as a test that spawns `start.mjs` on a temp DB, `[SEED-1]` as the counts test).

### M6. Manual-evidence files are self-referencing and S07 is a slice-level candidate
7.4-7.7 require `manual-evidence/<id>.md` with "commit" of a CI run or a README test; committing the file changes the commit, and PIL-02 says a new commit invalidates earlier entries. NFR-01 evidence (7.7) cites the CI run "on the S07 commit". `verify:release` runs on "the S07 acceptance commit". Fix: define that manual-evidence cites the tested parent commit and that `trace.mjs --release` accepts a commit whose only changes versus the cited commit are under `manual-evidence/**`.

### M7. Non-slice changes (planning documents, docs PRs) have no trace/CI path
AD-20: "planning amendments reach `main` by pull request". CI on such a PR derives a slice from `check-ownership --print-slice`, which finds none, and AD-26 exits 2 on an empty set. Frozen `requirements.json` is generated from the epics, so any later epics edit (including fixes from this validation) alters a frozen file. Fix: 1.18/1.19: "a change set touching only `_bmad-output/planning-artifacts/**` runs `verify` without `trace` (slice `planning`), and `requirements.json` is regenerated and committed in the same PR with a `Freeze-Approved` trailer".

### M8. Fixtures for states only later slices can produce
4.8, 4.9, 4.10 (rejected, cancelled, Expired, own-pending, other-pending blocks), 6.1/6.2 (approve, reject, cancel events) assert states or events that only S05 creates; S04 and S06 are claimed independent of S05 (4.1 header, Epic 6 header). The ACs do not say fixtures are inserted directly. Fix: add to each: "state is created by inserting rows through the S03 test helper (directly, triggers satisfied), never through the S05 endpoints".

### M9. Entity/table creation principle: Story 1.4 creates the whole schema; justified, but the document does not say so, and the story is oversized
Step-04 rule: tables are created by the first story that needs them; "WRONG: Epic 1 creates all tables upfront". Architecture grounds for the exception: AD-19 "S00 delivers the whole schema ... After the freeze any new migration needs Jo"; PRD PIL-06 entry gate for parallel work (schema frozen and approved before S01 || S02); cross-table constraints and triggers (AD-9/AD-10: `decided_by <> user_id`, `subject_user_id` trigger reading `bookings.user_id`, overlap trigger, FK RESTRICT) are only reviewable as a unit; SEED-1 (S00) needs all tables; migration ranges per slice would otherwise collide. Verdict: the exception is justified, but neither the epic text nor 1.4 states it, so a reviewer applying step-04 sees a violation. Fix: add to Epic 1 intro and 1.4: "Exception to the table-when-needed rule, by AD-19 and PIL-06: the schema is a frozen cross-slice contract reviewed by Jo at the checkpoint". Split 1.4 (see M11).

### M10. Foundation epic justification
Epic 1 is a technical milestone (21 of 65 stories, 14 of them "As a build agent"/"As the pilot owner" with no end-user value). Acceptable here because: greenfield with no starter template (AR1), PRD 4.0 and spine OQ5 enlarge S00 deliberately, and PIL-06 requires frozen contracts before parallel agents. The document should state it (as in M9) and mention OQ5 approval status ("Deviations from PRD 4.0: larger S00" needs Jo, spine line 398). Also Stories 1.18/1.19 are process tooling for the pilot experiment, not product; consider labelling them "Delivery controls" inside Epic 1 and confirming in OQ5 that Jo approved the enlarged S00.

### M11. Largest stories and suggested splits (top 5)
1. Story 1.4 (lines 444-469): db platform, migration runner (CRLF/LF/3 concurrent processes), six tables with all constraints and about 15 triggers, probe suite of 15 cases, UnitOfWork rollback/lock cases, EXPLAIN check. Split: 1.4a `openDatabase` + `UnitOfWork` + Clock-aware `Tx`; 1.4b migration runner + snapshot test; 1.4c schema + triggers + probe suite (this is the Jo checkpoint artefact).
2. Story 1.18 (803-828): ownership checker + merge gate + accept-slice + prototype replay; three scripts with git plumbing. Split: 1.18a `ownership.json` + `check-ownership` (incl. `--print-slice`, Freeze-Approved, add-only rule); 1.18b `merge-gate`; 1.18c `accept-slice`.
3. Story 1.19 (830-851): `requirements.json` generator, PRD cross-test, `trace.mjs` with 10 distinct exit-2 integrity checks and the release mode, manual-evidence rules. Split: 1.19a generator + PRD test; 1.19b `trace.mjs` default set and exit codes; 1.19c `--release` and manual evidence.
4. Story 1.17 (775-801): three responsive shell layouts, nine lazy routes with titles/focus management/skip link/landmarks, Mer sheet, offline alert, `QueryState`, session skeleton. Split: 1.17a shell layouts + nav; 1.17b router, titles, focus, 403 page; 1.17c `QueryState` + offline alert + session skeleton.
5. Story 4.10 (1437-1458): toolbar and week navigation, grid with today/now-line, four block kinds with content rules, popover, detail open, full ARIA grid keyboard model, "Ledige tider". Split: 4.10a toolbar + grid + blocks; 4.10b block interactions (detail sheet, popover, prefilled booking sheet); 4.10c keyboard model + "Ledige tider".
Near misses: 1.1 (13 custom lint rules with failing-fixture tests), 1.16 (nine modules), 5.1 (approve and reject, five error paths, races), 4.2 (four concurrency suites).

### M12. Vague or untestable acceptance criteria (examples)
- 1.2 "boundary functions are inclusive and strict as specified" (1.2 line 402), 1.3 "a reviewable summary ... is produced" (no content or location), 1.3 "recorded in `ownership.json` terms" (line 438), 1.13 "specified offset", 1.17 "page content leaves room for both bars".
- 4.11 "(`[VIS-01]` mobile reading, confirmed by Jo)" - a human confirmation inside an AC; 7.4 "any defect found is fixed or listed as residual work" and an undefined "checklist" (where, which items); 7.8 "no time or cost was saved by weakening tests" (a process claim); 6.1 "the response states nothing that implies the bar total equals `confirmedNext7d`"; 7.2 "this exercises ... for the first time"; 1.8 "the helper is the only way S02 and S03 tests authenticate" (needs a lint rule or test); 7.5's 200 ms threshold is invented (PRD NFR-06: "no formal load test"), acceptable if labelled a pilot target.

### M13. Epic 7 "adds no features" but fixes defects in files it does not own
7.4 ("any defect found is fixed"), 7.5 ("any slow query is fixed") would edit S04-S06 files, which `check-ownership` forbids for slice S07. Fix: 1.18/Epic 7: "S07 may edit any non-frozen file, each such commit carrying a `Fixes: N.M` trailer naming the owning story; frozen files need `Freeze-Approved`", and record this in `ownership.json` for S07.

### M14. Duplicate or contradictory responsibility statements
- "Avbestill"/"Book igjen": 1.15 says BookingRow itself shows them and takes actions from the slot; 4.8 says the slot hosts "Avbestill ... Book igjen"; 5.4 says "Book igjen is delegated to the host". Pick one: BookingRow renders Book igjen (S04 handler), BookingActions renders only Avbestill and (queue) approve/reject.
- Segmented-control persistence: 1.15 "inside `app/`-owned storage" vs 6.4 "try/catch storage" in a feature; `ui/` cannot reach `app/`. Decide: `SegmentedControl` takes an optional `storageKey` and uses guarded `localStorage` itself.
- 2.2 duplicates S00 (`UV_THREADPOOL_SIZE` is already set by 1.20's `start.mjs`).
- 3.4 "Opprett ressurs" action opens the Resource form sheet of 3.6 (forward reference inside S02; 3.4 depends only on 3.1). Fix: 3.4 depends on 3.6, or the action is a link `?ny=1` handled in 3.6/3.7.

---

## 4. Low

- L1. Index omits parts the PRD names: NFR-01@S00 and NFR-05@S00 (row 1.20), RES-04@S03 (see H12), so `requirements.json` generated from the Index and from PRD owner table can disagree; add a generator test "Index parts superset of PRD owner-table parts".
- L2. VIS-01@S03 and VIS-02@S03 (rows 4.3, 4.4) are parts the PRD does not define (owner S04); they are useful interim evidence but should be named `VIS-01(api)@S03` or explicitly allowed.
- L3. PIL-06 three-agent ramp gate ("only after the integration cost of two is judged") and PIL-07 per-story metrics are not in any AC; 4.5 AC 3 says S04, S05, S06 "may start independently". Add to 4.5: "Jo records the PIL-06 decision (two or three agents) in the pilot log".
- L4. Preconditions only in prose: Jo installs Node 24 (AR2; local Node is v25.9.0, outside the engines), Jo's approval to push/create the GitHub remote and run macOS minutes (PIL-11; AR28 says it exists now). Add to Epic 1 "Depends on".
- L5. UX-DR25 coverage lists no story for Avatar and Demo pill beyond 1.17/2.4; UX-DR17 "Stat tile" has no Owns (see M1).
- L6. Coverage-map line 287 "41 functional items": count is 40 functional items in the inventory plus the optional SEED-2; check the figure.
- L7. AR28 maps to 1.19, 1.20, 7.7, 7.8 but the macOS smoke is also 1.20 (H8); AR29 "axe helper on every UI story" mapped to 1.11, 4.2, 4.5 (no UI story).
- L8. Stories 1.1, 1.20 and 7.6 all assert the README start sequence; 7.6 re-verifies it, fine, but the README owner conflict is listed in M4.

---

## 5. Evidence for the requested validation areas

### 5.1 Coverage (MUST requirements and §4.7 evidence parts)

Delivered with real AC text (verified): AUT-01..04 (2.1-2.6), RES-01..05 (3.1-3.7), BOK-01..05, BOK-07, BOK-08 (4.1-4.13), BOK-06 and APP-01..04 (5.1-5.4), VIS-01..06 (4.x, 6.x), BR-1 (1.2, 1.5, 4.5), BR-2 (3.2, 4.1, 5.1), BR-5 (1.9, 3.2, 4.1, 5.1), BR-6 (2.3, 7.1), UI-1 for all eight pages (2.4, 3.4/3.5/3.7, 4.9/4.10, 5.3, 6.3/6.5), UI-2 (1.17, 7.4), UI-3 (axe ACs in every UI story, 7.4), SEED-1/2 (1.10), RUN-1 (1.20, 7.6), NFR-01 (1.20 CI, 7.7), NFR-02 (1.1, 1.20), NFR-04 (1.7, 1.8, 2.1, 2.2), NFR-05 (1.20, 7.6), NFR-06 (7.5).

Split evidence (PRD 4.7) check:
| Scenario | API part | Browser part | Verdict |
| --- | --- | --- | --- |
| E2E-01 | 4.5 (S03) | 4.13 (S04) | ok |
| E2E-02 | 4.2/4.5 (S03) | 4.13 (S04) | ok |
| E2E-03 | 4.2 (S03) | - | ok |
| E2E-04/05/06 | 5.5 (S05), incl. Expired and BOOKING_STARTED | 7.2 (S07) | ok |
| E2E-07 | 2.3 (S01), 3.2 (S02), 4.5 (S03), 5.5 (S05) | final sweep 7.1 | ok |
| E2E-08 | 3.2/3.3 (S02: create/edit/archive, guard), 4.1 (S03, tag missing, H12) | 7.3 | partial (H12) |
| E2E-09 | 5.1/5.5 (S05) | 7.2 | ok |
| E2E-10 | - | 7.4 | ok |

Gaps: H12 (UI-4, UI-5, BR-4 per slice; BR-3@S03 AC; E2E-08@S03 tag; RES-04@S03; NFR-03@S07; VIS-02 cancel half). BR-4 evidence for S01 (login 400 envelope) is also absent. Mentioned-only (not in an AC): UX-DR25 Avatar, UI-4 "unavailable" state outside 4.7 (archived resource); the PIL items PIL-06 gate and PIL-07 metrics (L3).

### 5.2 Dependency graph (from Index and AC text)

```
S00 (1.1..1.21 serial, one agent)
  1.1 -> 1.2 -> 1.3 ; 1.1,1.2 -> 1.4 ; 1.1,1.2 -> 1.5 ; 1.3,1.4,1.5 -> 1.6 -> 1.7 ; 1.4,1.6 -> 1.8, 1.9 ; 1.8,1.9 -> 1.10
  1.6,1.7,1.8,1.10 -> 1.11 ; 1.1 -> 1.12 -> 1.13 -> 1.14, 1.15 ; 1.1,1.3 -> 1.16 ; 1.13..1.16 -> 1.17
  1.1 -> 1.18 -> 1.19 ; 1.7,1.10,1.17,1.19 -> 1.20 ; 1.1..1.20 -> 1.21
S01: 2.1 -> 2.2, 2.3, 2.5 ; 2.1,2.2 -> 2.4 ; 2.4,2.5 -> 2.6          (gate: S00 accepted)
S02: 3.1 -> 3.2 -> 3.3 ; 3.1 -> 3.4, 3.5 ; 3.2 -> 3.6 ; 3.3,3.6 -> 3.7  (gate: S00 accepted)
S03: 4.1 -> 4.2, 4.3, 4.4 -> 4.5                                      (gate: S01 and S02 accepted)
S04: 4.6 -> 4.7 ; 4.8 ; 4.7,4.8 -> 4.9, 4.10 ; 4.10 -> 4.11 ; 4.12 ; 4.7..4.12 -> 4.13   (gate: S03 accepted)
S05: 5.1 -> 5.2, 5.3 ; 5.1,5.2 -> 5.4 ; 5.1..5.4 -> 5.5            (gate: S03 accepted)
S06: 6.1 -> 6.3 -> 6.4 ; 6.2 -> 6.5 ; 6.1 -> 6.3                    (gate: S03 accepted)
S07: 7.1..7.5 -> 7.6 -> 7.7 ; 7.1..7.7 -> 7.8                       (gate: S04, S05, S06 accepted)
```

Result: the declared graph is acyclic and numerically forward-only. True dependencies from AC text add: 1.4 -> 1.5, 1.6, 1.7 (H2); 1.12 -> 1.3, 1.16; 1.13, 1.14, 1.15 -> 1.16; 1.11 -> 1.16, 1.17; 1.17 -> 1.8 (H3); 1.18 -> 1.19 and 1.19 -> 1.18 (soft cycle, B2); 1.20 -> S01, S03 (smoke, H8); 3.4 -> 3.6 (M14); 3.5 -> 4.12 (H5, a later slice); 4.12 -> 4.7 (H5); 5.4 -> 4.8, 4.9 (H7); 4.5 -> contracts edit with no owner (H10).

S01 and S02 independence: genuine. S02 authenticates through `mintSession` and the Playwright session fixture (1.8, 1.11), uses `countFutureBlocking` (1.9), `recordEvent` (1.9); S01 uses seeded users; separate module directories; only shared-file risk is the barrels in M2. Their parallel merge, however, is broken by B1 and by the one ledger row per slice.

S04, S05, S06 depend only on the S03 gate: true in the Index; violated in AC text by 5.4 (H7), softened by unstated fixtures (M8), by the strip (H5) and by the BookingActions/host seam (H4). Epics 5 and 6 never need an S04 artefact for build or test once H7 is fixed.

### 5.3 File ownership

Conflicts found: `modules/bookings/routes.ts` (H6); `apps/web/src/api/sheet.ts`/`slots.ts` bodies owned by 1.16 and 4.7 (H4); `features/resources/detail` strip (H5); `packages/contracts` F2 files (H10); `app/**` and `api/**` behaviour in 2.5 (H11); `ui/` additions (M1); i18n/keys/invalidation barrels (M2); test helpers and e2e support (M3); README and `manual-evidence/` (M4); S07 fixes (M13).

Seam registration summary: `usePendingCount` is fully specified (stub 1.16, body 6.3 `api/keys/dashboard.ts`). `useBookingSheet` is partly specified (4.7 owns an `api/sheet.ts` body, which collides with 1.16 ownership and layering). `BookingActions`, the `?booking=` host and the availability strip have no S00 stub, no registration path and no frozen props AC (H4, H5). The hello-slice dry run (1.21) does not test seam replacement.

### 5.4 S00 checkpoint and bootstrap
See H1, H2, B2. The checkpoint is described but never a dependency; the bootstrap lacks a stated integration route, the planning fast-forward is in the wrong place (line 897 versus spine AD-20), and the gate's tools arrive after the stories they are meant to gate.

### 5.5 State model, quoting the governing text
- AD-26: "the **verification set**: the slices recorded in `acceptance-ledger.json` (state `integrated` or `accepted`) plus the slice in `FELLES_SLICE` when set. It exits 1 when an evidence part of a slice in the set has no passing test".
- AD-20: "builds a throwaway merge candidate on current main, runs `verify:full` with `FELLES_SLICE` set to that slice ... In the same push the gate adds the annotated tag `sNN-integrated` ... and one follow-up commit recording it in `acceptance-ledger.json` (`{ slice, state, sha }`".
- Amendment 1, "As applied": "The traceability check enforces every ledger slice plus the candidate (`FELLES_SLICE`)"; all 23 prototype scenarios are whole-slice candidates.
- Spine Consistency Conventions: "One story, one branch, one worktree".
Tagging, ledger and trace operate at slice granularity; branches, DoD and story ledgers at story granularity. The first story of any slice carries only a subset of its slice's evidence parts, so the slice-level verification set fails it (exit 1) and, after a forced landing, every other slice (B1). Per-story vs per-slice acceptance and the number of registries are addressed in H9.

### 5.6 Story quality
Sizes and splits: M11. Vague criteria: M12. Table creation: M9. Foundation epic: M10. Good practice observed: every story ends in testable Given/When/Then with named codes, axe ACs on all UI stories, API-level and browser evidence separated by slice, Expired/CR-3 semantics consistent with the PRD, route/state wording consistent with approved copy.

## 6. Recommended order of repair
1. Adopt the slice-branch rule and the S00 bootstrap paragraph (B1, B2): epics-only edits, no spine change.
2. Add the 1.4 checkpoint gate and fix S00 ordering (H1-H3).
3. Define seam entry files, strip slot, routes split, F2 ownership, smoke phases (H4-H6, H8, H10).
4. Rewrite 5.4, 2.5 (H7, H11); add evidence parts and ACs (H12); add the State model section (H9).
5. Medium and low items, then re-run step-04 and set `status: final`.
