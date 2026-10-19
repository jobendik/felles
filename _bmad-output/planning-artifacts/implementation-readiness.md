---
status: final
approved: 2026-10-19 (Jo, CONCERNS accepted; repairs 1-3 authorised)
date: 2026-10-19
verdict: CONCERNS
---

# FELLES implementation readiness (bmad-sprint-planning gate)

**Verdict: CONCERNS.** The plan can be built, but 3 small text defects should be fixed before Story 1.1, and 5 decisions are Jo's. No FAIL condition was found: no blocker, no forward dependency, no uncovered requirement. Nothing in the approved architecture or the story structure was changed.

## Inputs read
PRD (final), UX `DESIGN.md` and `EXPERIENCE.md` (final), architecture spine with Amendments 1-3 (final), `epics.md` (final: 7 epics, 76 stories plus Gate S00-CP), pilot log with its 14-item register, five validation reports (rounds 1-3). One fresh read-only verifier re-checked the six round-3 highs against the current text (101k subagent tokens, 174 s).

## Mechanical checks
- `sprint_plan.py generate` parses 7 epics and 76 stories. The 3 warnings are non-story headings (title, `Epic List`, `Story Index`). Output: `_bmad-output/implementation-artifacts/sprint-status.yaml` (83 backlog, 7 retrospectives optional); `validate` passes.
- The pilot-log mechanical results (57 requirement ids, 117 evidence parts, no forward or cross-slice dependencies) were not re-run; the Index was read again and showed nothing that contradicts them.

## Re-validation of the unverified repairs (register item 1)
| Finding | Result |
| --- | --- |
| 3a H1 default ownership rules | **Partial.** Colocated test, `*Page.tsx` and contract-test defaults exist. Still prose Owns cells with no default: 1.1 "root configs", 1.6 snapshot harness, 1.7 probe suite, 1.20, 1.26 Vitest helper, 1.28, 1.30 and 7.8 documents, and the "S01/S03/S05 API tests" cells. The 3a-proposed `apps/api/test/<slice>/**` convention was not adopted, so the Story 1.22 "every path owned exactly once" test would fail. `features/resources/` has no folder-level owner for `*Page.tsx` or its seam stub. |
| 3a H2 BookingsReadPort | **Partial.** The port itself is fixed (S06-owned stub file, re-exported). New: Story 1.11 lists `bookings.presenter.ts` without `(stub)` while Story 4.1 owns it (epics.md l.2352 and l.2385, confirmed). That is two owners and an S03 edit to an S00 file. |
| 3a H3 `--release` main-only commits | **Partial.** The allowance exists, but 1.21 and 1.22 write `pilot-log.md` while the file is `_bmad-output/pilot-log.md` (l.908, l.931, confirmed). A literal path check would reject it. `_bmad-output/evidence/trace.json` and the "integrator commit" lockfile rule are not in the allowed set, and no story performs that integrator commit. |
| 3a H4 stub-asserting tests | **Partial.** The rule exists (l.941) but was not applied: 1.27 AC1 still asserts nine routes "render stub pages", which breaks when S02 delivers a real page. 1.26 AC4 needs an injected pending count because `usePendingCount` is a `null` stub. |
| 3b H1 "Gammel projektor" archived | **Closed.** It is active with no future bookings; an archived "Gammelt lydanlegg" exists; agrees with Flow 6. |
| 3b H2 seed vs flows | **Closed** for every story criterion. Medium residue: EXPERIENCE text that no AC asserts (Flow 1 "no upcoming bookings", Flow 2 row order, Flow 3 pill count 3 vs 4) disagrees with the seed; "history stays" has no past booking to show; "8 resources" vs "nine" is ambiguous for the `[SEED-1]` count test. |

None is a blocker. All are epics-text defects of the kind earlier rounds kept finding, which agrees with register item 10.

## Findings by concern
**Fix before Story 1.1 (epics text only, no architecture change)**
1. Tag `bookings.presenter.ts` `(stub)` in the 1.11 row. Extend the Owns cells and default rules in Story 1.22 so every path has an owner (adopt `apps/api/test/<slice>/**`, folder owners for `features/resources/`, root configs, snapshot harness, probe suite, document cells).
2. Use the real path `_bmad-output/pilot-log.md` in 1.21 and 1.22. Add `_bmad-output/evidence/**`, the pilot log and the lockfile case to the `--release` allowed set, or state that `trace.json` is not committed, and name the story that performs the integrator commit.
3. Rewrite 1.27 AC1 and 1.26 AC4 so their tests inject a page component and a pending count, rather than asserting stubs.

**Tracking gaps in the installed workflow (decide with Jo)**
4. Gate S00-CP (l.534) requires sprint-status to carry `gate-s00-cp` and S00 stories to stay `blocked`. The installed vocabulary has no `blocked` and the script does not emit a gate key. Options: keep the gate in the ledger and pilot log only (recommended: sprint-status stays a clean story registry; stories stay `backlog` until Jo opens the gate); or add `gate-s00-cp` as a custom key via `--set` plus a documented convention. Do not invent `blocked` unless Jo wants to customize the skill.
5. `## Epic List` (l.304) is empty (a stray `#`). Harmless to the parser; cosmetic fix.

