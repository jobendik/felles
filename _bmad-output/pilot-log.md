# FELLES pilot log

Lightweight record of the BMad pilot (PRD §7, PIL-07). One section per phase. Facts first, interpretations separately. Numbers come from Git timestamps, memlog timestamps and the Claude Code harness notifications; anything not measured is written as `unknown`. Times are Europe/Oslo.

Conventions: *Human interventions* = messages or decisions from Jo. *Rework* = changes to an artifact after a review or a check found a defect. Token figures for subagents are the harness-reported `subagent_tokens`; main-session usage is read from the harness budget counter and is approximate; cost is `unknown` throughout.

---

## Phase A1 — Product requirements (bmad-prd) · 2026-10-18 → 2026-10-19

### Facts
- **Wall clock:** project setup committed 2026-10-18 21:48 (`a85f769`); PRD finalized and committed 2026-10-19 09:40 (`ae5dcb2`). Active working time inside that span: `unknown` (not logged at the time; the PRD memlog's last update is 09:38 on 2026-10-19).
- **Artifacts:** `prd.md` (final), `addendum.md`, `reconcile-requirements.md`, `review-rubric.md`, `review-rubric-2.md`, `review-consistency-audit.md`, `.memlog.md` (21 entries) under `_bmad-output/planning-artifacts/prds/prd-felles-pilot-2026-10-18/`.
- **Reviews and rework:** rubric review twice; a consistency audit found 40 discrepancies (1 critical) against `docs/requirements.md`; a MUST-by-MUST reconciliation checked 61 items; structure/prose polish. The PRD was revised after each pass.
- **Human interventions and decisions:** Jo revised DEC-19 so that `docs/requirements.md` Part A stays authoritative and changes need a registered CR; Jo decided CR-1 (rejected weakening NFR-01), CR-2 (approved option a), CR-3 (approved with modification: the only product change), CR-4 (approved, original preserved); DEC-11/12/16 approved in principle pending architecture.
- **Problems:** the first PRD draft had the PRD "winning" over the spec; a human override reversed it. Six open questions were deferred (OQ-1…OQ-6).
- **Agent runs / tokens / cost:** `unknown` (not recorded during this phase).

### Interpretations
- The requirement-change register (§9.1) and the consistency audit were the mechanisms that caught drift from the Norwegian spec; both cost a review cycle each but produced the only approved product change (CR-3) in a traceable form.

---

## Phase A2 — UX design (bmad-ux) · 2026-10-19

### Facts
- **Wall clock:** brief received and workflow started about 09:40 (session start; workspace and memlog created 09:48); spines, mocks, reviews and polish finished 10:46; presented for review; Jo's approval and finalization 10:53. About 1 h 15 min end to end, of which roughly 1 h 05 min before presentation.
- **Mode:** Create, fast path (Jo not available turn by turn); gaps resolved as recommended defaults and listed for approval. Creative tools used: colour themes (1 page, 4 variants), design directions (3 files), key screens (8 files). Design handoff (Google Stitch) not used.
- **Artifacts (32 files, 1.3 MB):** `DESIGN.md` (about 4,700 words), `EXPERIENCE.md` (about 6,500 words), `mockups/` (index + 8 screens, each at 1440px and 375px with alternate states), `.working/` (content pack, base CSS, 4 colour themes, 3 directions, raw mocks), `reconcile-brief.md`, `review-rubric.md`, `review-accessibility.md`, `review-editorial.md`, `validation-report.html` + `.md`, `.memlog.md` (49 entries).
- **Subagent runs:** 11. Durations and reported tokens: colour themes 100 s / 68,665; design directions 309 s / 100,011; key screens 4 runs of 109–212 s / 72,216 + 89,179 + 86,084 + 93,178; rubric walker 416 s / 141,679; accessibility review 550 s / 307,403; structure lens 278 s / 96,999; prose lens 343 s / 100,897. Subagent total about 1.16 M tokens. Main session about 0.44 M tokens by the harness budget counter (approximate). Cost: `unknown`.
- **Reviews:** rubric walker (0 critical / 3 high / 12 medium / 27 low), accessibility lens (0 / 3 / 12 / 12), bmad-review structure (20 recommendations) and prose (32 findings). Jo reviewed the mocks and approved.
- **Rework after checks:** `ink-muted` darkened after a renderer flagged it fails 4.5:1 as text; availability strip recoloured from green to neutral after the screenshot check; sidebar footer layout patched in base CSS and 8 mocks; after the two reviews: Booking detail sheet and Date field specified, in-flight buttons changed to `aria-disabled`, on-dark toast tokens, non-colour cues for active navigation, slot picker 30-minute semantics and ARIA grid model, Popover/Tooltip/archived badge added, Norwegian names for symbols and colours, required-field convention, scroll padding, dialog rule unified, Flow 0 and a calendar variant added; after the editorial pass both spines were rewritten in full (components regrouped, four patterns moved into subsections, one home per rule).
- **Human interventions:** 2 (the phase brief; the approval message). Decisions taken by Jo: direction Rolig SaaS + theme Fjord, mobile tab bar with Mer sheet, week strip + single-day timeline as the 375px reading of VIS-01; the other five defaults accepted with the approval.
- **Problems and bottlenecks:** the Bash tool failed three times on long heredocs on Windows ("unexpected EOF while looking for matching `''"); worked around by writing scripts and content with the Write tool. `pyyaml` was not installed, so frontmatter validation used a regex-based check (45 token references, all resolving). Mock renderers do not view their output; a headless Chrome screenshot pass was added to check all mocks visually and caught two defects (footer wrap, green availability strip). The mocks still show 32px row actions on mobile, which the spines later raised to 40px; they are marked as illustrations and were not re-rendered.
- **Requirement changes:** none. CR-3 items (4) and (5) implemented as approved; VIS-01 mobile reading confirmed by Jo.

### Interpretations
- The two parallel reviewer lenses (rubric + accessibility) consumed about 40% of the phase's subagent tokens but produced the two highest-value fixes (an unspecified Booking detail sheet and an unspecified date control), both of which a developer would otherwise have invented.
- Rendering alternatives (4 themes, 3 directions) cost about 170 k tokens and 7 minutes and made the approval a one-message decision; it seemed worth it for a phase that needs a human yes.
- The editorial polish (structure + prose) was the most expensive step relative to its visible effect; it improved locality and naming consistency rather than content. A fair evaluation should check whether downstream agents actually benefit from it.
- Writing the base stylesheet once and having four mock renderers inline it kept eight screens visually consistent without a shared component library; that pattern seems reusable.
- The fast path with recommended defaults worked because the brief fixed the posture and the spec fixed the screens; a less constrained product would have needed the coaching path and more human turns.

---

## Phase A3 — Technical architecture (bmad-architecture) · 2026-10-19

### Facts
- **Wall clock:** workflow started 11:04 (Europe/Oslo). First working segment 11:04 to about 11:35 (inputs, three spikes, spine v1, eight parallel reviewers launched about 11:17 and all back by about 11:30). The session then stopped on the platform usage limit and resumed at 14:31; second segment 14:31 to 14:43 (spine v2, fix-verification, patches, brief). A third segment began when Jo approved and asked for a focused consistency check, ran to about 15:46 and ended with finalisation and the commit. Working time about 2 h in total, including the reviewer waits; the 3 h gap is not working time. Jo's approval message arrived about 14:50.
- **Mode:** Create, fast path (Jo not available turn by turn); gaps tagged `[ASSUMPTION]` and listed for approval. Purpose: build-substrate spine plus a one-page approval brief.
- **Artifacts** (`_bmad-output/planning-artifacts/architecture/architecture-felles-pilot-2026-10-19/`): `ARCHITECTURE-SPINE.md` (28 decisions, about 8,600 words, `status: final`), `APPROVAL-BRIEF.md` (about 1,000 words), `approved-copy.md` (approved decisions and Norwegian copy), `reviews/` (10 reports), `.memlog.md` (87 entries). No application code, remote or orchestrator configuration was created.
- **Spikes (no repo files):** better-sqlite3 13.0.3 install and load on Windows (2 s, prebuilt, Node 25.9); overlap trigger, adjacency and cross-process `BEGIN IMMEDIATE` wait; scrypt cost at four parameter sets; Oslo wall-clock conversion around both DST switches. All behaved as designed; a first run of the race spike had its ordering wrong and was fixed.
- **Subagent runs:** 10. Durations and reported tokens: reconcile requirements+PRD 201 s / 101,812; reconcile UX 277 s / 128,219; reconcile process 263 s / 97,737; rubric walker 364 s / 152,834; version check 602 s / 106,776; adversary 129 s / 71,351; security 183 s / 77,626; data integrity 639 s / 158,230; fix-verification 463 s / 236,648; final consistency check 387 s / 122,830. Subagent total about 1.25 M tokens. Main session about 0.42 M tokens by the harness budget counter (approximate; the counter was reset by the session break). Cost `unknown`.
- **Reviews:** requirements+PRD (86 rows: 64 ok, 9 weakened, 13 silent-risk, 0 contradicted); UX (0 critical, 5 high); process (2 critical, 10 high); rubric (0 critical, 7 high); versions (0 critical, 4 high); adversary (14 pairs: 4 blockers, 6 high); security (0 critical, 3 high); data integrity (0 critical, 6 high, with a 38-probe trigger suite). Fix-verification of v2: 123 rows, 92 closed, 18 partial, 10 open, 3 deferred-ok, no critical; 35 patches applied afterwards. Final consistency check requested by Jo: 49 findings (3 blocker, 17 high, 17 medium, 12 low), all textual; 65 patches applied in one pass and the spine re-linted clean.
- **Rework after checks (all from reviews):** scrypt memory limit (would throw on every login, reproduced); `@hookform/resolvers` 6.0.0 install failure and ESLint 10 vs jsx-a11y peer conflict (pins changed to 5.9.2 and ESLint 9.39.5); TypeScript held at 6.0.3; helmet defaults that break Safari; trigger gaps (history rewritable, `INSERT OR REPLACE` bypass); `busy_timeout` freezing the API; CRLF breaking migration checksums on Windows; undefined semantics for Expired, decision columns, activity events and list ordering; unowned shared files and seams for S01∥S02 and S04∥S05∥S06; throttle bypass by parallel requests.
- **Human interventions:** 3 messages from Jo (the phase brief; "continue" after the usage-limit stop; the approval with the instruction to run a focused consistency check, finalise and commit). Decisions: Jo approved the six recommended architecture decisions and the architecture direction (DEC-11/12/16 closed under OQ-6). The Norwegian copy and error texts I proposed were approved by that blanket approval, not reviewed string by string; they are recorded in `approved-copy.md` and the memlog.
- **Problems and bottlenecks:** platform usage limit stopped the run for about 3 h; the first memlog batch write was rejected by the tool (extra parameter) and had to be resent; the spine lint flagged JSON braces as template tokens; the first draft of the approval brief overstated the finding count and was corrected before presenting; a reviewer reported the memlog "not in the folder" (dotfile) and could not use decision history.
- **Requirement changes:** none proposed. DEC-11 and DEC-12 confirmed with refinements; DEC-16 confirmed with extensions that need Jo (statuses 421/429/500/501/503, new codes, activity `before` cursor).

### Interpretations
- The first draft was concise and internally tidy but could not have worked as written: running it (scrypt, trigger bypass, busy timeout, install ranges, CRLF) found more defects than reading it did. The spikes and the two lenses that executed code (versions, data integrity) produced the findings with the least doubt.
- The process and adversary lenses found the same root cause from two sides: the spine fixed mechanisms but left the meaning of shared data to S00. Closing it grew the spine from 26 to 28 decisions and about 7,900 words, which is long for a "terse" spine; whether downstream agents use the extra detail is the thing to check.
- Parallel review was cheap in elapsed time (about 11 min for eight reviewers) but costly in tokens (about 0.9 M) compared with the writing itself; the second-pass fix-verification (about 0.24 M) still found 10 open and 18 partial items, so a single review round would have left real gaps.
- The brief's autonomous posture held up: every judgement call became either a logged decision or an item for Jo.
- The final consistency pass found 3 blockers that were introduced by the earlier patches themselves (web import rules, cancel/approve check order, split ownership of session files). Patching reviewer findings without a re-read of the whole document created new contradictions; a verification pass after patching looks necessary, not optional.

---

## Phase A4 — Epics and stories (bmad-create-epics-and-stories) · 2026-10-19 (in progress)

### Facts
- **Start:** 16:05 (Europe/Oslo), after Jo connected the repository to `https://github.com/jobendik/felles` (both branches pushed: `main` `a85f769`, `planning/felles` `7978ac5`; secrets scan of 290 tracked files found nothing).
- **Human intervention 1:** Jo's brief to start the workflow and to check an inconsistency raised by an independent review of the committed architecture (AD-20 / AD-26 / AD-27, phase-specific verification versus `verify:full --through S07` in the merge gate).
- **Check result:** confirmed. AD-27 embeds `trace.mjs --through S07` in `verify:full`, AD-20 has the merge gate run `verify:full`, AD-26 says the gate passes the candidate's slice. Read literally the gate would refuse every merge before S07, and CI would be red on every early commit. A second defect in the same text: "at or before `<slice>`" is a numeric order although S01/S02 and S04/S05/S06 are parallel; a third: no home for "accepted slices" because `ownership.json` is frozen. Proposal `AMENDMENT-1-proposal.md` (accepted-evidence tracing by `sNN-accepted` tags, `verify:release` for the S07 run) written; architecture unchanged until Jo approves.
- **Human intervention 2 (about 16:08):** Jo approved Amendment 1 in principle, confirmed the input list exactly as proposed, and asked for two checks before applying it: fail-closed behaviour when `FELLES_SLICE` or tags are missing, and how accepted-slice tags work with `planning/felles`, `main` and GitHub Actions, tested against five named scenarios.
- **Verification of the amendment:** a throwaway prototype of the gate logic (scratchpad, 23 scenarios on a temporary Git repository) passed all scenarios, including shallow clone, missing and rogue tags, tag off the history, empty set, missing ledger, skipped tests, parallel S01/S02 and the release gate. Two design changes came out of the analysis: slices are enforced from the moment they are integrated (merge precedes acceptance), and a committed `acceptance-ledger.json` is the fail-closed floor with annotated tags as the integrity anchor. Applied to AD-20, AD-26, AD-27; AD ids unchanged; details in `AMENDMENT-1-proposal.md` ("As applied"). The real `trace.mjs` and a real Actions run remain to be verified in S00.
- **Workflow state:** skill activated and step 1 read; no `epics.md` created yet; no epics or stories derived.
- **Observation about the installed skill:** step 1 searches `{planning_artifacts}/*prd*.md` and `*architecture*.md`; the artifacts produced by `bmad-prd` and `bmad-architecture` live in subfolders (`prds/prd-*/prd.md`, `architecture/architecture-*/ARCHITECTURE-SPINE.md`), so the documented patterns match neither. The bmad-ux pair is found. `_bmad-output/implementation-artifacts/` does not exist yet.

### Interpretations
- The defect survived my own consistency pass and the 8-lens review because each AD read correctly alone; it only appears when three ADs are composed into one gate. An independent reader found it in minutes, which supports keeping an independent review at the end of each phase.

---

## Next phase

Architecture is final and committed. Next: `bmad-create-epics-and-stories` (BMad catalog: architecture is followed by epics and stories). `bmad-spec` is the skill's optional adoption step and is not required for this pilot. OQ-1…OQ-5 stay deferred; OQ-6 is closed by this phase. Before S00: Jo installs Node 24 LTS.
