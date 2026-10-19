# Validation 2b: content and quality of epics.md (7 epics, 75 stories, Gate S00-CP)

Validator: fresh, independent, read-only. Document: `_bmad-output/planning-artifacts/epics.md` (2,307 lines, `status: draft`). Authorities read in full: spec `docs/requirements.md` Part A, PRD (sections 4, 7-10), EXPERIENCE.md, approved-copy.md, ARCHITECTURE-SPINE.md (AD-1..AD-28, Contract Minimums), AMENDMENT-2-proposal.md, step-04 rules; DESIGN.md and mockups were grepped for the points cited. Line numbers refer to epics.md.

## Verdict

Content coverage is strong: every MUST, every SHOULD and all ten E2E scenarios reach a story with real AC text, the split API/browser evidence parts exist, and the approved Norwegian copy is quoted exactly. No blocker found. There are 5 high findings (gaps where a claimed evidence part or MUST sub-rule has no AC, or an AC cannot be satisfied in its slice), 17 medium and 13 low. The document can go to `final` after the high findings are fixed and the medium findings are fixed or consciously accepted. Several fixes are one-sentence AC additions.

| Tier | Count |
| --- | --- |
| Blocker | 0 |
| High | 5 |
| Medium | 17 |
| Low | 13 |

---

## 1. High

### H1. Story 5.1 has no AC for "resource still active at approval" (APP-03, BR-2@S05) or for "rejecting an Expired request needs no active resource" (DEC-06)

Location: Story 5.1 (lines 1726-1757); Story Index row 5.1 (line 2211) claims `BR-2@S05`.
Evidence: the five ACs of 5.1 cover approve, own request, `BOOKING_STARTED`, reject with reason, and `BOOKING_NOT_PENDING`/races. The string `RESOURCE_ARCHIVED` appears in no Epic 5 story. Spec APP-03: "Serveren validerer at ressursen fremdeles er aktiv og tidsrommet gyldig"; spec section 4: "Ressurser må være aktive ved opprettelse og godkjenning"; AD-9: "approve only: resource active (`RESOURCE_ARCHIVED`, a guard that AD-10 makes unreachable)"; AD-10: "an Expired request on an archived resource can still be rejected"; PRD DEC-06: "Rejecting an Expired request does not require an active Resource".
Why it matters: one MUST sub-rule (APP-03) and one evidence part (`BR-2@S05`) have no AC, so the agent will invent the test; the guard is unreachable through the public API, so how to test it (use-case test with a stubbed repository, or trigger-bypassing fixture) must be stated. The reverse rule (reject still works on an archived resource) is the only way DEC-06 is evidenced and is also missing.
Fix (add to Story 5.1):
> **Given** a `pending` booking whose resource is archived (set up in the use-case test through the repository port, because AD-10 makes the state unreachable through the API)
> **When** an Administrator approves it
> **Then** the use case answers 409 `RESOURCE_ARCHIVED` and nothing is written (`[BR-2]`, `[APP-03]`)
> **And** rejecting an Expired request on an archived resource with a reason succeeds (DEC-06, AD-10).

### H2. Story 2.3 AC 3 cannot be satisfied inside slice S01

Location: Story 2.3, third AC (lines 1116-1119); Index row 2.3 (line 2185, `AUT-03@S01`).
Quote: "**When** a Member requests an action on another person's booking **Then** the order load, policy, state check, write is observable in tests, and a Member never receives a state-dependent error for a booking they may not read ... **And** the key set of 401, 403 and 409 bodies for Members contains no foreign identity."
Why it matters: in S01 `approve`, `reject` and `cancel` are `NOT_IMPLEMENTED` stubs (Story 1.8) and no booking use case exists; the 409 bodies do not exist yet. The AC can only be met by a pure `policy.can` unit test, which is Story 1.10's. It is a forward dependency on S03/S05 (violates step-04 "can only depend on PREVIOUS stories"). The behaviour is later proved in 4.3, 5.1, 5.2 and 7.1.
Fix: replace the AC with: "**Given** the complete `policy.can` action union **When** it is called for a Member and an Administrator on own and foreign booking subjects **Then** foreign `booking:read|cancel|approve|reject` by a Member is denied before any state is inspected (`[AUT-03]`) **And** the use-case ordering and the 'no foreign identity in 401/403/409 bodies' checks are carried by Stories 4.3, 5.1, 5.2 and 7.1."

### H3. Story 1.12 does not fix the named personas, resources and clock state that the browser stories and Flows depend on