**Accepted risks carried forward (register items 3-14, status unchanged except as noted)**
- Items 2, 13, 14 remain decisions for Jo (Gate S00-CP texts and `start > now`; macOS smoke; push approval).
- Item 4, 6: CI exists only from Story 1.29. Item 5: stories 1.26 and 1.27 should be run as one session or in this order with their Playwright criteria noted; the typeface offline assertion needs a named owner (suggest Story 1.14 agent, per the register).
- Item 7, 9: low and medium findings stay in the round reports; this assessment found no new low-severity ones worth triage now.
- Item 8, story sizes: **recommendation, not applied.** Keep the 76 as approved. Treat 1.13, 1.24, 1.30, 5.1 as "watch" stories (record wall clock per PIL-07 and split only if an agent session overruns). Splitting before evidence would repeat the over-planning the log already documents.
- Item 11: local Node is v25.9.0; architecture needs Node 24 LTS before Story 1.1.
- Item 12: the fast-forward of `planning/felles` into `main` is not performed.

## Proposed implementation sequence
1. **Pre-S00 (Jo):** approve this assessment; decide items 4 above; install Node 24; give push approval (PIL-11); instruct the fast-forward into `main`.
2. **Repair pass (optional but recommended, one short pass):** findings 1-3, then a mechanical re-check. Independent re-validation is not recommended again; the first real gate run (1.30) tests these rules.
3. **S00 (1 agent, `slice/s00`):** 1.1 to 1.7, then **Gate S00-CP (Jo)**, then 1.8 to 1.29 (suggested order 1.8-1.12 API; 1.13-1.17 web kit; 1.18-1.25 verification and delivery tooling; 1.26-1.28 shell, together; 1.29), then 1.30 dry run and freeze package. Jo accepts S00.
4. **S01 and S02 in parallel** (6 and 7 stories). Critical path runs through S02.
5. **S03** (4.1-4.5), needs both accepted.
6. **S04, S05, S06 in parallel** after `s03-accepted` (S04 is 10 stories and the longest; S04's availability strip also needs S02).
7. **S07** (7.1-7.8) after all three accepted; release gate and Jo's final acceptance.

Epic 4 contains both S03 and S04 stories and Epic 1 is the whole of S00, so epic-level `in-progress` and `done` in sprint-status will lag slice acceptance by design (stories become `done` only at slice acceptance).

## Decisions requested from Jo
- Approve CONCERNS and the repair pass 1-3 (or proceed unchanged).
- Choose option for gate S00-CP tracking (recommend ledger/pilot-log only).
- Confirm "watch, do not split" for the large stories.
- Existing: Gate S00-CP texts, macOS smoke, push approval, fast-forward timing, Node 24.

## Resolution (after Jo's approval, 2026-10-19)

Jo approved CONCERNS and decided: (1) Gate S00-CP is tracked in the pilot log and later in the delivery ledger; sprint-status vocabulary is not customised; the agent stops at the checkpoint until Jo explicitly approves; (2) the 76 stories stay, with the large ones monitored and splits proposed only if implementation shows a need; (3) repairs 1-3 applied to `epics.md` only.

| Repair | Applied |
| --- | --- |
| 1 Ownership | `bookings.presenter.ts` tagged `(stub)` in Story 1.11 (S03 owns it, Story 4.1); prose Owns cells replaced by globs (1.1, 1.6, 1.7, 1.18, 1.20, 1.26, 1.28, 1.30, 7.8); API tests under `apps/api/test/<slice>/**` (2.3, 2.5, 4.2, 4.5, 5.5); `packages/contracts/test/**` owned; Story 1.22 default rules extended (feature-folder root files, slice test folders, contract tests, lockfile) |
| 2 Permitted paths | Real path `_bmad-output/pilot-log.md` plus `_bmad-output/evidence/**` in the `--release` allowed set (1.21) and the main-only list (1.22); the "integrator commit" for the lockfile was replaced by the existing `Freeze-Approved:` trailer, and lockfile changes after the cited commit are not allowed at release |
| 3 Stub tests | 1.27 AC1 injects a test page per route; 1.26 AC4 injects the pending count; default rule says tests of S00 code inject collaborators |
| Gate S00-CP | Gate AC, Story 1.23 and backfill now use the pilot log and ledger; no `gate-s00-cp` key, no `blocked` status |

**Focused consistency check:** `sprint_plan.py` dry run: 7 epics, 76 stories, in sync, no orphans. A script over the 76 Index rows lists only intended multi-slice paths (S00 stubs for later owners, the three S03 contract drafts, `README.md` by rule); `bookings.presenter.ts` is now a tagged stub. Grep finds no remaining `gate-s00-cp`, `blocked`, "integrator commit", bare `pilot-log.md` in a path set, or prose Owns cells from the report. Not independently re-validated (the stopping rule stays "no blockers"; the first real gate run in Story 1.30 is the test).

**Open for Jo at or before S00:** register items 2 (Gate S00-CP copy and `start > now`), 11 (Node 24), 12 (fast-forward), 13 (macOS smoke), 14 (push approval). Medium finding left open: EXPERIENCE flow text disagrees with the seed in places no AC asserts (Flow 1-3 counts and order).
