# Sprint Change Proposal: Amendment 4 — slice-owned build records versus main-only bookkeeping

Date: 2026-10-20
Author: planning worker (`bmad-correct-course`, batch mode), authorised by Jo on 2026-10-20 for this scope only
Status: **Approved by Jo on 2026-10-20 (D1-D9) and applied** to `epics.md` and `ARCHITECTURE-SPINE.md` (planning PR; Jo reviews and merges it personally). D7: planning amendments may use this PR route, slice PRs still use the merge gate. D8 approved. D9 added as B3 below. D4 is kept as the restore-and-report rule, with no `skip-worktree`. The proposal text below is the record; sections 3.3 and 5 carry the final wording of D4 and the safe naming procedure.
Follows: AMENDMENT-1 to AMENDMENT-3 (`architecture/architecture-felles-pilot-2026-10-19/`).
Scope classification: **Minor** (text changes to two planning documents; no story added, removed or re-sequenced; no architecture decision changed).

---

## 1. Issue summary

The installed `bmad-build` workflow (the approved per-story implementation workflow) writes, under `{implementation_artifacts}` = `_bmad-output/implementation-artifacts/`:

| Written by bmad-build | Name it uses | Source |
| --- | --- | --- |
| Story specification | `spec-{slug}.md`, slug led by the story key, e.g. `spec-1-8-route-registration-kernel-with-stubs.md`; `-2`, `-3` appended on a name clash | step-01 (spec file), step-02 |
| Epic context cache | `epic-<N>-context.md`; valid only if it exists, starts `# Epic <N> Context:` and no planning file is newer | step-01 (epic context) |
| Deferred work | one file, `deferred-work.md`, appended by *Split* and by the review *defer* route | step-01, step-02, step-04, step-oneshot |
| Sprint sync | edits `sprint-status.yaml` at `in-progress` and `review` (`sync-sprint-status.md`) | step-03, step-05, oneshot |
| Review prompts (only when no subagent can be launched) | transient prompt files "under `{implementation_artifacts}`", unnamed | step-04, oneshot |

The planning baseline treats the whole folder as main-only: Story 1.22 (epics.md l.931), the release rule in Story 1.21 (l.908), the story ledger files of Story 1.23 (l.967, Index l.2364), `s00-freeze-package.md` (Index l.2371), `s07-evidence-pack.md` (Index l.2417), and AD-20 in the spine ("Slice branches never edit `sprint-status`, other stories or `pilot-log.md`; the ledger is written on main"). Once the ownership check exists, every `bmad-build` story record committed on a slice branch fails it, and a branch that cannot commit its own story record cannot pass `npm run verify`. Stories 1.1 to 1.7 were built without `bmad-build`, which is why this surfaced only now (pilot-log Decision A, Decision C).