Location: Story 1.12 (lines 623-648); dependants: 2.6 ("as Ingrid", line 1184), 4.15 (lines 1708-1716), 7.2 (lines 1997-2010), 7.3 (line 2022); Index owns for 1.12 (line 2165).
Evidence: 1.12 asserts only counts ("8 resources (4 rooms, 4 equipment, at least 2 approval-required), 4 users (2 Administrators, 2 Members ...)"). 4.15 requires Fjellet free 10:00-11:00 on Monday 2026-10-19 with "Kundemøte Nordlys"; 7.2 requires Ingrid, Magnus, Sofie, Jonas, a requestable approval-gated Podkast-sett/Kamera, an Expired request; 7.3 requires "Fjorden" with a confirmed booking tomorrow and "Gammel projektor" archivable with no future booking. "Gammel projektor" and "Fjorden" occur only in EXPERIENCE.md, the content pack and epics.md; no AC makes them seed content, and 1.12 forbids later slices from editing the seed ("builds it in its own test helpers over the minimal base seed and does not edit the seed").
Why it matters: ten MUST browser parts (E2E-01/02 at S04; E2E-04/05/06/08/09, VIS-03/04/05 at S07) depend on data nobody is told to create. Each slice agent will invent different names; the browser specs would then fail or use helpers that duplicate seed data.
Fix (add an AC to 1.12): "**Given** the reference clock **When** the base seed is inspected **Then** it contains the personas Ingrid Haugen (Member), Jonas Dahl (Member), Magnus Berg (Administrator), Sofie Lund (Administrator) with development credentials listed in the README, and resources named at least Fjellet (room, 8 seats, 2. etasje, no approval), Skogen, Fjorden, Lysgården (rooms), Podkast-sett and Kamera Sony A7 (approval required), Gammel projektor and one more item (equipment), with the free/taken pattern of Flow 1 on Monday 2026-10-19 (09:00-09:30 taken on Fjellet, 10:00-11:00 free) and one Expired pending request by Jonas on Lysgården (as in Flow 3). Scenario-specific extras (for example Fjorden's confirmed booking tomorrow) are built by the owning slice's helper."

### H4. Story 4.9 (Mine bookinger) never renders the `BookingActions` slot, so the cancel half of VIS-02 has no S04 AC

Location: Story 4.9 (lines 1568-1589); Index row 4.9 (line 2204); PRD 4.5 VIS-02: "S04 owns the module and exposes a cancel slot; S05 supplies the action"; Story 1.17 `BookingRow ... actions?` "renders the node passed as `actions` (supplied by the caller from the `BookingActions` slot)".
Evidence: 4.9 ACs list rows (tile, resource, time, purpose, badge), tap opens `?booking=`, "Book igjen", "Ny booking", states. Nothing says the page passes `<BookingActions .../>` into each `BookingRow`. Only 4.8 mentions the slot (detail sheet footer). Story 6.3 (Hjem rows) also passes none, although EXPERIENCE "List row ... Mine bookinger, Hjem, Godkjenninger" has inline "Avbestill".
Why it matters: nothing makes S04 expose the slot in the list; the first test that would notice is Story 7.2 in S07, where fixes go through `Fixes:` commits. This is the one place where the two parallel slices (S04, S05) must meet.
Fix: add to 4.9 "**Given** a row for a `pending` or `confirmed` future booking **When** it renders **Then** the row passes `<BookingActions booking viewer placement="row" onChanged />` from the seam entry as `actions` (a stub renders nothing until S05) and the row stays one tap target for opening the sheet (`[VIS-02]`)"; add the same one-liner to 6.3 for Hjem rows.

### H5. UI-4 evidence parts are claimed without the states they stand for (Index preface defines UI-4 as loading, empty, error, unavailable and success)

Location: Index preface line 2145 ("UI-4 and UI-5 parts mean the story's tests cover loading, empty, error, unavailable and success states"); rows with UI-4: 3.4, 3.5, 4.8, 5.3, 4.6, 4.7.
Evidence (AC gaps):
- 5.3 Godkjenninger (lines 1782-1803): no skeleton ("Three skeleton rows"), no failure or offline alert. EXPERIENCE State Patterns row for Godkjenninger specifies them.
- 3.5 Ressursdetalj (lines 1297-1317): only archived and 404; no "Skeleton header and strip", no "Prøv igjen".
- 3.4 (lines 1274-1295): skeleton and empty yes; error and offline alert missing.
- 4.8 Booking detail (lines 1545-1566): "Skeleton of the key-value list" missing; 4.7 and 4.6: "Slot picker skeleton while availability loads" missing.
Why it matters: UI-4 is a MUST in every UI slice and the Index promises coverage; the generic `QueryState` (Story 1.27) makes the fix cheap but each page still has to be wired and tested (layout-mirroring skeletons are per surface).
Fix: add one AC to each of 5.3, 3.5, 3.4 (error part), 4.8, 4.6/4.7: "**Given** loading, a failed request and offline **When** they occur **Then** the specified skeleton (N rows), the 'Prøv igjen' alert with the last good data kept, and the offline alert appear (`[UI-4]`)". 6.3, 6.5, 4.9, 4.10, 3.7 already have this form.

---

## 2. Medium

### M1. Story 1.23 merge gate does not check `tested` and `reviewed` ledger entries (PIL-12)
Location: Story 1.23 (lines 886-907); Coverage Tables line 2306 maps PIL-12 to 1.23.
PRD PIL-12: "A branch merges to `main` only when `tested` and `reviewed` are recorded on its exact commit and the shared integration tests are green on the merge candidate." Story 1.23 checks only `verify:full`, ownership and the integration set; Story 1.24 checks the entries at acceptance. Fix: add to 1.23 AC2 "**And** the gate refuses to land while any story of the slice lacks a `tested` and a `reviewed` ledger entry citing a commit of the candidate branch" (or state why PIL-12 is deliberately satisfied at 1.24 only).

