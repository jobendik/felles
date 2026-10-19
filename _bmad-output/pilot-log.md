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

## Next phase

Phase A3, technical architecture (`bmad-architecture`), starts in a fresh session on Jo's instruction. Inputs: the final PRD, DESIGN.md and EXPERIENCE.md (including the Architecture handoff list), `docs/requirements.md`, and DEC-11/12/16 pending architecture review (OQ-6).
