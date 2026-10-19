# Amendment 1 (proposed, not applied) — phase-aware traceability gate

Status: **proposal, awaiting Jo's approval.** `ARCHITECTURE-SPINE.md` is unchanged. AD ids stay stable; AD-20, AD-26 and AD-27 are amended in place if approved.

## Finding (confirmed)

An independent review of the committed spine flagged AD-20, AD-26 and AD-27 as inconsistent. Checked against the committed text (`7978ac5`):

| Where | Current text | Effect |
| --- | --- | --- |
| AD-27 | "`npm run verify:full` adds Playwright and `scripts/trace.mjs --through S07` (which also runs in the merge gate)" and CI "runs `verify:full`" | `verify:full` embeds the all-slices check |
| AD-20 | "`scripts/merge-gate.mjs` … runs `verify:full`, the ownership check and the shared integration set" | the merge gate runs `verify:full` |
| AD-26 | "`--through <slice>` fails when a MUST whose owner slice is at or before `<slice>` has no passing test … the merge gate passes the candidate's slice, `verify:full` on main and S07 pass `--through S07`" | says the opposite for the merge gate |

**Consequence.** Read literally, the merge gate runs `verify:full`, which runs `trace.mjs --through S07`. Before S07, most MUSTs (owned by later slices) have no passing test, so the trace check fails and the gate refuses **every** merge, including S00. The CI matrix would also be red on every commit until S07. This blocks early slices; it is a real defect, not a wording nit.

**Second defect in the same area.** "At or before `<slice>`" is a numeric order. Slices are not a line: S01 ∥ S02 and S04 ∥ S05 ∥ S06 are parallel. Merging S02 first would be blocked because S01's MUSTs (earlier number) have no tests yet; merging S06 would wait for S05. It also cannot express MUSTs with evidence in two slices (for example E2E-04: API-level in S05, browser in S07).

**Third, minor.** The "current slice" has no home: `ownership.json` is frozen (changes need Jo), so it cannot record progress.

## Proposed amendment (minimal)

Trace by **accepted evidence**, not by slice number, and keep S07-wide completeness as a separate release gate.

**AD-26** — replace the sentence from "`--through <slice>`" to "…`--through S07`;" with:

> `trace.mjs --accepted <slices>` fails when a MUST evidence part whose `evidenceSlice` is in `<slices>` has no passing test, or when a title has an unknown id (`requirements.json`, generated from the PRD owner table and §4.7, lists one entry per evidence part, for example E2E-04 API-level at S05 and browser at S07). `<slices>` defaults to the slices carrying an `sNN-accepted` tag reachable from `HEAD` (tags created on main by Jo's acceptance, PIL-02) plus the slice in `FELLES_SLICE` when set. Slice order is irrelevant, so parallel slices never require each other. `--accepted all` requires every MUST and is used only by `npm run verify:release`;

**AD-27** — replace "`npm run verify:full` adds Playwright and `scripts/trace.mjs --through S07`" with:

> `npm run verify:full` adds Playwright and `scripts/trace.mjs` with the default `--accepted` set (AD-26). `npm run verify:release` is `verify:full` plus `trace.mjs --accepted all`; it is the S07 acceptance run and the PIL-13 evidence.

CI keeps running `verify:full` (green on early commits). Nothing else in AD-27 changes.

**AD-20** — after "runs `verify:full`" in the merge-gate sentence insert "with `FELLES_SLICE` set to the candidate's slice".

**Memlog:** one decision entry; no other AD, contract or ownership change.

## Effect on planning

- Each epic/story carries its `evidenceSlice` so `requirements.json` can be generated; this is exactly the PIL-01 requirement-to-story-to-evidence table the epics step must produce anyway.
- Early slices (S00, S01, S02, …) can merge as soon as their own evidence is green and Jo has accepted them; later-slice MUSTs are not demanded.
- No product requirement, UX decision or other approved decision changes.

## Decision requested

Approve Amendment 1 as written? On approval I apply the three edits, log the decision, re-lint, commit, and continue the epics workflow from the requirements-extraction step. Until then I derive no epics or stories.
