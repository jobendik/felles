# PRD Quality Review (round 2) — FELLES

## Overall verdict
The PRD is a disciplined delta layer over an authoritative spec. Decisions, change-register outcomes (CR-1..4), slice ownership, evidence rules and pilot success criteria are concrete, and most round-1 gaps (missing §9.1, undefined slices/phases, no pilot success definition, no counter-metric) are closed. What remains at risk is small but real: one broken table row (VIS-05) that leaves a MUST without a clean owner slice, a stale DEC-03 that contradicts the decided CR-2, no stated verification path for the dashboard/activity MUSTs (VIS-03..05), the Jo-acceptance gate versus the parallelism the pilot wants to prove, and a few undefined adjectives ("severe", "where practical"). No critical issues; the PRD is usable for UX, architecture and epics once the high item is fixed.

## Decision-readiness — adequate
Decisions are logged with IDs and a status vocabulary (Jo / Default / CR-n) that separates what Jo decided from what is a clarifying default. §9.1 states, per change request, the original, the decision and the effect on the spec. This is honest about what was rejected (CR-1 stays mandatory) and what is a real product change (CR-3). Open questions OQ-1..6 are real and name when they close. Weakness: trade-offs record what was chosen, not what was given up. CR-3 leaves expired requests as stored `pending` forever, so every consumer must derive "utløpt". DEC-06 makes archiving irreversible. The largest unacknowledged tension is the human gate: the §4.0 slice map says S03 depends on "S01, S02 accepted", and PIL-02 says `done` is set only by Jo. With ORK-02 and PIL-06 this makes Jo the critical path for the very parallel runs ORK-03 wants to demonstrate.

### Findings
- **medium** Acceptance gate vs parallelism not surfaced (§4.0 "S01, S02 accepted"; §7 PIL-02, PIL-06; DEC-18) — S03 cannot start until Jo has accepted both S01 and S02. The PRD does not say whether dependents may start on `review`, nor what this costs. *Fix:* Add a DEC or `[NOTE FOR PM]` stating the rule and its cost.
- **medium** DEC-03 is stale against CR-2 (§9 DEC-03 "Baseline until CR-2 is decided"; "extra visibility = CR-2") — §9.1 records CR-2 as decided (option a, anonymous "Reserved" blocks), so DEC-03 reads as unresolved and duplicates §4.5 VIS-01/VIS-05. *Fix:* Mark DEC-03 as decided under CR-2, or drop "until CR-2 is decided".
- **low** Cost of derived-state and irreversibility not written down (CR-3 item 2, DEC-06) — *Fix:* one "gives up" clause each.
- **low** First-person and unconfirmed interpretation inside a decided register (§9.1 footnote "my reading of..."; §12) — CR-3 items (4) and (5) are marked as approved in the table but unconfirmed in the footnote, so their status is ambiguous. *Fix:* mark them "provisional" in the table row.

## Substance over theater — strong
No persona theater: three JTBD entries, each of which drives content (Pilot owner drives §7–8 and §10). No innovation section. NFR content is specific (NFR-04 names HttpOnly, `SameSite=Lax`+, `Origin` check; DEC-09 names DST test dates; DEC-12 names the immediate-write transaction; PIL-11 lists the smoke-test steps). The Vision (§1) names the dual purpose, product and workflow evidence, and could not be swapped into another PRD.

### Findings
- **low** Soft wording persists (§4.6 UI-3 "WCAG 2.2 AA where practical", "good contrast"; PIL-13 "no known severe defects") — "severe" is undefined. NFR-06 is soft in the spec on purpose (no formal load test), so that one is acceptable. *Fix:* define "severe" in PIL-13 (for example a failed MUST scenario, data loss or a security defect), and say who judges "practical" for WCAG.

## Strategic coherence — strong
The thesis is explicit ("A working app is necessary but not sufficient", §1), and PIL-01..08, ORK-01..10 and the counter-metric all follow from it. §10 now defines pilot success (every ORK `verified` or gap explained, PIL-13 met, one MUST traced end to end on screen) and names a counter-metric ("do not shorten time or cost by weakening tests, skipping review or marking work accepted early"). The evidence-status vocabulary (`not started` → `demonstrated` → `verified`) prevents describing a capability as proven. This resolves round 1's high finding. Remaining gap is minor: PIL-07 collects metrics (time, runs, interventions) but states no interpretation rule, and ORK-04 "Live monitoring is useful" has evidence that proves existence of a board, not usefulness.

### Findings
- **low** Metrics collected but not interpreted (§7 PIL-07; §10 ORK-04, ORK-09) — *Fix:* add a one-line decision rule for how PIL-07 data feeds the reuse verdict, or state that Jo judges it qualitatively.

## Done-ness clarity — adequate
Acceptance text is deliberately delegated to the spec; I confirmed the spec carries per-requirement text and E2E-01..10 with expected outcomes, so the delegation holds. The PRD adds testable boundaries where the spec is silent (DEC-04, 08, 09, 14, 16; CR-3 error `BOOKING_STARTED`). PIL-01 requires named evidence against a commit SHA, with manual checks allowed for non-automatable MUSTs. §4.7 maps E2E scenarios to API-level and browser evidence by slice, which closes round 1's cryptic-mapping finding. The gap: the spec's E2E list covers booking, approval, roles, archive and keyboard/mobile, but nothing covers VIS-03, VIS-04, VIS-05 (activity log) or VIS-06. §4.7 does not say how those MUSTs are verified.