Issue type: misunderstanding of a tool contract (the planning baseline did not know the installed workflow's output files). Evidence: the skill files cited above, and the grep of every mention in section 6.

## 2. Impact analysis

**Epics.** Epic 1 only, through Stories 1.21, 1.22, 1.23 and the Index text. Epics 2 to 7: no story text changes; their stories get their `bmad-build` records under the new rule.

**Stories.** 1.21 (release rule), 1.22 (classification, default rules, new test case), 1.23 (ledger location). No story is added or removed (the 76-story count and sprint-status keys do not change).

**Artefacts.** epics.md (front matter list, Stories 1.21, 1.22, 1.23, Index intro, Registries bullet, Story 1.23 Index row) and the spine (AD-20 one sentence, Conventions Git row). PRD: **no change** (PIL-04 places the sprint-status file in `_bmad-output/implementation-artifacts/`, which stays true). UX: none. Amendments 1 to 3 are approved records and stay as they are; this proposal is the Amendment 4 record. Readiness report and `reconcile-process.md` are historical and stay as they are.

**Technical impact.** `check-ownership.mjs` and the `ownership.json` generator of Story 1.22 get three more pattern families. Nothing else in the gate changes (section 5).

## 3. Recommended approach: Direct Adjustment, with a naming convention and no skill edit

Rollback of Stories 1.1 to 1.7 is not needed (they have no `bmad-build` records). Reducing the scope is not needed. Customising `bmad-build` itself is avoided: every rule below is satisfiable by file naming plus a worker instruction, and the ownership check fails closed if a worker forgets. Effort: low. Risk: low. Timeline: none beyond the review of this document.

### 3.1 Settled point 1 — exact path patterns

All paths below are relative to the repository root. `D` = `_bmad-output/implementation-artifacts`.

**Slice-owned (committed on the owning slice branch)** — generated into `ownership.json` from the Story Index (story to slice) and listed here as ownership-default rules in Story 1.22:

| Pattern | Owner | Notes |
| --- | --- | --- |
| `D/spec-<E>-<M>-*.md` for each story E.M of the Index (76 entries) | the slice of Story E.M | `bmad-build` names the spec after the story key, so `spec-1-8-…`. The hyphen after `<M>` keeps `spec-1-1-*` from matching `spec-1-10-…`. A `-2` suffix still matches. |
| `D/epic-<N>-context.md` (7 entries) | the slice of Story N.1: Epic 1 → S00, 2 → S01, 3 → S02, 4 → S03, 5 → S05, 6 → S06, 7 → S07 | See 3.2 for Epic 4. |
| `D/deferred-work-s<NN>.md` for NN = 00 to 07 (8 entries) | slice S<NN> | See 3.2. |

**Main-only (never committed on a slice branch; written only on `main` by the bookkeeping worker or `scripts/`)** — classified by `check-ownership.mjs`, not by `ownership.json`:

| Pattern | Notes |
| --- | --- |
| `D/sprint-status.yaml` | |
| `D/ledger/**` | story ledger files of Story 1.23 (new location; today the story only says "under `D/`") |
| `D/s00-freeze-package.md`, `D/s07-evidence-pack.md` | Index rows 1.30 and 7.8, already named |
| `_bmad-output/pilot-log.md`, `_bmad-output/evidence/**`, `acceptance-ledger.json` | unchanged |
| **everything else under `D/**`** | including the unsuffixed `D/deferred-work.md`, review-prompt scratch files and anything a tool invents. This is the fail-closed fallback. |

**Precedence (removes the ambiguity):** a path is first matched against the slice-owned entries above (most specific glob wins, as today); if none matches, the main-only rules apply; if none matches, the path is frozen or another slice's, as today. Consequently the ledger files, the freeze package and the evidence pack cannot be mistaken for build records, because none of them starts `spec-`, `epic-` or `deferred-work-s`.

**Unchanged and explicitly out of scope:** `_bmad-output/planning-artifacts/**` keeps the `planning` slice behaviour of Stories 1.20 and 1.22; `_bmad/**` stays unlisted (so frozen).

### 3.2 Settled point 2 — single-owner conflicts

**`deferred-work.md`.** A shared file appended to by parallel slices (S01 ∥ S02; S04 ∥ S05 ∥ S06) would be owned by several slices, and it would also give textual merge conflicts at the gate. Smallest rule: **one file per slice, `deferred-work-s<NN>.md`**, same entry format, owned by that slice. This needs **only a naming convention in the worker brief**, not a `bmad-build` customisation: the entry format is unchanged and only the path in the brief differs ("wherever the workflow says `deferred-work.md`, use `deferred-work-sNN.md`, NN from the branch name `slice/sNN`"). The unsuffixed `deferred-work.md` is main-only, so a worker that forgets fails the ownership check naming the file; it then moves the entries and restores the file. Alternative (not recommended): a `persistent_facts` entry in `_bmad/custom/bmad-build.toml` carrying the same sentence; it removes reliance on the brief but adds a frozen `_bmad/**` file that must reach every slice branch before it starts.

**`epic-4-context.md`.** Epic 4 spans S03 (4.1 to 4.5) and S04 (4.6 to 4.15). Rule: **an epic's context file belongs to the slice of its first story (N.1), so `epic-4-context.md` is S03's.** S04 depends on `s03-accepted` and branches from `main` after it, so the file is already on `main` when S04 starts. `bmad-build` caches it by "no planning file is newer"; on a fresh checkout file times are not reliable, so S04's `bmad-build` may judge the file stale and recompile it. Rule for the S04 worker: use the file as context, never commit a change to it (`git restore` it before a story commit, like `sprint-status.yaml`); if it believes the content is truly out of date it reports that, and the refresh is made by a main-only bookkeeping commit or an S03 follow-up as Jo decides. Naming convention plus worker instruction; no customisation. Alternatives considered: per-slice context file (`epic-4-context-s04.md`) needs a `bmad-build` customisation because the cache path `epic-<N>-context.md` is fixed in the workflow; making all epic contexts main-only is simpler for ownership but removes the committed record Jo asked for.

Epics 1, 2, 3, 5, 6, 7 each have one slice, so they have no conflict.

### 3.3 Settled point 3 — the sprint sync on slice branches

**Confirmed as the rule**, with one clarification: the sprint sync is allowed to write the working copy of `sprint-status.yaml` (so `bmad-build` can resolve the story key and see its own transition), and **within `bmad-build` step 5, after the sprint sync and before the commit, the worker restores only that file** (`git restore --source=HEAD -- _bmad-output/implementation-artifacts/sprint-status.yaml`), then stages the story's files by explicit path and commits; no `skip-worktree`, no `git add -A`, no `git commit -a`. The worker reports each transition (`in-progress`, `review`) with `ao report`; the bookkeeping worker applies it on `main`, and from Story 1.23 `scripts/ledger.mjs status` does it. The branch copy of the file is therefore a stale read-only reference; a stale value is harmless because `bmad-build` resolves the story by key and stops when the story is already at or beyond the target. `skip-worktree` and ignore rules were considered and rejected by Jo (D4): they hide drift from `git status`.

Spec `status` frontmatter (`draft` to `done`) is the workflow's own working state and is **not** delivery status (PIL-04). A spec may say `done` while sprint-status says `review` until `accept-slice.mjs`; section 4 adds one sentence so nobody reads it as a second registry.

### 3.4 Settled point 4 — merge gate and `--release`

**Merge gate.** No change to `merge-gate.mjs` or its stories. A slice candidate now contains its own `spec-*`, `epic-*-context.md` and `deferred-work-sNN.md` changes; the ownership check maps them to the slice, so the candidate still spans exactly one slice and passes. A candidate that contains a main-only path (sprint-status, ledger, pilot log, evidence, the unsuffixed `deferred-work.md`) still fails naming the file. Because slices never share a build-record path, landing two slices from the same `main` produces no textual conflict. The files then sit on `main` under their slice's ownership; later slices may read them. `accept-slice.mjs` and `ledger.mjs` are unaffected (they run on `main` and touch only main-only paths).

**`--release`.** The allowed set after the cited commit is currently `manual-evidence/**` plus the main-only list, which includes `D/**`. With slice-owned build records the rule is restated so the allowance does not rely on the word "main-only": it allows `manual-evidence/**`, the main-only paths, **and** the slice-owned build records (`D/spec-*.md`, `D/epic-*-context.md`, `D/deferred-work-s*.md`). Reason: none of these affects what was tested, and the S07 worker also uses `bmad-build` (for example a Story 7.8 spec written after the tested commit). The lockfile and dependency-file ban is unchanged.

## 4. Settled point 5 — the full list of text changes

Nothing else changes. Old text is quoted from the current files (line numbers as of `b51a4d5`); anchor on the quoted text, not the number.

### A. `_bmad-output/planning-artifacts/epics.md`

**A1. Front matter list (l.12).** After the AMENDMENT-3 line add:
`  - _bmad-output/planning-artifacts/architecture/architecture-felles-pilot-2026-10-19/AMENDMENT-4-proposal.md`
Rationale: Amendment 4 is cited in the list like Amendments 1 to 3 (see decision D5).

**A2. Story 1.21, release rule (l.908).**
OLD: `` accepts a commit whose only changes against the cited commit are under `manual-evidence/**` or are main-only paths (`acceptance-ledger.json`, `_bmad-output/pilot-log.md`, `_bmad-output/evidence/**`, `_bmad-output/implementation-artifacts/**`); ``
NEW: `` accepts a commit whose only changes against the cited commit are under `manual-evidence/**`, are main-only paths (`acceptance-ledger.json`, `_bmad-output/pilot-log.md`, `_bmad-output/evidence/**`, `_bmad-output/implementation-artifacts/**` outside the slice-owned build records), or are slice-owned build records (`_bmad-output/implementation-artifacts/{spec-*,epic-*-context,deferred-work-s*}.md`); ``

**A3. Story 1.22, classification (l.931).**
OLD: `` and `_bmad-output/implementation-artifacts/**`, `_bmad-output/pilot-log.md`, `_bmad-output/evidence/**` and `acceptance-ledger.json` are main-only ``
NEW: `` and `_bmad-output/implementation-artifacts/sprint-status.yaml`, `_bmad-output/implementation-artifacts/ledger/**`, every other path under `_bmad-output/implementation-artifacts/` that is not a slice-owned build record (the freeze package, the evidence pack, an unsuffixed `deferred-work.md`, scratch files), `_bmad-output/pilot-log.md`, `_bmad-output/evidence/**` and `acceptance-ledger.json` are main-only, while the slice-owned build records of the next scenario are classified by `ownership.json` ``

**A4. Story 1.22, default rules (l.941, end of the "default rules apply" sentence).**
OLD (tail): `` …is replaced with it, and tests of S00-owned code inject their collaborators (a page component, a pending count) instead of asserting a stub's output ``
NEW: the same, followed by: `` ; the `bmad-build` records under `_bmad-output/implementation-artifacts/` follow the Story Index: `spec-<E>-<M>-*.md` belongs to the slice of Story E.M (one entry per story), `epic-<N>-context.md` to the slice of Story N.1 (so `epic-4-context.md` is S03's and S04 reads it without committing a change to it), and `deferred-work-s<NN>.md` to slice S<NN> ``

**A5. Story 1.22, new scenario after the "Given paths that no Owns cell names" scenario (after l.942).** Insert:
`**Given** the main-only and slice-owned classes`
`**When** the check runs on fixtures`
`**Then** a slice branch that changes its own spec, epic context or deferred-work file passes, and a slice branch that changes another slice's spec, `sprint-status.yaml`, a `ledger/**` file, the unsuffixed `deferred-work.md`, `_bmad-output/pilot-log.md` or `_bmad-output/evidence/**` fails naming the file`
`**And** a test asserts that the generated entries cover every story of the Index (`spec-<E>-<M>-*.md`), every epic (`epic-<N>-context.md`) and every slice (`deferred-work-s<NN>.md`) exactly once, and that `spec-1-1-*` does not match `spec-1-10-…`.`

**A6. Story 1.23 first scenario (l.967).**
OLD: `` it appends an entry to the story's ledger under `_bmad-output/implementation-artifacts/`, ``
NEW: `` it appends an entry to the story's ledger under `_bmad-output/implementation-artifacts/ledger/`, ``

**A7. Story Index intro (l.2315).**
OLD: `` anything not listed is frozen or another slice's. ``
NEW: `` anything not listed is frozen or another slice's. The `bmad-build` records `spec-<E>-<M>-*.md`, `epic-<N>-context.md` and `deferred-work-s<NN>.md` under `_bmad-output/implementation-artifacts/` are slice-owned by the default rules of Story 1.22; `sprint-status.yaml`, the ledger files, the pilot log and the evidence files are main-only. ``

**A8. Story Index, State model Registries bullet (l.2328).**
OLD: `` Sprint-status is the only registry of delivery status (PIL-04); the others record evidence. ``
NEW: `` Sprint-status is the only registry of delivery status (PIL-04); the others record evidence, and the `status` field of a `bmad-build` spec is the workflow's working state, never read as delivery status. ``

**A9. Story Index row 1.23 (l.2364).**
OLD: `` `scripts/ledger.mjs`, story ledger files under `_bmad-output/implementation-artifacts/` ``
NEW: `` `scripts/ledger.mjs`, story ledger files under `_bmad-output/implementation-artifacts/ledger/` (main-only) ``

Rows 1.30 and 7.8 already say main-only and name files that do not start `spec-`, `epic-` or `deferred-work-s`; no change.

### B. `ARCHITECTURE-SPINE.md`

**B1. AD-20 rule (l.190), one sentence.**
OLD: `` Slice branches never edit `sprint-status`, other stories or `pilot-log.md`; the ledger is written on main (append-only, `merge=union`). ``
NEW: `` Slice branches never edit `sprint-status.yaml`, `pilot-log.md`, `_bmad-output/evidence/**` or the ledgers (`acceptance-ledger.json`, `_bmad-output/implementation-artifacts/ledger/**`), or another slice's files; these are written on main (append-only, `merge=union`). A slice's own `bmad-build` records (`spec-<E>-<M>-*.md` of its stories, the `epic-<N>-context.md` of its first story's epic, `deferred-work-s<NN>.md`) are slice-owned files committed on its branch and encoded in `ownership.json`. ``
(The phrase "other stories" is subsumed by "another slice's files"; if Jo wants it kept verbatim the sentence can keep it.)

**B2. Conventions → Git row (l.275), last clause.**
OLD: `` the merge gate lands a whole slice on `main`; ledger and pilot log written on main only ``
NEW: `` the merge gate lands a whole slice on `main`; sprint-status, ledgers, pilot log and evidence written on main only, `bmad-build` records slice-owned (AD-20) ``

**B3. AD-20 Gate S00-CP clause (D9, l.190).**
OLD: `` sprint-status carries the key `gate-s00-cp`, set by the orchestrator, and stories from the first one after the gate stay `blocked` until it is `done`) ``
NEW: `` sprint-status uses only the native BMad story states (`backlog`, `ready-for-dev`, `in-progress`, `review`, `done`) and carries no gate key; the approval of Gate S00-CP is evidenced by the pilot-log entry and later by the ledger backfill of Story 1.23 (`ledger.mjs backfill`)) ``
Rationale: aligns AD-20 with the already approved model in epics.md (Gate S00-CP scenario: "sprint-status carries no gate key and no `blocked` status"). Grep of the spine and epics.md for `gate-s00-cp` and `blocked` found no other occurrence of the old wording.

### C. Not changed (checked)

PRD (PIL-04 wording stays true); UX; AD-26, AD-27 (no mention of the folder); Stories 1.19 (`trace.json` is under `_bmad-output/evidence/`, unaffected), 1.20, 1.24 to 1.30, 2.x to 7.x story text; the gate stories at l.999 to 1008 and `accept-slice` at l.1021 to 1023 (they touch only main-only paths and derive the slice from `ownership.json`); Amendments 1 to 3, the readiness report and `reconcile-process.md` (approved or historical records).

## 5. Worker brief rule and safe naming procedure (carried by the AO brief; no skill edit)

**Safeguard 1 result.** Checked against the installed `bmad-build` step files: the workflow generates `spec-{slug}.md` (step-01 point 5; the slug is derived from the intent and leads with a tracking identifier such as a story number, `-2`, `-3` appended on a clash with a non-draft spec), `epic-<N>-context.md` (step-01 epic context) and `deferred-work.md` (steps 01, 02, 04, oneshot). The amended rules accommodate them without modifying the skill, provided the worker follows the procedure below. Two facts shape it: the slug is model-derived and so not guaranteed to match `spec-<E>-<M>-*.md`; and step 5 ("Commit and Complete") creates a local commit of the dirty tree right after the sprint sync, with no pause, so every correction must be made before step 5 starts, except the `sprint-status.yaml` restore, which belongs between the sync and the commit.

**Safe naming procedure** (for slice workers using `bmad-build`; the oneshot route follows the same points before its final sync and commit):
- **(a) Name the key in the intent.** Start every run with an intent that names the sprint-status key, for example "Story 1.8 (sprint-status key 1-8-route-registration-kernel-with-stubs) from _bmad-output/planning-artifacts/epics.md", so that the spec slug is led by it and the file is `spec-1-8-route-registration-kernel-with-stubs.md` (or `…-2.md`).
- **(b) Rename a non-matching spec.** If the generated spec name does not match `spec-<E>-<M>-*.md`, rename it after step 4 (review and triage) has finished and before step 5 starts, which is the last point where the workflow no longer needs the old path: `git mv` when the file is tracked, otherwise a plain `mv` (it is untracked until the story commit). Continue the run with the new path as `{spec_file}`, and replace the old path in any `source_spec:` entries written to the deferred-work file.
- **(c) Move deferred entries.** Before step 5, move every entry the workflow appended to `deferred-work.md` into `deferred-work-s<NN>.md` (NN from `slice/sNN`), then delete the unsuffixed file if the run created it, or `git restore` it if it is tracked. No unsuffixed file is committed. Likewise delete any review-prompt scratch files written under `_bmad-output/implementation-artifacts/`, and `git restore` an `epic-<N>-context.md` that belongs to another slice (for example `epic-4-context.md` in S04) if the workflow recompiled it.
- **(d) Restore `sprint-status.yaml` and stage by path (D4).** Within step 5, after the sprint sync and before the commit, restore only that file (`git restore --source=HEAD -- _bmad-output/implementation-artifacts/sprint-status.yaml`), then stage the story's files by explicit path and commit. No `skip-worktree`, no `git add -A`, no `git commit -a`. Report the transition with `ao report`; the bookkeeping worker applies it on `main`, and from Story 1.23 `scripts/ledger.mjs status` does.
- **(e) Check before pushing.** `git show --stat HEAD` lists only owned paths. If the workflow's commit nevertheless contains a main-only path, it is an unpushed local commit: fix it with a new commit or `git commit --amend` before any push; never push it.

If the workflow cannot support these steps safely, the worker stops and reports the conflict instead of bypassing a checkpoint. Until Story 1.22 exists the rules are by discipline; afterwards the ownership check enforces them.
Until Story 1.22 exists, rules 1 to 4 are by discipline; afterwards the ownership check enforces them.

## 6. Focused consistency check (limited to the changed text and the rules that cite it)

Searched `epics.md`, the architecture folder, PRD, UX, readiness report and pilot log for `implementation-artifacts`, `main-only`, `main only`, ledger and sprint-status mentions.

| Mention | Result |
| --- | --- |
| epics l.876 (Story 1.19, `trace.json` to `_bmad-output/evidence/`, "main-only path") | Consistent, no change. |
| epics l.908 (Story 1.21 release) | Changed (A2). |
| epics l.931 (Story 1.22 classification) | Changed (A3). |
| epics l.941 default ownership rules | Extended (A4); new test scenario (A5). |
| epics l.967, l.2364 (ledger location) | Changed (A6, A9). |
| epics l.2315 Story Index default ownership | Changed (A7). |
| epics l.2325 to l.2328 State model | Registries clarified (A8); l.2325 ("written on main by `scripts/ledger.mjs`") already consistent. |
| epics l.2371 (1.30 freeze package, main-only) and l.2417 (7.8 evidence pack, main-only) | Consistent by fallback rule; no change. |
| epics l.999 to 1008, l.1021 to 1023 (merge gate, `accept-slice`) | Consistent (section 3.4). |
| epics l.534, l.524 (pilot-log entries on main) | Consistent. |
| Spine AD-20, Conventions Git row | Changed (B1, B2). AD-26, AD-27: no mention. |
| Amendment 2 text "ledger and pilot log written on main only" | Approved record; not edited. B2 supersedes it on the spine. |
| PRD l.186 PIL-04 | Unchanged and still true. |
| Readiness report l.24, l.73; `reconcile-process.md` l.65; pilot-log l.102 to l.129, l.199 | Historical/records; not edited. |

Residual points the check cannot settle: (a) whether the AO slice workers will honour the brief rules before Story 1.22 exists (by discipline until then); (b) `bmad-build` compares file times for its epic-context cache, which may trigger recompiles on fresh checkouts (handled by the restore rule in 3.2).

## 7. Implementation handoff

Scope: **Minor.** Recipients and responsibilities:
- **Planning worker or Developer agent, after Jo's approval:** apply A1 to A9 and B1, B2 in one planning commit, file this document as `AMENDMENT-4-proposal.md` next to Amendment 3 with its status line updated to "approved by Jo on <date> and applied", regenerate nothing else (no `requirements.json` exists yet).
- **Orchestrator:** put section 5 into the `slice/s00` worker brief before Story 1.8 and into every later slice brief; merge the updated `main` into `slice/s00` so the worker sees the planning text.
- **Bookkeeping worker:** records the approval in the pilot log with a `PL-` id, and keeps applying sprint-status transitions on `main`.
Success criteria: Story 1.8 starts with a `bmad-build` spec committed on `slice/s00` and an unchanged `sprint-status.yaml` in that commit; when Story 1.22 lands, its fixtures in A5 pass.

## 8. Decisions Jo must take

- **D1 Patterns.** Approve the path classes of section 3.1 (spec per story, epic context per first-story slice, deferred work per slice, everything else under the folder main-only).
- **D2 Deferred work.** Per-slice file named in the worker brief (recommended), or the same sentence as a `bmad-build` `persistent_facts` customisation in `_bmad/custom/`, or leave `deferred-work.md` main-only and have workers report deferrals instead.
- **D3 Epic 4 context.** First-story rule, so `epic-4-context.md` is S03's and S04 treats it read-only (recommended), or make all epic contexts main-only.
- **D4 Sprint sync.** Confirm the restore-and-report rule of 3.3 as the permanent rule.
- **D5 Record.** File this proposal as `AMENDMENT-4-proposal.md` next to Amendment 3 and add it to the epics front matter (recommended), or keep it only as the sprint change proposal.
- **D6 Wording.** Accept B1 replacing "other stories" with "another slice's files".
