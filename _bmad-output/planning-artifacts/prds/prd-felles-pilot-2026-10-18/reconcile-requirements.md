# Input reconciliation: docs/requirements.md (Part A) vs PRD + addendum

Scope: every MUST in Part A. The PRD was not edited. Categories: F = represented faithfully, A = represented with approved change (CR-3), W = weakened, O = omitted, C = contradicted. Owner = owner slice present in the PRD.

Totals: 61 MUST items checked (29 numbered requirement MUSTs + 32 MUST rules/contracts/scenarios/DoD). F 55, A 4, W 2, O 0, C 0. Owner slice present: yes 59, no 2 (VIS-05 row malformed; definition of done has no slice owner).

## 1. Numbered MUSTs

| ID | Verdict | Owner | Note |
|---|---|---|---|
| AUT-01 | F | yes S01 | generic error, DEC-11 |
| AUT-02 | F | yes S01 | session, logout, no unauthenticated read (BR-6) |
| AUT-03 | F | yes S01 + all | server-enforced |
| AUT-04 | F | yes S01 | |
| RES-01 | F | yes S02 | |
| RES-02 | F | yes S02 | `kind` = spec "kategori" (glossary); CR-4 optional seats preserved |
| RES-03 | W (low) | yes S02 | DEC-06 / Non-goals §5 ban un-archiving; spec allows "redigere" and RES-02 has an active/archived status field. Restriction is a Default, not a CR |
| RES-04 | F | yes S02 + S03 | "future" undefined (see P7) |
| BOK-01 | F | yes S03/S04 | |
| BOK-02 | F | yes S03 | DEC-08/09 clarify |
| BOK-03 | F | yes S03 | contract formula kept |
| BOK-04 | F | yes S03 | DEC-12 |
| BOK-05 | F | yes S03 | |
| BOK-06 | F | yes S05 | DEC-07 |
| BOK-07 | F | yes S04 | |
| APP-01 | A (CR-3) | yes S05 | expired pending stays listed, reject only |
| APP-02 | A (CR-3) | yes S05 | reject with reason also for expired; own-booking rule kept |
| APP-03 | A (CR-3) | yes S05 | approval after start refused `BOOKING_STARTED` |
| APP-04 | F | yes S05 | |
| VIS-01 | F | yes S04 | CR-2 is a clarification (spec silent) |
| VIS-02 | F | yes S04 + S05 | |
| VIS-03 | A (CR-3) | yes S06 | pending count excludes expired |
| VIS-04 | F | yes S06 | DEC-04 window/top-3 clarifications; expired excluded implicitly (see P4) |
| VIS-05 | F | NO | row malformed (see P1) |
| NFR-01 | F | yes S00/S07 | macOS preserved (CR-1); see P8 |
| NFR-02 | F | yes S00 | PIL-10/12 |
| NFR-03 | F | yes S03/S05/S07 | role tests (S01/S02) not named as owners (P10) |
| NFR-04 | F | yes S01/S00 | "Origin check" drops spec's "egnet tillegg" (P11) |
| NFR-05 | F | yes S00/S07 | |

## 2. Other MUSTs

| Source | Item | Verdict | Owner |
|---|---|---|---|
| §2 | Status model and transitions; blocking statuses; never delete | F (glossary, BR-3) | yes S03/S05 |
| §2 | Admin cannot approve/reject own booking; 2 admins in seed | F (APP-02, SEED-1) | yes S05/S00 |
| §4 | UTC storage / Oslo display / DST test | F (BR-1, DEC-09; dates 2026-10-25 and 2027-03-28 are correct) | yes |
| §4 | Active resources at create+approve; no hard delete | F (BR-2) | yes |
| §4 | No overwrite of booking times; cancel + new | F (BR-3, non-goal) | yes |
| §4 | Server validation, structured errors | F (BR-4, DEC-16) | yes |
| §4 | Audit + change in one transaction | F (BR-5, DEC-12/17) | yes |
| §4 | No unauthenticated read | F (BR-6) | yes |
| §5 | 8 pages, role-based nav | F (UI-1/2) | yes |
| §5 | 375 / 1440 px, no horizontal scroll | F (UI-2) | yes |
| §5 | A11y (keyboard, focus, labels, non-colour errors, contrast, WCAG 2.2 AA where practical) | F (UI-3) | yes |
| §5 | States: loading/empty/error/unavailable/success/confirm | F (UI-4) | yes |
| §5 | Norwegian UI, nb-NO date/time/number | W (low): only DEC-10 (a Default) plus "helpers" in UI-2; no MUST row, no acceptance | yes S00 |
| §6 | Stack, workspaces, no external UI service | F (DEC-02, RUN-1) | yes |
| §6 | One documented start command; isolated temp DBs; no secrets in Git | F (RUN-1, PIL-10) | yes |
| §6 | Contracts frozen before parallel work (entities, routes, error format, authz, time) | F (RUN-1, PIL-06, DEC-16) | yes S00 |
| §7 | >=8 resources (4+4, >=2 approval), >=4 users (2+2), >=18 bookings + activity | F (SEED-1) | yes S00 |
| §7 | Current-week placement, injectable clock, hashed dev credentials, synthetic marking | F (SEED-1) | yes S00 |
| §10 | E2E-01 | F | yes S03 API / S04 browser |
| §10 | E2E-02 | F | yes |
| §10 | E2E-03 | F | yes S03 |
| §10 | E2E-04 | F | yes S05 / S07 |
| §10 | E2E-05 | F (extended additively with expired-reject, CR-3) | yes |
| §10 | E2E-06 | F | yes |
| §10 | E2E-07 | F | yes S07 sweep |
| §10 | E2E-08 | F | yes S02/S03/S07 |
| §10 | E2E-09 | F, browser evidence "optional" (P5) | yes S05 |
| §10 | E2E-10 | F | yes S07 |
| DoD | All MUST, E2E green, documented start, no severe defects, real SQLite, SHOULD residual | F (PIL-13) | NO explicit slice (process; S07 implied) |