### Findings
- **high** Dashboard and activity-log MUSTs have no stated evidence path (§4.5 VIS-03/04/05; §4.7) — No E2E scenario in spec §10 covers them, and §4.7 maps only E2E-01..10. VIS-03 and VIS-04 contain computed rules (DEC-04 window, ranking, ties by name, Expired request exclusion, CR-3) and VIS-05 has role-scoped visibility that is a privacy boundary. PIL-01 would force a named test per MUST, but the PRD does not say what kind, and S06 is the only parallel slice with no scenario. *Fix:* add rows to §4.7 for VIS-03..05 (for example API-level tests for count, ranking and role scoping; one browser check for the Admin panel), or state that PIL-01 evidence is defined per story in epics.
- **low** Spec cross-references still need the spec to decode (PIL-05 "spec §11", PIL-06 "spec §12 rule 4", PIL-09 "§12 rule 1", ORK IDs in §7–8) — acceptable given §0 and the spec's authority.

## Scope honesty — strong
§5 lists the spec's non-goals by reference and adds v1 exclusions (registration, password change/reset, profile management, un-archiving, editing a Booking's time). §6 states what is In and Out, names SHOULD items including login throttling, and says undelivered SHOULD items are reported as residual work. §0 states that only approved changes take effect. §9.1 makes the one real change (CR-3) visible rather than silent. Open-item density (6 OQs, all tooling or architecture-review items, none product behaviour) is proportionate. Round 1's concern about dangling §9.1 and missing throttling in §6 is fixed. There are no inline `[ASSUMPTION]` tags; the Assumptions Index (§12) works at a coarser level, with DEC status labels instead.

### Findings
- **low** Assumption status is only in the Status column (§9, §12) — §12 names DEC-11/12/16 and CR-3 (4)/(5) but a reader scanning DEC-14/15 sees only "Default". Acceptable under the stated convention.
- **low** Date inconsistency (frontmatter `updated: 2026-10-18` versus §9.1 "Decided by Jo on 2026-10-19") — *Fix:* update the frontmatter.

## Downstream usability — adequate
IDs are contiguous and unique: DEC-01..19 (DEC-05 is a retained stub marked superseded), PIL-01..13, OQ-1..6, CR-1..4, UJ-1..4. Cross-references I checked resolve (PIL-11 from NFR-01 and DEC-01, §9.1 from §0, ORK-07/10 from PIL-12, CR-3 from APP-01..03/VIS-03). The Glossary now defines Slice/Story and Delivery status. UJs have named protagonists (Ingrid, Magnus, Sofie) and map to E2E IDs. Main defect: one malformed table row.

### Findings
- **medium** VIS-05 row is broken (§4.5) — The table has columns ID, Pri, Capability, Clar., Owner. The VIS-05 row has six cells: the "Owner" cell holds the visibility rules prose and a trailing cell "Jo (CR-2)" overflows the table. No owner slice is stated (presumably S06), although owner slices are the PRD's main addition and VIS-01 repeats the same anonymous-block rule. Extraction by the epics step will mis-assign owner or drop the row. *Fix:* put "S06" in Owner; keep one visibility rule in VIS-01 and activity scope in VIS-05; Clar. cell "DEC-03, CR-2".
- **low** Glossary gaps — "Pilot owner" (Jo) and fixed UI labels ("Mine bookinger", "utløpt" is defined, "Reserved") are used without glossary entries; "Admin" appears as shorthand for Administrator (RES-03, VIS-04, APP-02 "Admin"). *Fix:* add "Mine bookinger" and align on "Administrator".
- **low** UJ coverage — Admin cancelling another member's booking and the "utløpt" experience (CR-3) appear only inside UJ-3 or not at all as the Member's view. Member's view of an expired request being rejected is not in a journey. *Fix:* extend UJ-2 with the expired-request variant.

## Shape fit — strong
A brownfield-style delta PRD over an authoritative spec plus a separate pilot-process layer (PIL/ORK). Four short UJs derived from E2E scenarios is proportionate for a small multi-role app. Product requirements (spec IDs retained) are cleanly separated from process requirements (§7 header). The addendum is non-binding and appropriately holds technical hints.

## Mechanical notes
- **ID continuity:** no gaps or duplicates in DEC, PIL, OQ, CR, UJ. PIL-09 sits in §7 and PIL-10..13 in §8; fine.
- **Cross-references:** all checked references resolve. §4.7 matches spec E2E-01..10 (checked in `docs/requirements.md`). The addendum's "Migration numbering needs a collision rule" is followed immediately by the rule (line 9), so line 7's note is redundant.
- **Assumptions Index roundtrip:** §12 entries (DEC-11, DEC-12, DEC-16, CR-3 items 4 and 5) all appear in §9/§9.1 with matching status. No inline `[ASSUMPTION]` tags exist; no orphans in either direction.
- **Glossary drift:** `Admin` versus `Administrator`; "Reserved" quoted but unglossed; "kategori" mapped to `kind` in the Glossary (good).
- **Table structure:** VIS-05 row malformed (see above). Table in §4.6 has one fewer column (no Clar.) by design.
- **Required sections:** present for the stakes. Success metrics live in §10.