### M2. Story 4.5 AC 1: "one minute later fails" tests the grid, not the 30-day horizon
Location: lines 1484-1487. Quote: "a booking at the last bookable start `2026-11-18 08:00` Oslo succeeds and one minute later fails".
Arithmetic: 2026-10-19T07:00Z + 30 x 24 h = 2026-11-18T07:00Z = 08:00 Oslo (CET), so the stated start is exactly the inclusive limit (AD-5). 08:01 is off the half-hour grid and fails `BOK-02` validation for the wrong reason. Fix: "... and the next grid start 08:30 fails with a `start` field error for the horizon".

### M3. DEC-08 says "not in the past = start >= now"; epics follow AD-5 "start > now" without saying so
Location: Story 4.1 (line 1395, "a start exactly equal to now is rejected (`start > now`)"), AR9 (line 137), Story 1.2.
PRD DEC-08: "'Not in the past' = start >= now". AD-5: "create, cancel and approve need `start > now`". The spine silently refines a PRD decision (the spine's `binds` list names DEC-08). Impact is one millisecond, but trace tests will encode the stricter rule. Fix: add to Story 4.1 a note "(AD-5 refines DEC-08: `start == now` is already past)" and record it as a clarification in the PRD decision log, or change the AC to `>=`.

### M4. DEC-15 second half (one user may hold overlapping bookings on different resources) has no AC
Location: Story 3.2 AC4 covers "approvalRequired changes ... unaffected"; Story 4.1 covers same-resource adjacency only. `grep "different resources"` finds nothing. Fix: add to 4.1 "**And** the same Member can create overlapping bookings on two different resources (DEC-15)".

### M5. AD-2 input hygiene (trim, NFC, control and bidi characters rejected, `""` becomes `null`) is in no AC
Location: Story 1.4 (lines 403-428) and 1.2; `grep -i "bidi\|NFC\|control char"` returns nothing. AD-2 is part of BR-4 ("understandable, structured errors", validated). Fix: add to 1.4 a Given/When/Then: strings are trimmed and NFC-normalised, a control or bidi character gives `VALIDATION_FAILED`, `""` becomes `null` for optional text, `PATCH` omission versus `null`.

### M6. NFR-04 "parameterised database operations" has no explicit evidence
Location: NFR-04@S00 is claimed by 1.3, 1.9, 1.10; Story 1.1 lint-rule list (lines 334-337) omits the AD-18 rule that `prepare`/`exec` accept only string literals or `*.sql.ts` constants. Cookie, hashing, Origin and `Secure` are covered; parameterisation is not. Fix: add a fixture pair to Story 1.1 (non-literal `prepare` fails, constant passes) and tag it `[NFR-04]`.

### M7. Story 1.25 AC 3 depends on a page that Story 1.26 and Story 2.4 own
Location: lines 944-947. Quote: "the session ends through the S00 `logout()`, the query cache is cleared and `/logg-inn` shows 'Du er logget ut.' or the matching message". At 1.25 there is no router (1.26) and no login page (2.4); `DELETE /api/session` is an S01 stub. Fix: change to "navigates to `/logg-inn` carrying the sign-out message key (component test with a stubbed session)" and leave the rendered text to 2.4/2.6, which already assert it.

### M8. Story 1.25 is credited with `UI-3@S00` but has no keyboard, focus or axe AC; 1.16 and 3.6/4.7/4.11 likewise
Location: Index rows 1.25, 1.16 (lines 2169, 2178); ACs lines 932-951 and 733-751. The blanket Definition of Done (line 2149) covers axe, but the shell is the highest-risk a11y surface (skip link, landmarks, `aria-current`, Mer `aria-haspopup`, scroll padding 56/64 px). Fix: add "the shell passes axe at 375 and 1440 px and keyboard Tab order is sidebar, main" to 1.25 and a one-line axe/keyboard AC to 1.16 and 4.7.

### M9. UX accessible names and state texts from EXPERIENCE.md that no AC carries
`grep` over epics.md finds none of:
- pill accessible name "Godkjenninger, 3 venter" and the Mer count dot "3 ventende godkjenninger" (EXPERIENCE App shell row and Accessibility Floor; Story 1.25/6.3);
- 403 page action "Til Hjem" and the route 404 message "Fant ikke siden." (State Patterns default row; Story 1.27 says only "the 'Ingen tilgang' page for 403 and the not-found message for 404");
- the mobile scroll root `scroll-padding-top: 56px` / `bottom: 64px` is only tested in 4.12, not built in S00;
- toast placement (bottom-right desktop, above the tab bar on mobile; UX-DR24) in 1.15.
Fix: add these to 1.25 (pill, Mer dot, scroll padding), 1.27 (texts), 1.15 (toast position).

### M10. Copy introduced by the epics that is in neither approved-copy.md, EXPERIENCE.md nor the mockups
- "Ressursen er lagret." (Story 3.6, line 1339) and "Ressursen er arkivert." (Story 3.7, line 1357); EXPERIENCE only fixes "Ressursen er opprettet.".
- Slot-picker refusal texts: Story 4.6 AC2 (line 1515) says the picker "says why under the grid" but quotes no text; only "Maks 4 timer." exists (Flow 1). Texts for "crosses a taken slot" and "precedes the start" are undefined.
- `/ressursadministrasjon?ny=1` (Stories 3.4, 3.7) is an invented URL parameter, not in UX-DR8 or the route table.
Needs a human (UX/Jo) decision, then add to `approved-copy.md` or the i18n catalogue. Until then a build agent will write its own wording.

### M11. Story 3.6 says over-limit text shows "Maks 200 tegn." "where a limit applies"
Location: line 1335. Limits are name 80, description 500, location unspecified (AD-2), purpose and reasons 200. "Maks 200 tegn." is correct only for 200-limit fields. Fix: "the field-specific limit from the contract (for example 'Maks 80 tegn.')" and add the generic formatter to the catalogue, or restrict the AC to the 200-char fields.

### M12. Story 4.8 and Story 5.4 disagree on who renders "Book igjen"
Quotes: 4.8 line 1565 "it hosts the frozen `BookingActions` slot (Avbestill when allowed, Book igjen when past or final)"; 5.4 line 1816 "does not render 'Book igjen' (that belongs to `BookingRow`)". The detail sheet footer is not a `BookingRow`. Fix: 4.8 "the footer renders `BookingActions` (Avbestill) and, for past or final bookings, its own 'Book igjen' button (`useBookingSheet().open` with resource and purpose)".

### M13. Story 5.3 lacks the two refusal alerts of Flow 3
Location: lines 1795-1798. Only `BOOKING_NOT_PENDING` is covered. Missing: `BOOKING_STARTED` on approve ("Forespørselen har allerede startet og kan ikke godkjennes. Du kan fortsatt avslå den." from approved-copy.md, for a row that expired while open) and `OWN_REQUEST` ("the UI shows 'Du kan ikke behandle din egen forespørsel.' as an inline alert", Flow 3 failure, E2E-09 UI half). Fix: add both to 5.3.

### M14. Slice-candidate command is not copyable on Windows
Location: Index test commands (line 2148) and ACs 4.15/5.5/2.6: "`npm run verify:full` with `FELLES_SLICE=<slice>`". Windows (the primary platform) does not support `VAR=x cmd`; AD-24 bans it in scripts. Fix: define one cross-platform form (for example `npm run verify:full -- --slice S04` read by `trace.mjs`, or `node scripts/run-with-env.mjs`), and have Story 1.1's stack note record the verified quoting for `-t "\(@N\.M\)"` and `-g` in PowerShell and cmd.

### M15. Tag convention is stated in two forms
Index line 2145/2148: `(@N.M)` with parentheses and `-t "\(@N\.M\)"`. Story 2.6 (line 1191): "story tag `@2.6`" without parentheses. Collision check: `\(@1\.1\)` cannot match `(@1.10)`, `(@11.1)` or `(@4.1)` versus `(@4.10)` because of the closing parenthesis, so the parenthesised form is collision-safe; the bare form `@2.6` would collide (`@2.6` inside `@2.60` is impossible here, but `@4.1` is a substring of `@4.10`..`@4.15`). Fix: use `(@N.M)` everywhere in ACs.

### M16. Evidence parts claimed in the Index that the story text does not produce
- Index 1.7 claims `BR-5@S00`; Story 1.7 ACs name `[BR-3]` only (the subject-mismatch probe is the nearest).
- Index 6.2 claims `BR-5@S06`; Story 6.2 has no BR-5 AC and Story 6.2 is read-only (PRD BR-5 owner: S00 writer and each mutating slice; S06 is not mutating).
- Index 2.2 claims `NFR-04@S01`; the throttling ACs carry no `[NFR-04]` tag.
- Index 3.2 claims `E2E-07@S02`; 3.2 AC1 covers only `POST` by a Member ("a Member gets 403"); Member `PATCH` is nowhere, and Member `archive` (3.3) is not in the Index row for 3.3.
- Index 1.12 claims `SEED-2@S00`; the `demo:reset` AC has no tag.
- Story 5.1 ACs tag `[BOK-05]` but the Index has no `BOK-05@S05`.
Because `requirements.json` is generated from the Index and `trace.mjs` fails on a part with no passing test, each of these either blocks the S0x gate or becomes an untraceable claim. Fix: remove the unproven parts or add the one-line AC/tag.

### M17. Same evidence part is assigned to two stories
Index rows 4.2 and 4.5 both list `E2E-02@S03`, `E2E-03@S03`, `NFR-03@S03`; 4.1 and 4.5 both list `BOK-02@S03`; 6.1/6.3 share `VIS-03@S06`. Story 1.19 generates `{ req, evidenceSlice, story }`, one story per part, so duplicates are ambiguous. Fix: state in Story 1.19 that a part may have several stories and any one passing test titled with one of them satisfies it, or give each part a single story.

---

## 3. Low

- L1. PRD section 6 says SHOULD items "are last-in-slice stories"; RES-05 (3.4) and BOK-08 (4.9) are folded into MUST stories, VIS-06 (6.4) and NFR-06 (7.5) are not last. They cannot be dropped cleanly. Acceptable only if recorded as a deliberate deviation; suggested sentence in the Epic 3/4 intros.
- L2. Story 2.4 AC 3 (line 1145): the countdown "also survives a refresh". The only way is persisted state (storage) or retrying; mechanism undefined; AD-21 puts view preferences in `app/` and says nothing about throttle state. Specify (guarded `sessionStorage` deadline) or drop the clause.
- L3. AD-21 puts the guarded `localStorage` for view preferences "inside `app/`"; Stories 1.17 and 6.4 put it in `ui/` (SegmentedControl `storageKey`). Features cannot import `app/`, so the epics are the workable reading; note it as an AD-21 clarification. Story 4.10 "default last viewed" resource has the same gap.
- L4. Story 4.2 AC 1: "repeats enough times to expose ordering faults" and "for any interleaving" are unmeasurable. Give a number (for example 25 bursts) and drop "any interleaving".
- L5. Story 4.10 AC 2: "the week of 2026-10-25 renders 25-hour Sunday correctly in the grid" is meaningless for a fixed 08:00-22:00 grid. Replace with "a 10:00-11:00 Oslo booking on Sunday 2026-10-25 renders in the 10:00 row". "Blocks under 30 minutes show the title only" copies DESIGN.md but cannot occur (minimum 30 minutes).
- L6. Story 7.4 AC 1 and AC 3 are vague: "the 768-1023 px band does not break" and "colour contrast of tokens is rechecked against the DESIGN.md ratios" (no method, no threshold). Give a test (axe at 900 px; a contrast script over the token pairs).
- L7. Story 7.5: the 200 ms p95 is an invented, machine-dependent threshold (the AC itself says so); NFR-06 is SHOULD and manual evidence. Fine, but mark it informational so it cannot fail `--release`.
- L8. Story 6.4 AC 3 "Given greyscale or forced-colours viewing When the chart is inspected" has no oracle; assert `stroke-dasharray` on the pending series instead.
- L9. Activity text uses `B-<id>` (EXPERIENCE Flow 3 "Magnus Berg godkjente booking B-1047"; AD-18 "shown as B-<id> by one formatter"); Story 1.13's `i18n/format.ts` AC does not list the id formatter.
- L10. Story 1.1 lint list lacks a `no-alert` fixture although UX-DR29 bans `alert()`/`confirm()`; Story 1.12 omits the non-loopback `FELLES_HOST` refusal of AD-25; Story 2.1 does not assert that login and logout write no activity event (AD-17); Story 3.2 does not state that resource names are not unique (AD-10); 5.2 does not test a cancel reason over 200 characters (DEC-14).
- L11. Layout/format leftovers: stray line `#` at line 304 under "Epic List" (the template's epic summary list is missing, only the detailed epics follow); `stepsCompleted` lacks `step-04-final-validation`; `inputDocuments` omits AMENDMENT-2-proposal.md; Coverage row `AR27` lists 1.22, 1.23, 1.24, 1.29 but not 1.11, 1.26 and 4.5 where the seams and F1/F2 freeze live; the spine and Amendment 2 still say "Story 1.4-CP" and "Story 1.4 creates the whole schema" (epics gloss this at line 312 correctly; fix the spine text when it is next touched).
- L12. Story 1.23 uses a "tokens check" and "schema snapshot" (1.14, 1.6/1.7) not in its dependency list (line 2176: 1.18, 1.20, 1.22); fine when stories run serially, wrong for a reader of the Index. Story 2.2 changes the login use case (owned by 2.1) while its *Owns* cell lists only `throttle.ts`. Story 4.14 lists "S02 accepted" as a dependency, which is already implied.
- L13. "Stories 1.1-1.24 are verified with `npm run verify` only" (line 312) is stated as if the gate tooling ends at 1.24, yet Stories 1.25-1.28 are also built before Story 1.29's first gate run; say 1.1-1.28.

---

## 4. Coverage matrix (every MUST and SHOULD; AC that delivers and tests it)

| Req | Delivering AC (story) | Verdict |
| --- | --- | --- |
| AUT-01 | 2.1 AC1-2 (cookie, generic 401, case-insensitive), 2.4 AC2, 2.6 | ok |
| AUT-02 | 2.1 AC4 (logout 204), 2.3 AC1 (401 on every non-public route), 2.5 | ok |
| AUT-03 | 2.3 AC2 (admin routes 403), 2.3 AC4, 3.1/3.2, 4.3 | AC3 of 2.3 infeasible (H2) |
| AUT-04 | 1.25 (name and role), 2.1 AC5 (survives restart), 2.6 AC1 (refresh) | ok |
| RES-01 | 3.1 AC1, 3.4 AC2, 3.5 | ok |
| RES-02 | 3.1, 3.2 AC2 (seats null, CR-4) | ok |
| RES-03 | 3.2 AC2, 3.6 AC2 "Navn er påkrevd." | ok |
| RES-04 | 3.3 AC1-3, 4.1 AC4 (`RESOURCE_ARCHIVED`), 7.3 | ok |
| RES-05 (SHOULD) | 3.4 AC1 badge | ok (folded into MUST story, L1) |
| BOK-01 | 4.1 AC1 (API), 4.7 AC1-2 (UI) | ok |
| BOK-02 | 1.2 AC1, 4.1 AC3, 4.5 AC1 | horizon boundary test wrong (M2) |
| BOK-03 | 1.2 AC2, 4.1 AC4 (10-11, 11-12) | ok |
| BOK-04 | 4.2 AC1-3 | ok |
| BOK-05 | 4.1 AC1-2 | ok |
| BOK-06 | 5.2 AC1-3, 5.4, 7.2 | ok |
| BOK-07 | 4.6, 4.7 AC3 | ok |
| BOK-08 (SHOULD) | 4.9 AC2 | ok |
| APP-01 | 5.3 AC1, 4.3 AC2 | ok (loading/error missing, H5) |
| APP-02 | 5.1 AC1, AC2, AC4 | ok |
| APP-03 | 5.1 AC3, AC5 | active-resource rule missing (H1) |
| APP-04 | 5.1 AC4, 4.8 AC2, 7.2 | ok |
| VIS-01 | 4.4, 4.10-4.13 | ok; CR-2 key sets asserted in 4.4, DOM check in 4.11 |
| VIS-02 | 4.3, 4.9, 5.4 | cancel slot in list missing (H4) |
| VIS-03 | 6.1 AC2, 6.3, 7.3 | ok |
| VIS-04 | 6.1 AC2 (boundaries, Å/Ø/Æ tie), 6.3, 7.3 | ok |
| VIS-05 | 6.2 AC1-3, 6.5, 7.3 | ok |
| VIS-06 (SHOULD) | 6.4 | ok |
| BR-1 | 1.2, 1.3, 4.5 (DST 2026-10-25 and 2027-03-28 under second TZ) | ok |
| BR-2 | 3.2 (created active), 4.1, 3.3 | approval half missing (H1) |
| BR-3 | 1.7, 4.1 AC5, 5.1, 5.2 | ok |
| BR-4 | 1.4/1.8, 2.1 AC3, 3.2, 4.1, 5.1, 5.2 | normalisation rules missing (M5) |
| BR-5 | 1.11 AC2, 3.2, 4.1, 4.2 AC3, 5.1 | ok |
| BR-6 | 2.3 AC1, 7.1 | ok |
| UI-1 | 2.4, 3.4, 3.5, 3.7, 4.9, 4.10, 5.3, 6.3, 6.5 = 8 pages | ok |
| UI-2 | 1.25 `[UI-2]`, 1.26, 7.4 | ok |
| UI-3 | per-story axe (see M8), 7.4, manual SR checklist | gaps 1.25/1.16/4.7 |
| UI-4 | 1.15, 1.27, per page | gaps (H5) |
| UI-5 | 1.13 `[UI-5]`, per page | ok |
| SEED-1 | 1.12 AC1 `[SEED-1]` | personas missing (H3) |
| SEED-2 | 1.12 AC3 | ok |
| RUN-1 | 1.28 `[RUN-1]`, 7.6 | ok |
| NFR-01 | 1.28 (CI matrix), 7.7 (macOS smoke, OQ-5) | ok |
| NFR-02 | 1.1 `[NFR-02]` | ok |
| NFR-03 | 2.3, 3.1/3.2, 4.2, 4.5, 5.5, 7.1 (all six families) | ok |
| NFR-04 | 1.9, 1.10, 2.1, 2.2, 2.5 | parameterisation missing (M6) |
| NFR-05 | 1.28, 7.6 (manual file) | ok |
| NFR-06 (SHOULD) | 7.5 | ok (L7) |
| Login throttling (SHOULD) | 2.2 (all of AD-12 incl. parallel reservation and rotating e-mails) | ok |
| E2E-01..10 | API: 4.5 (01,02,03,07), 5.5 (04,05,06,09), 3.3+4.1 (08); browser: 4.15 (01,02), 7.2 (04,05,06,09), 7.3 (08), 7.4 (10), 7.1 (07 sweep) | all parts have real AC text |

"All slices" rows: BR-4 (S00, S01, S02, S03, S05) and BR-5 (S00, S02, S03, S05) have parts in every mutating slice; UI-3 and UI-4 are claimed in every UI slice (gaps M8, H5); NFR-03 has parts in S01, S02, S03, S05, S07. E2E-07 is extended in S01 (2.3), S03 (4.5), S05 (5.5), S07 (7.1) and partly S02 (M16).

Rules checked and found delivered: CR-3 (cannot approve Expired: 5.1 AC3; shown "Utløpt" with reject only: 5.3 AC1; stays pending: 5.1 AC3; Member sees reason: 4.8 AC2, 7.2; excluded from counts: 6.1 AC2, 6.3 "+ 1 utløpt"; cancel refused: 5.2 AC3, 5.4 AC1); CR-2 (anonymous blocks with exact key sets 4.4, popover "Reservert" and no booker/purpose in the DOM 4.11); CR-4 (3.2); DEC-03, 04, 06 (except the Expired-reject rule), 07, 09, 14 (limits 80/200/200/seats), DEC-15 first half.

## 5. UX and architecture fidelity: 15 UX and 15 architecture spot checks

UX checks passed (quoted copy equals source): 4.7 "Tidsrommet er ikke lenger ledig. Velg et annet tidspunkt." and "Ressursen er ikke lenger tilgjengelig."; 5.3 "Forespørselen er allerede behandlet." and "Du kan ikke behandle din egen forespørsel."; 3.7 "Ressursen har 1 fremtidig booking og kan ikke arkiveres." with "Se bookinger"; 4.6 "klokken 14:00, utenfor bookingvinduet" and "Du kan booke inntil 30 døgn frem i tid."; 2.4 "Feil e-post eller passord.", "Økten er utløpt. Logg inn på nytt.", "Du er logget ut."; 4.8 "Forespørselen ble ikke behandlet før starttidspunktet.", "Statusen er oppdatert.", "Fant ikke bookingen."; 3.4 "Ingen ressurser matcher «projektor».", "Nullstill søk"; slot picker keyboard and names (4.6, 4.12 Home/End 08:00 and 21:30, PageUp/PageDown); week strip `tablist` (4.13); status vocabulary; routes of UX-DR8 (1.26); toast rules (1.15, 4.7); overlay and focus rules (1.16); chart tokens (6.4, DESIGN `warning-subtle`, dashed `warning`); availability strip colours (4.14 equals DESIGN.md). Misses: M9, M10, M11, M13, and "Til Hjem"/"Fant ikke siden.". No AC contradicts a UX source except 3.6 "Maks 200 tegn." (M11) and 4.8/5.4 (M12).

Architecture checks passed: AD-4 statuses and codes in 1.8/1.9/2.2/4.1/4.2/5.x; AD-5 horizon arithmetic, `osloWeekRange` in 4.4 and 1.3; AD-6 clock bans (1.3); AD-7 `BEGIN IMMEDIATE`, `Retry-After: 1` (1.5, 4.2); AD-8 trigger plus use-case double enforcement and the five evidence modes (4.2); AD-9 check order policy, status, start (5.1, 5.2); AD-10 archive guard and final archive (3.3); AD-11 cookie attributes, SHA-256, scrypt parameters (1.10, 2.1, 2.5); AD-12 (2.2); AD-13 CSP string, 421 before 403, body limits (1.9); AD-14 policy order (1.10); AD-15 key sets (4.4); AD-16 sorts and `truncated` (3.1, 4.3, 6.1); AD-17 event payloads (1.11, 5.1, 5.2); AD-19/20/26/27 (1.6, 1.7, 1.19-1.24, 1.28). Deviations: DEC-08 `>` (M3), AD-21 storage location (L3), PIL-12 (M1), AD-2 hygiene (M5), AD-18 `B-<id>` (L9).

## 6. Story quality

### 6.1 Eight largest or riskiest stories and whether to split

1. Story 1.13 Web data layer, strings and formatting (api client + session handling, key and invalidation barrels with a derived test, `format.ts`, clock, links, sheet, slots, i18n barrels). At least four sessions of work in one story; the whole web depends on it. Split: 1.13a `api/call`, session, clock, links, sheet/slots hooks; 1.13b keys + invalidation map + derivation test; 1.13c `i18n/format.ts` + `nb/` barrel.
2. Story 1.1 Scaffold (workspace scaffold, root configs, Node refusal, plus 12 custom ESLint rules each with failing and compliant fixture twins). The lint-rule suite is a story of its own. Split: 1.1 scaffold and green gate; 1.1b custom rules and fixtures.
3. Story 1.7 Whole schema, triggers and probe suite (six tables, around 15 triggers, probe SQL from a review file). Highest-consequence story (frozen, Jo-approved). Keep as one story (the epics argue it must be reviewed as a unit) but give it its own agent run and a review gate; otherwise split probes from DDL.
4. Story 1.4 Complete route and DTO contract set (16 routes, all request/response/error schemas, summary tool). Frozen artefact; large. Consider splitting by module (session/resources, bookings, activity/dashboard) with the summary tool last.
5. Story 1.23 Merge gate (throwaway merge candidate, JSON bound to tree hash, fast-forward push, annotated tag, ledger commit, replayed scenarios). Git-plumbing risk on Windows. Split: candidate and verification; landing, tagging and ledger.
6. Story 1.29 Hello-slice dry run + first real gate run + freeze package + human acceptance in one story with three Given blocks. Split the dry run from the first gate run and acceptance; the acceptance is a human step (see 6.3).
7. Story 4.2 Concurrency suites (barrel HTTP burst with two Members, cross-process lock holder, fault-injected writer, archive-versus-create). Flakiness risk and the least deterministic tests in the product; keep it one story but give each of the three ACs its own test file and a stated repetition count (L4).
8. Story 5.1 Approve and reject in one story (8 evidence parts, two routes, Expired rules, two race tests). Split: 5.1a approve (APP-02/03, race), 5.1b reject (APP-04, Expired, reason).

Near misses: 1.20 (trace.mjs with 23 fixture scenarios), 1.28 (scripts + CI + smoke + README), 4.5 (DST suite + four E2E scenarios + F2 contract finalisation + Jo gate in one story; split "evidence pack" from "F2 freeze package"), 4.10 + 4.12 (calendar grid and keyboard model), 4.1 (create + validation + conflicts + immutability).

### 6.2 AC specificity

Most ACs are concrete, testable and include error and edge cases (3.3, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2 are strong). Vague, unmeasurable or contradictory ACs are listed as H2, M2, M7, M11, M12, L2, L4, L5, L6, L7, L8.

### 6.3 ACs that need a human opinion (not auto-verifiable)

Gate S00-CP (Jo decision), 1.29 AC3 (Jo accepts S00), 4.5 AC3 (F2 package, Jo accepts S03, PIL-06 decision), 7.4 AC3 (screen-reader pass), 7.6 (fresh-clone tester), 7.7 AC2 (OQ-5 real-Mac decision), 7.8 AC2-3 (Jo chooses the MUST to trace, ORK review). These are correctly separated as human steps; 4.13 "mobile reading as approved by Jo" and the copy items in M10 are not and need a decision.

### 6.4 User value and template

All 75 stories and the gate use "As a / I want / So that" and Given/When/Then/And. Value statements are sensible; 33 stories are written for "a build agent" or "the pilot owner" (the foundation and evidence stories), which is honest given the pilot's purpose. No story lacks a "When".

## 7. Story Index accuracy (12 sampled rows plus targeted checks)

Rows checked against story text: 1.3, 1.7, 1.10, 1.12, 1.15, 1.25, 2.2, 3.6, 4.4, 4.9, 6.2, 7.2 (and 4.1, 4.5, 5.1, 5.3, 5.4, 6.1 for parts).
Matches: dependencies and Owns for 1.10, 3.6, 4.4, 6.1; evidence parts for 4.4, 4.9, 5.3, 5.4, 6.1; every part in a split pair (API at S03/S05, browser at S04/S07) appears in the Index with the right slice.
Mismatches: M16 (parts without AC, 1.7, 2.2, 3.2, 6.2, 1.12, 5.1). Owns cells: Story 1.15's `ui/{Button,Field,Alert,Toast,Skeleton,EmptyState,Badge}*` omits `Input`, `Select`, `Textarea` that its AC builds (line 2168); Story 1.17's omits `Card` (line 2170). The ownership test of Story 1.22 ("every path under apps/ ... owned exactly once") will fail on those files. Fix: add `Input*`, `Select*`, `Textarea*`, `Card*`.
Test-command syntax: `npm run test -- -t "\(@N\.M\)"` and `npm run test:e2e -- -g "\(@N\.M\)"` are regex-safe and collision-free (the closing parenthesis prevents `(@4.1)` matching `(@4.10)`); see M14 for env-var syntax and M15 for tag form. Requirement-state vocabulary (`evidenced`, `verified`, story `done`, slice `integrated`/`accepted`) is used consistently in the State model, Story 1.24, 7.7 and 7.8 and agrees with PRD section 10's meaning of `verified`.

## 8. Foundation epic and database principle

- Story 1.7 creating the whole schema is a stated, justified exception (lines 314, "Justified exceptions" (1)): frozen cross-slice contract (AD-19, PIL-06), triggers reviewable as a unit, SEED-1 needs every table, migration-range collisions. Step-04 calls this "WRONG" by default; the justification is explicit and I accept it.
- Epic 1 as a technical foundation epic is stated and justified (exception (2)); Stories 1.19-1.24 are labelled delivery controls. Concern (not a defect): Epic 1 is 29 of 75 stories on a single branch with Jo's acceptance blocking every other epic; the split recommendations in 6.1 (1.1, 1.13, 1.23, 1.29) reduce that risk without changing the structure.
- Technical-layer risk: Epics 4-6 are split by slice (user outcomes), not by layer; S03/S04 inside Epic 4 are layer-like (API versus UI) but justified by the architecture's slice plan and parallelism. File churn: `packages/contracts/src/bookings.ts`, `activity.ts`, `dashboard.ts` are touched by Story 1.4 (F1) and 4.4/4.5 (F2); `features/bookings/index.tsx` by 4.7, 4.8, 4.14 (same slice, serial); `modules/bookings/*` is partitioned by file per owner; `api/keys` and `i18n/nb` are per-owner barrels. The overlaps are intentional (two-step freeze, stub-first seams) and explained; no unjustified churn found.

## 9. Language and consistency

- No leftovers of the 65-story numbering found (`grep` for 65, 1.4-CP, T00-0x, suffixed story ids): the only "1.4-CP" is the deliberate gloss at line 312. Cross-references checked and correct: 1.1-1.24, 1.19-1.24, 1.29 (lines 312-314), Epic 4 intro (4.1-4.5 S03, 4.6-4.15 S04), Epic 5/6 independence statements, 5.4 "(Story 5.2)", 4.14 "(Story 4.7)", Gate S00-CP after 1.2-1.7, Index rows consistent with epic intros. Counts: 29 + 6 + 7 + 15 + 5 + 5 + 8 = 75 stories; 41 functional items, 6 NFRs, 10 E2E in the FR Coverage Map match the Inventory; AR1-AR30 and UX-DR1-31 counts match.
- FR Coverage Map agrees with the final stories (checked all 41 FR rows and E2E rows); Coverage Tables row `AR27` is incomplete (L11).
- British spelling in prose: consistent (normalises, behaviour, colour, authorisation, synchronous); no American variants found by grep. "dialog", "program" and similar are UI terms or absent.
- Norwegian strings are quoted exactly as in approved-copy.md and EXPERIENCE.md (section 5); invented strings are listed in M10.