Not-MUST items sanity check: SHOULD set RES-05, BOK-08, VIS-06, NFR-06 all retained as SHOULD (section 6). No MUST was downgraded.

## 3. Problems

- P1 (high, structural). PRD section 4.5, VIS-05 row: columns are shifted. The Clar. cell holds a sentence (DEC-03 text) and the Owner cell reads "Jo (CR-2)". There is no slice owner, which breaks PIL-01 (every MUST has an owner slice). Fix: `| VIS-05 | MUST | Activity log of create/approve/reject/cancel/resource changes with actor, time, ID; scoped by role | DEC-03, DEC-17, CR-2 | S06 (events written by each mutating slice) |`.
- P2 (medium, stale). Section 9 status legend says "CR-n = would change an original requirement, not in effect until approved", but CR-1, CR-2 and CR-4 are decided no-change. DEC-03 still says "Baseline until CR-2 is decided; Default; extra visibility = CR-2", while CR-2 is approved. Fix: DEC-03 status -> "Jo (CR-2, approved option a)", drop "baseline until"; reword the legend to "CR-n = change request; decided in 9.1".
- P3 (medium). CR-3 row in section 9.1 lists Req. = APP-01, APP-02, APP-03, VIS-03, but item (5) also governs VIS-04 counts. The VIS-04 row in section 4.5 cites no CR-3. Fix: add VIS-04 to CR-3's Req. column and to the VIS-04 row, or state that the DEC-04 window (start >= now) excludes expired requests by construction.
- P4 (low). DEC-04 "[now, now+7d)" excludes a confirmed booking already in progress (start < now < end) from the VIS-04 total. The spec says "neste syv døgnene". Fix: state explicitly, or use end > now.
- P5 (low, E2E-09). Section 4.7 gives E2E-09 browser evidence "optional", but DEC-13 says browser tests are still required where a scenario needs later UI, and the spec makes all E2E scenarios mandatory. Fix: say the API proof is the full proof for E2E-09 (like E2E-03/07), or require a Playwright check in S07.
- P6 (low). Section 4.2 RES-03 cites DEC-06 (archiving), which does not concern create/edit. Also the un-archive ban (DEC-06, section 5) restricts "redigere" without a CR. Fix: move DEC-06 to RES-04 only; have Jo confirm "no un-archive" explicitly, or register it as a CR.
- P7 (low). "Future booking" (RES-04, DEC-06) is undefined. A pending booking that has started but not ended, or an expired pending, is ambiguous. Related: reject of an expired pending booking on a since-archived resource is unspecified (BR-2 only requires active at create/approve). Fix: define future = start > now; state that reject does not require an active resource.
- P8 (medium, NFR-01). PIL-11 says NFR-01 cannot reach `verified` without a GitHub remote (OQ-4), so the definition of done (all MUST met) is unsatisfiable if Jo declines a remote. GitHub macOS minutes may also not be free on private repos, against "no paid services". The NFR-01 row also drops the spec's "eksterne API-nøkler". Fix: add a fallback path (manual run on a real Mac, OQ-5) as accepted evidence; add "no external API keys" to the NFR-01 row; note public-repo assumption or real-Mac fallback.
- P9 (low). Section 5 locale and language MUST (Norwegian UI, nb-NO formatting) has no requirement row. It exists only as DEC-10 (Default) and a UI-2 helper mention. Fix: add it to UI-2 (or a new UI-5) with acceptance text and owner S00 plus all UI slices.
- P10 (low). NFR-03 owner lists S03/S05 only, but role-restriction tests belong to S01/S02/S07. Fix: add S01, S02. Also name a concurrent-approval test (APP-03 "samtidig") under S05.
- P11 (low). NFR-04 wording "Origin check on writes" omits the spec's "with a suitable supplement if the architecture requires it". Fix: restore the clause so the architecture step may add a token.
- P12 (low, housekeeping). DEC-05 is "Superseded by CR-3" with no original text, so the intent is not recoverable. Frontmatter `updated: 2026-10-18` predates the CR decision date (2026-10-19). The footnote after 9.1 and section 12 use "my reading" with no named author. PIL-11 makes the CI workflow an S00 deliverable, but the section 4.0 S00 description does not list it. Fix: restate DEC-05 text, bump `updated`, replace "my" with "the PRD author's", add CI workflow to S00.
- P13 (low, UX). VIS-03 count excludes expired requests while the queue still lists them, so a zero count can sit next to a non-empty queue. Fix: show the expired count separately in the queue or dashboard (UX step).

No dangling references found: every DEC/CR/PIL/OQ/ORK ID cited in the PRD exists. The addendum is consistent with DEC-09/12/16/17 and PIL-06. No statement contradicts CR-1..CR-4 beyond P2 and P3.
