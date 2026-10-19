# Validation 3b: content, evidence and story quality of epics.md (delta re-validation, 76 stories plus Gate S00-CP)

Validator: fresh, independent, read-only (one report file written). Document: `_bmad-output/planning-artifacts/epics.md` (2,473 lines, `status: draft`). Authorities read in full: spec `docs/requirements.md` Part A, PRD (4.0-4.7, 7-10), EXPERIENCE.md, approved-copy.md, ARCHITECTURE-SPINE.md (AD-1..AD-28, Contract Minimums), AMENDMENT-2 and AMENDMENT-3, the UX `.working/content-pack.md` (cited by Story 1.12), step-04 rules. DESIGN.md was not re-read; the dashboard mock was grepped for one label. Part 1 was done before reading the previous report. Line numbers refer to epics.md.

## Verdict

The document is in good shape. Every MUST, SHOULD and all ten E2E scenarios reach a story with real AC text; every split evidence part (API at S03/S05, browser at S04/S07) exists as AC text; the approved Norwegian copy is quoted exactly (one label excepted); CR-2, CR-3, DEC-03/04/06/07/08/09/14/15 and EXPERIENCE Flows 0-6 are delivered. No blocker. There are 2 high findings, both about demo-data content that contradicts the browser stories, and 12 medium findings (traceability tags, ownership cells, bootstrap order, leftovers). Of the previous round's 5 highs, 3 are closed and 2 partial; of the 17 mediums, 11 are closed, 2 accepted-as-flagged, 4 partial.

| Tier | Count |
| --- | --- |
| Blocker | 0 |
| High | 2 |
| Medium | 12 |
| Low | 14 |

---

# PART 1 - FRESH LOOK

## 1. High

### H1. Story 7.3 archives "Gammel projektor", which Story 1.12 seeds as already archived (E2E-08 browser cannot pass)

Location: Story 7.3 AC1 (line 2182); Story 1.12 AC1 (line 660); EXPERIENCE Flow 6 step 5; content pack line 23.
Quotes: 7.3 "archiving 'Gammel projektor' succeeds, and the archived resource disappears from Ressurser and from the Booking sheet select while its history stays (`[E2E-08]` browser)". 1.12 "...and an archived 'Gammel projektor'". Content pack: "Archived (admin only): Gammel projektor (arkivert 2. okt. 2026)."
Why it matters: an already archived resource has no "Arkiver" action (3.7), archive again answers 409 `RESOURCE_ARCHIVED` (3.3), and it is already absent from Ressurser, so the Flow 6 climax and the MUST evidence part `E2E-08@S07` cannot be produced as written. The UX flow itself assumes it is active; the content pack says it is archived; the epics inherited both.
Fix (minimal): 7.3: replace the clause with "archiving a resource that has no future booking (the resource created in the same flow, or 'Whiteboard på hjul') succeeds, the row shows 'Arkivert', and it disappears from Ressurser and from the Booking sheet select; 'Gammel projektor' is listed under 'Arkiverte' from the start". Add "Gammel projektor" to the Gate S00-CP list of items for Jo (UX Flow 6 and the content pack disagree), because Flow 6 promises "its past bookings stay visible", which needs a seeded past booking on the archived resource or on a resource Jo names.

### H2. Story 1.12 points at "the named content of the UX content pack", but that pack contradicts the flows the browser stories run

Location: Story 1.12 AC1 (line 660); Story 4.15 AC1 (line 1835); Stories 7.2/7.3 (lines 2157-2188).
Evidence:
- The pack lists "Bekreftet · Fjellet · Ingrid · i dag 10:00-11:00 · 'Kundemøte Nordlys'" (the state after Flow 1). Story 4.15 books exactly that slot as Ingrid and expects 201 and the toast. A seeder that follows 1.12 ("named content of the UX content pack") makes Flow 1 a 409. Flow 1 step 3 also needs Fjellet 09:00-09:30 taken ("Reservert"); the pack has that booking on Fjorden (Jonas, standup), not Fjellet.
- 1.12 says "resources Fjellet, Fjorden, a projector, a camera and a podcast set that need approval". In the pack Projektor Epson is direct booking; the approval-gated ones are Lysgården, Kamera Sony A7 and Podkast-sett. The sentence can be read as "the projector needs approval".
- "8 resources (4 rooms, 4 equipment...)" and "an archived 'Gammel projektor'" together make 9 rows; the AC does not say "8 active plus 1 archived".
- 1.12 line 678-680 forbids later slices from editing the seed, so the free/taken pattern cannot be fixed later.
Why it matters: the data decides whether 10 MUST browser parts (E2E-01/02 at S04; E2E-04/05/06/08/09, VIS-03/04/05 at S07) can pass. This is the unclosed remainder of the previous H3.
Fix: in 1.12 AC1 replace the parenthesis with a closed list: "8 active resources (rooms Fjellet, Fjorden, Skogen, Lysgården; equipment Projektor Epson, Kamera Sony A7, Podkast-sett, Whiteboard på hjul; approval required: Lysgården, Kamera Sony A7, Podkast-sett) plus the archived 'Gammel projektor'; Fjellet has a confirmed 09:00-09:30 booking on the reference Monday and is otherwise free that day, in particular 10:00-11:00; Jonas's Fjorden standup is not required"; and add "pending requests: Ingrid on Podkast-sett (Wed 13:00-15:00), Jonas on Lysgården (Thu), Magnus on Kamera Sony A7 (Fri); Expired: Jonas on Lysgården (Mon 08:00-09:00)". State in the AC that the pack's example "Fjellet 10:00-11:00 Kundemøte Nordlys" is the outcome of Flow 1 and is NOT seeded.

## 2. Medium

### M1. Evidence parts claimed in the Story Index whose story has no AC that delivers or tags them
Location: Index rows 6.2, 1.7, 1.2, 2.2, 1.12, 2.3, 3.1, 3.2, 4.2, 4.5 (lines 2319, 2324, 2350, 2330, 2351, 2355-2356, 2363, 2366).
Evidence:
- `BR-5@S06` on 6.2: Story 6.2 is read-only and has no BR-5 AC (the transaction/audit writer is S00 plus mutating slices).
- `BR-5@S00` on 1.7: the probe AC names `[BR-3]`; the nearest is "a mismatching event subject".
- `BR-1@S00` on 1.2: no AC in 1.2 touches UTC/Oslo (the Oslo parts and DST arithmetic of `contracts/time.ts` are untested there; BR-1 is delivered in 1.3).
- `NFR-04@S01` on 2.2: no `[NFR-04]` anywhere in 2.1/2.2 although the cookie and hashing ACs exist.
- `SEED-2@S00` on 1.12: the `demo:reset` AC carries no tag.
- `NFR-03@S01/S02/S03` on 2.3, 3.1/3.2, 4.2, 4.5: no AC names `[NFR-03]`; only 5.5 and 7.1 do. Story 7.1 then requires "each NFR-03 family has at least one passing named test (`[NFR-03]`)".
- `E2E-08@S02` on 3.3 only covers the refusal; "Administrator creates ... catalogue updates" has no tagged S02 test.
Why it matters: `trace.mjs` fails (exit 1) on a MUST part with no passing test titled with the id. Tests are titled by what the AC says; without the tag the part is unsatisfied at the gate.
Fix: add the tags to the AC lines: 2.3 AC3 `[NFR-03]` (roles), 3.1/3.2 `[NFR-03]`, 4.2 `[NFR-03]` (collisions, concurrency, integrity), 4.5 AC1 `[NFR-03]` (UTC/local), 2.1 AC1 `[NFR-04]`, 1.12 AC3 `[SEED-2]`, 3.2 AC1 `[E2E-08]`; delete `BR-5@S06` from row 6.2 and `BR-1@S00` from row 1.2 (or add "Oslo parts, 30-day and 7-day arithmetic on milliseconds in `contracts/time.ts` are tested at DST edges `[BR-1]`" to 1.2), and either delete `BR-5@S00` from 1.7 or add "an activity event cannot exist for a missing booking (`[BR-5]`)".

### M2. UI-4 states still missing in Stories 3.4 and 4.8 (rest of the previous H5)
Location: Story 3.4 (lines 1376-1391); Story 4.8 (lines 1666-1687); Index rows 3.4 and 4.8 claim `UI-4@S02` / `UI-4@S04`.
Evidence: 3.4 has skeleton, filtered-empty and no-resources states but no failed-request "Prøv igjen" alert and no offline alert (EXPERIENCE State Patterns: Ressurser "default"). 4.8 has 404 and 403 but no "Skeleton of the key-value list" while loading. 3.5, 3.7, 4.6, 4.7, 4.9, 4.10, 5.3, 6.3, 6.5 do carry these. 3.6 (`UI-4@S02`) has no in-flight, server-error alert or archived-resource state.
Fix: add to 3.4 "**Given** a failed or offline request **When** the page loads **Then** the 'Prøv igjen' alert keeps the last good data and the offline alert appears (`[UI-4]`)"; to 4.8 "**Given** the booking is loading **Then** a skeleton of the key-value list appears after 150 ms (`[UI-4]`)"; to 3.6 "**And** while submitting the inputs are read-only and the button shows a spinner with `aria-disabled`; a server error renders in an alert above the button that receives focus".

### M3. A story that delivers only SHOULD parts cannot be descoped, contradicting PRD 6 and Amendment 3 A3-5
Location: Stories 2.2 (throttling, DEC-11 SHOULD), 6.4 (VIS-06 plus UI-3), 7.5 (NFR-06); landing ACs of 2.6, 3.7, 4.5, 4.15, 5.5, 6.5 (lines 1292, 1471, 1610, 1848, 1995, 2122); 4.15 AC3 (line 1846).
Evidence: PRD 6: SHOULD items "are listed as residual work if undelivered"; A3-5: "the default verification set and the gate require MUST parts only". But Story 1.24 refuses a candidate "or any story of which lacks `implemented`, `tested` and `reviewed` ledger entries"; so a descoped SHOULD story (2.2, 6.4, 7.5) blocks the whole slice. Story 4.15 AC3 says the S04 rows "(BOK-01 UI, BOK-07, BOK-08, ...) all pass" although BOK-08 is SHOULD. Login throttling has no part in `requirements.json` at all, so a missed 2.2 produces no residual-work line; PRD 6 says these are "last-in-slice" and 2.2 is second in S01.
Fix: add to 1.24 AC1 "a story whose only evidence parts are SHOULD may be recorded by Jo in the pilot log as descoped residual work and is then exempt from the ledger check"; change 4.15 AC3 to "all MUST rows pass and BOK-08 is reported as residual work if missing"; add a SHOULD part for throttling (for example `DEC-11-throttle@S01`, level SHOULD) on Story 2.2 and mention it in 1.19.

### M4. The delivery-ledger script is built after the things that need it; PIL-02 evidence fields are missing from its commands
Location: Gate S00-CP AC4 (line 534); Story 1.23 (lines 948-973); Index row 1.23 depends on 1.19, 1.22 (line 2341); Story 1.24 AC1 (line 985).
Evidence: (a) the gate requires the key `gate-s00-cp` "set by the orchestrator" and every S00 story after it "stays blocked", yet `ledger.mjs gate S00-CP done` exists only after 1.23 (which itself follows the gate). (b) The merge gate (1.24, first real run in 1.30) refuses a candidate unless every story of S00 has `implemented`, `tested` and `reviewed` entries; the entries for 1.1-1.22 were produced before the script existed and no backfill rule is stated. (c) PRD PIL-02 requires `tested @<sha> + verify run result` and `reviewed @<sha> + report path`; the commands in 1.23 AC1 take only `--sha`. (d) 1.23 "refuses `reviewed` without a `tested` entry for the same tree" is stricter than AD-20's "valid while no later commit changes a path in that story's Owns cell"; the two staleness rules can disagree.
Fix: add to Epic 1 "Gates and bootstrap" or 1.23: "Until Story 1.23 lands the gate key and the entries of Stories 1.1-1.22 are written by hand on main in the same format; Story 1.23 backfills them with `ledger.mjs` citing the original slice-branch commits (the commands accept any commit reachable from `slice/s00`)"; add `--result <text|path>` to `tested` and `--report <path>` to `reviewed`; replace "same tree" by "no later commit changed a path in the story's Owns cell".

### M5. Ownership cells that would break the "owned exactly once" test of Story 1.22
Location: Index rows 1.4, 4.4, 4.5, 1.11, 1.18, 7.5 (lines 2321, 2365, 2366, 2329, 2336, 2391).
Evidence:
- 1.4 Owns `packages/contracts/src/{...,activity,dashboard,...}.ts` without "(stub)"; 4.5 owns the same two files "(S03 until `s03-accepted`)". The Index preface says a path an S00 row creates for another slice is a `(stub)` recorded `createdBy: S00`. 1.4's AC also creates `schedule.ts` as a draft but the Owns cell omits it, while 4.4 owns it.
- `modules/bookings/index.ts` has no post-S00 owner. 1.11 creates it with "`BookingsReadPort` ... with stub bodies"; S06 (6.1) owns only `bookings-read.repository.ts`, which no S00 story is told to create. If the port bodies live in `index.ts`, S06 must edit an S00 file.
- 1.18 AC4 creates `e2e/<slice>.spec.ts` placeholders for S01-S07, but the owning stories name `e2e/auth.spec.ts`, `resources.spec.ts`, `bookings.spec.ts`, `approvals.spec.ts`, `overview.spec.ts`, `sweep.spec.ts`, `lifecycle.spec.ts`, `admin-and-overview.spec.ts`, `accessibility.spec.ts`; the placeholders get no owner.
- 7.5 Owns "measurement script" without a path; a script under `scripts/` is a frozen root script and would need `Freeze-Approved`.
Fix: mark `activity`, `dashboard`, `schedule` in row 1.4 as "(stub, owner S03 until `s03-accepted`)" and drop them from 4.5's Owns or keep them only there; in 1.11 say "the port methods delegate to `bookings-read.repository.ts`, an S00 stub owned by S06, so `bookings/index.ts` is never edited after S00" and add the file to the 1.11 Owns cell; in 1.18 name the placeholder files exactly as the owning stories do (or drop the placeholders); give 7.5 the path `e2e/measure-lookups.mjs` (e2e is exempt from the root-script freeze).

### M6. Leftover "S03 test helper" in five stories; the helper is S00's `booking-fixtures.ts`
Location: Stories 4.8 AC2 (line 1679), 4.9 AC1 (1697), 4.10 AC2 (1730), 6.1 AC3 (2025), 6.2 AC1 (2036). Correct reference: Story 1.12 AC3 (line 668) and 3.3/5.1 ("S00 booking-fixture helper").
Why it matters: a slice agent searching for an S03 helper will not find one (Amendment 3 moved it to S00) and may create a duplicate; S04/S06 must not wait for S03 code.
Fix: replace "S03 test helper" by "S00 booking-fixture helper (`insertBooking`)" in those five places.

### M7. Browser stories 7.2 and 7.3 rely on data that neither Story 1.12 seeds nor the stories say to create
Location: Story 7.2 (lines 2157-2170); Story 1.12 line 660 and 678-680.
Evidence: 7.2 needs two future bookings by Ingrid ("tomorrow's booking from Mine bookinger and from the Booking detail sheet"), a booking by Jonas for Magnus to cancel, and a pending request by Ingrid that Sofie rejects (the pack's Kamera request by Ingrid is already "Avslått", and her Podkast-sett request is approved in Flow 3). 7.3 needs "Fjorden with a confirmed booking tomorrow" (1.12 seeds it) but Flow 6 also wants history on the archived resource. 1.12 forbids editing the seed, and says later slices use "their own test helpers", but 7.2/7.3 do not say that the specs create these rows through the API or fixtures.
Fix: add to 7.2/7.3 "the spec creates the rows it needs through the S00 booking-fixture helper or the API; only the base seed of Story 1.12 is assumed", and list which seeded rows each flow uses (Podkast-sett request for Flow 3; Magnus's Kamera request for the own-request check; the Expired Lysgården request for the Expired variant).

### M8. Two ACs still depend on later stories
Location: Story 1.26 AC3 (lines 1038-1041); Story 1.8 AC2 (lines 549-552).
Evidence: 1.26 (shell) requires "`/logg-inn` shows 'Du er logget ut.' or the matching message" but the router is Story 1.27 and the login page Story 2.4 (S01); `DELETE /api/session` is a 501 stub. 1.8 says `GET /api/session` is an "S00 handler", but its implementation is Story 1.10 (which depends on 1.8).
Fix: 1.26: "navigates to `/logg-inn` carrying the sign-out message key; the rendered text is asserted in 2.4 and 2.6" (component test with a stubbed session); 1.8: "`GET /api/health` is an S00 handler; `GET /api/session` is registered as a stub until Story 1.10".

### M9. The approvals queue needs list fields that Story 4.3 does not promise
Location: Story 4.3 AC2 (lines 1554-1557); Story 5.3 AC1 (line 1932).
Evidence: 5.3 shows requester, purpose and "Sendt for 2 t siden" from `GET /api/bookings?scope=all&status=pending` (S03), but 4.3 only says the items are `BookingDto`s with resource summary, `expired`, `decision`, `cancellation`; `booker.name` and `createdAt` appear only for `GET /:id`. S05 cannot change the frozen contract.
Fix: add to 4.3 AC2 "for an Administrator the items also carry `booker.name`, `purpose` and `createdAt`; a Member's list items never carry `booker`".

### M10. Story size: Story 1.13 and 1.1 remain oversized; riskiest eight
Evidence: Story 1.13 has six ACs for six concerns (API client and session handling, key and invalidation barrels with a derived test, `i18n/format.ts`, clock/links/sheet/slots hooks, file inventory, web test helper). Story 1.1 holds a scaffold plus roughly 14 custom ESLint rules each needing a failing and a compliant fixture.
Riskiest eight (size and consequence): 1.13, 1.1, 1.7 (frozen whole schema, about 15 triggers), 1.4 (frozen, 16 routes), 1.24 (git plumbing on Windows), 1.20 (trace with 23 fixture scenarios), 1.29 (start scripts, README, CI, smoke), 4.2 (nondeterministic concurrency suites). Near misses: 5.1 (two routes, 8 parts), 1.30 (three Given blocks, two human acts), 4.5 (DST suite, four E2E scenarios, F2 package).
Fix: accept as is with a note, or split 1.13 into (a) `api/call`, session, clock, links, hooks; (b) keys, invalidation map and derivation test; (c) `format.ts`, `nb` barrel and web test helper; and 1.1 into scaffold and custom lint rules. Keep 1.7 as one story with its own review.

### M11. Unmeasurable or mechanism-free ACs
Location: Story 4.2 AC1 (line 1529): "repeats enough times to expose ordering faults" and "for any interleaving"; Story 2.4 AC3 (line 1240): the countdown "also survives a refresh" (the client cannot know the delay without storage or a retry; nothing specifies either); Story 4.10 AC1 "default last viewed" resource (no storage mechanism; AD-21 puts guarded storage in `app/`, features may not import it).
Fix: 4.2 "repeats the burst 25 times"; 2.4 "the deadline is kept in guarded `sessionStorage` under `ui/` ... or drop the clause"; 4.10 "the last viewed resource id is kept in guarded `localStorage` through a `ui/` helper".

### M12. Story 7.7 AC2 asks for an evidence file entry before the branch that creates the file
Location: lines 2257-2260. Quote: the decision is recorded "in `pilot-log.md` and as the first lines of `manual-evidence/NFR-01.md` before `slice/s07` is branched". `manual-evidence/NFR-01.md` is owned by S07 and is created on `slice/s07`.
Fix: "recorded in `pilot-log.md` before `slice/s07` is branched and copied as the first lines of `manual-evidence/NFR-01.md` when that file is created".

## 3. Low

- L1. Story 6.3 AC2 quotes the stat label "Bekreftede neste 7 dager" (line 2065); the UX mock reads "Bekreftede bookinger" with the note "neste 7 dager". Fix: quote the mock wording.
- L2. Toast placement (bottom-right on desktop, above the tab bar on mobile; UX-DR24) is in no AC; Story 1.15 AC3 lists duration and behaviour only (rest of previous M9).
- L3. Axe or Tab-order is not stated for Story 1.16 (sheet/dialog focus), 1.26 (shell) and 4.7 (Booking sheet) although each claims `UI-3`; covered only by the blanket Definition of Done (rest of previous M8). Add one line each.
- L4. Story 4.10 AC2 (line 1733): "the week of 2026-10-25 renders 25-hour Sunday correctly in the grid" is meaningless for a fixed 08:00-22:00 grid; "blocks under 30 minutes show the title only" cannot occur (minimum 30 minutes). Replace with "a 10:00-11:00 booking on Sunday 2026-10-25 renders in the 10:00 row".
- L5. Oracle-less ACs: 6.4 AC3 (greyscale/forced colours; assert `stroke-dasharray` on the pending series), 7.4 AC1 "768-1023 px band does not break" and AC3 "contrast rechecked" (name an axe run at 900 px and a token contrast script), 7.5 p95 200 ms (mark informational so it cannot fail `--release`).
- L6. AD-21 says guarded `localStorage` lives in `app/`; Story 1.17 AC3 (line 814) and 6.4 put it in `ui/`. The epics reading is the workable one; record it as an AD-21 clarification.
- L7. Layout leftovers: stray line `#` under `## Epic List` (lines 306-307) with no epic summary list; `stepsCompleted` lacks `step-04-final-validation`; Story 1.23's last Then (line 973) has no full stop and no `And`.
- L8. No `test` or `test:e2e` script is defined by any AC although the Index test-command convention uses them (line 2313); the stack note of Story 1.1 does not record the verified PowerShell/cmd quoting of `-t "\(@N\.M\)"`.
- L9. Carried from the previous round and still absent: the `B-<id>` formatter in Story 1.13 `format.ts` (AD-18, Flow 3 "booking B-1047"); a `no-alert` lint fixture in 1.1 (UX-DR29); the non-loopback `FELLES_HOST` refusal in 1.12 (AD-25); "login and logout write no event" in 2.1 (AD-17); "resource names are not unique" in 3.2 (AD-10); a cancel reason over 200 characters in 5.2 (DEC-14).
- L10. Story 4.5 repeats the PIL-06 decision sentence in AC3 and AC5 (lines 1608 and 1613).
- L11. `GET /api/session` shape differs: 1.10 returns `{ user, serverNow, demoData }`, Story 2.5 AC1 (line 1257) says `{ user: null, serverNow }`. Write `{ user: null, serverNow, demoData }`.
- L12. Index row 4.6 omits `UI-5@S04` while its AC tags `[UI-5]` (line 1636); row 4.14 (strip) has no loading-state AC although EXPERIENCE gives "Skeleton header and strip".
- L13. Story 1.2 (`time.ts` Oslo parts) and 1.12 AC (`SEED-1` "8 resources" vs the archived row) wording: say "8 active resources plus 1 archived" (see H2).
- L14. Story 1.23 `blocked` reading: sprint-status native states carry no `blocked`; say "reads as blocked in the ledger view" so PIL-02's "no custom states" holds.

## 4. Checks performed (Part 1)

### 4.1 MUST and E2E to AC (all found)
AUT-01 2.1/2.4/2.6; AUT-02 2.1/2.3/2.5; AUT-03 1.10/2.3/3.1/4.3; AUT-04 1.26/2.1 AC5/2.5/2.6; RES-01..04 3.1-3.7 (RES-04: 3.3, 4.1 AC4, 7.3); BOK-01 4.1/4.7; BOK-02 1.2/4.1/4.5; BOK-03 1.2/4.1/4.2; BOK-04 4.2; BOK-05 4.1/5.1; BOK-06 5.2/5.4/7.2; BOK-07 4.6/4.7/4.14; APP-01 5.3 (+4.3); APP-02..04 5.1/5.3; VIS-01 4.4/4.10-4.13; VIS-02 4.3/4.8/4.9/5.4/7.2; VIS-03/04 6.1/6.3/7.3; VIS-05 6.2/6.5/7.3; BR-1..6 (see M1 for gaps); UI-1 eight pages: 2.4, 3.4/3.5, 3.7, 4.10, 4.9, 5.3, 6.3, 6.5; UI-2 1.26/1.27/7.4; UI-3/UI-4/UI-5 per slice (UI-4 gaps in M2); SEED-1 1.12; RUN-1 1.29/7.6; NFR-01 1.29/7.7; NFR-02 1.1; NFR-03 per slice (tags in M1); NFR-04 1.1/1.9/1.10/2.1/2.5; NFR-05 7.6; E2E-01/02 4.5+4.15, E2E-03 4.2+4.5, E2E-04/05/06/09 5.5+7.2, E2E-07 2.3, 3.2, 3.3, 4.5, 5.5, 7.1, E2E-08 3.3, 4.1, 7.3, E2E-10 7.4.
SHOULD: RES-05 3.4, BOK-08 4.9 (`[BOK-08]`), VIS-06 6.4, NFR-06 7.5, throttling 2.2 (see M3).
Split evidence parts: every API part (4.5 for E2E-01/02/03/07, 5.5 for E2E-04/05/06/09) and browser part (4.15, 7.2, 7.3, 7.4) exists as AC text. "All slices" rows: BR-4 and BR-5 in every mutating slice; UI-3/4/5 in every UI slice; NFR-03 in S01, S02, S03, S05, S07.
CR-3: Expired approve refused (5.1), reject with reason (5.1), listed with Utløpt and reject only (5.3), excluded from counts and chart (6.1, 6.3 "+ 1 utløpt"), cancel refused as `BOOKING_STARTED` (5.2, 5.4). CR-2: exact key sets (4.4), popover without booker (4.11), sweep (7.1). DEC-03/04/06/07/08/09/14/15: all delivered; DEC-08 `>` flagged for Jo (Gate AC4 and 4.1); DEC-15 both halves (4.1, 3.2).

### 4.2 UX and architecture spot checks (15 and 15) - no contradiction found except those listed
UX passed: approved copy for `BOOKING_CONFLICT`, `RESOURCE_ARCHIVED`, `RESOURCE_HAS_FUTURE_BOOKINGS` (singular), `BOOKING_NOT_PENDING`, `OWN_REQUEST`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`; slot name "klokken 14:00, utenfor bookingvinduet" and the 30-day hint; status vocabulary; routes and `?booking=`; slot-picker and calendar keyboard models (Home/End 08:00 and 21:30, PageUp/PageDown); week-strip tablist; popover content; Reason and Confirm dialog focus; toast rules; pill name "Godkjenninger, 3 venter" and Mer dot; "Til Hjem"/"Fant ikke siden."; Hjem "+ 1 utløpt"; Flow 0-6 sequences. Architecture passed: AD-4 statuses and details; AD-5 horizon (08:00 on 2026-11-18 = `now + 30 × 24 h`, 08:30 refused); AD-6 clock bans; AD-7 `BEGIN IMMEDIATE`, `Retry-After: 1`; AD-8 five evidence modes; AD-9 check order (policy, status, start, resource); AD-10; AD-11 cookie attributes and purge; AD-12 10 s, doubling, 5 min cap, parallel reservation; AD-13 Host before Origin, CSP; AD-14; AD-15 key sets; AD-16 sorting, `truncated`, Å/Ø/Æ; AD-17 payloads; AD-20 gate prerequisites and `Freeze-Approved` ids; AD-26 exit codes; A3-5 SHOULD (violated only in M3).

### 4.3 Index accuracy (15 rows sampled: 1.3, 1.4, 1.11, 1.12, 1.18, 1.23, 2.2, 3.6, 4.4, 4.5, 4.14, 5.4, 6.1, 6.2, 7.5)
Dependencies correct for 1.3, 3.6, 4.4, 4.14, 5.4, 6.1; evidence parts correct for 3.6, 4.4, 5.4, 6.1; mismatches in the other rows are M1 and M5. Tag convention: `(@N.M)` is used consistently, collision-free (closing parenthesis); `--slice` form copyable on Windows. State model versus Story 1.23: consistent except M4 (staleness rule, PIL-02 fields, bootstrap order). Owns cells of the previous round (Input/Select/Textarea, Card) are fixed.

### 4.4 Spelling and strings
No American spellings found by grep (colour, behaviour, authorisation, normalise); "authorization" occurs only as the HTTP header name. Norwegian strings are exact except L1. Cross-references to old numbering: none (the only "1.4-CP" is the deliberate gloss); "S03 test helper" is the remaining wrong reference (M6).

---

# PART 2 - CLOSURE OF THE PREVIOUS ROUND (epics-validation-2b-content.md)

## High findings

| ID | Status | Evidence |
| --- | --- | --- |
| H1 (5.1 active-resource and archived-reject) | CLOSED | Story 5.1 AC6: "Given a pending booking whose resource has become archived (state built with the S00 booking-fixture helper...) ... Then the response is 409 `RESOURCE_ARCHIVED` and the booking stays `pending` (`[BR-2]`, `[APP-03]`) And reject on the same booking succeeds with a reason because rejecting needs no active resource (DEC-06)." |
| H2 (2.3 AC3 infeasible in S01) | CLOSED | Story 2.3 AC3 now tests `policy.can` for every action, role and ownership combination and says "the foreign-booking 403 for every status is evidenced in S03, S05 and S07 where those routes exist". |
| H3 (named personas and resources in seed) | PARTIAL | Story 1.12 AC1 now names "users Ingrid, Magnus, Sofie and Jonas; resources Fjellet, Fjorden, a projector, a camera and a podcast set that need approval, and an archived 'Gammel projektor'; a confirmed Fjorden booking on the day after the reference instant; three pending requests and one Expired request". Remaining: the Flow 1 pattern (Fjellet free 10:00-11:00) is not fixed and the pack contradicts it, the projector wording, and 7.3 archives the seeded archived resource (see H1, H2, M7 of this report). |
| H4 (BookingActions in Mine bookinger and Hjem rows) | CLOSED | Story 4.9 AC3: "each `BookingRow` receives its `actions` node from the `BookingActions` slot hook, so 'Avbestill' appears ... once the owning slice implements it"; Story 6.3 AC3 repeats it for Hjem. |
| H5 (UI-4 states) | PARTIAL | Added: 5.3 AC4 "a skeleton of three rows, the 'Prøv igjen' alert and the offline alert"; 3.5 AC4 loading and failure; 4.6 AC3 and 4.7 AC3 skeletons. Still missing: failed/offline state in 3.4 and the loading skeleton in 4.8 (see M2). |

Closure count, highs: 3 CLOSED (H1, H2, H4), 2 PARTIAL (H3, H5), 0 OPEN.

## Medium findings

| ID | Status | Evidence |
| --- | --- | --- |
| M1 (gate checks tested/reviewed) | CLOSED | Story 1.24 AC1: "refuses a candidate whose prerequisite slices ... lack an `sNN-accepted` tag or any story of which lacks `implemented`, `tested` and `reviewed` ledger entries citing commits reachable from the candidate tip". |
| M2 (horizon boundary) | CLOSED | Story 4.5 AC1: "a booking at the last bookable start `2026-11-18 08:00` Oslo succeeds and a start at 08:30 on the same day fails with the horizon error". Arithmetic verified. |
| M3 (DEC-08 `>` versus `>=`) | ACCEPTED-AS-FLAGGED | Gate S00-CP AC4 lists "the AD-5 reading that a booking must start strictly after now (`start > now`) where the PRD default DEC-08 says `start ≥ now`"; Story 4.1 last AC repeats it. |
| M4 (DEC-15 second half) | CLOSED | Story 4.1 AC6: "one Member and two active resources ... overlapping times are booked on the different resources ... both bookings succeed (DEC-15)". |
| M5 (AD-2 input hygiene) | CLOSED | Story 1.4 AC2: values "trimmed and NFC-normalised, control and bidi characters are rejected, `""` becomes `null`, and each field's maximum length is enforced (email 254, name 80, description 500, purpose 200, reason 200) (`[BR-4]`) And unknown keys are rejected". PATCH omission versus null: Story 3.2 AC3. |
| M6 (parameterised SQL evidence) | CLOSED | Story 1.1 AC3 fixture list: "template literals with expressions passed to `prepare`/`exec` (`[NFR-04]` parameterised SQL)". |
| M7 (1.25 AC3 depends on page) | PARTIAL | Now Story 1.26 AC3 adds "tested with a stubbed session", but still says "`/logg-inn` shows 'Du er logget ut.'" while the router is 1.27 and the page 2.4 (see M8 of this report). |
| M8 (a11y ACs for shell, 1.16, 4.7) | PARTIAL | Shell now has aria-current, Mer `aria-haspopup`, scroll padding (1.26 AC1, AC2, AC4) and Playwright viewport checks; no axe or Tab-order line in 1.26, 1.16, 4.7 (see L3). |
| M9 (accessible names and state texts) | PARTIAL | Added: 1.26 AC4 "Godkjenninger, 3 venter" and "3 ventende godkjenninger", scroll padding 56/64; 1.27 AC1 "Til Hjem" and "Fant ikke siden.". Missing: toast placement in 1.15 (see L2). |
| M10 (copy introduced by the epics) | ACCEPTED-AS-FLAGGED | Gate S00-CP AC4: "it also lists what no source fixes ... the toast texts 'Ressursen er opprettet.', 'Ressursen er lagret.' and 'Ressursen er arkivert.', the slot-picker refusal texts, the `?ny=1` address parameter". |
| M11 ("Maks 200 tegn." generic) | CLOSED | Story 3.6 AC2: "over-limit text shows 'Maks {n} tegn.' with the field's own limit (80 for name, 500 for description)". |
| M12 (who renders "Book igjen") | CLOSED | Story 4.8 AC3: "it renders 'Book igjen' itself when the booking is past or in a final status and hosts the frozen `BookingActions` slot ... for 'Avbestill' only"; 5.4 AC1 agrees. |
| M13 (5.3 refusal alerts) | CLOSED | Story 5.3 AC5: "inline alerts show the approved messages for `BOOKING_STARTED` and 'Du kan ikke behandle din egen forespørsel.'". |
| M14 (Windows-copyable slice command) | CLOSED | Story 1.20 AC2: "`verify:full` ... accepts `--slice <slice>` as an alternative to `FELLES_SLICE` so the command is copyable on Windows"; Index test commands use `npm run verify:full -- --slice <slice>`. Residual quoting note is L8. |
| M15 (tag form) | CLOSED | Story 2.6 AC2: "every test title carries its requirement id and the story tag `(@2.6)`"; Index uses `(@N.M)`. |
| M16 (parts claimed without AC) | PARTIAL | Fixed: `E2E-07@S02` (3.2 AC1 now covers PATCH; 3.3 AC3 covers archive), `BOK-05@S05` now in Index row 5.1. Still open: `BR-5@S06` on 6.2, `BR-5@S00` on 1.7, `NFR-04@S01` on 2.2, `SEED-2@S00` untagged (see M1 of this report). |
| M17 (duplicate evidence part) | CLOSED | Story 1.19 AC2: "a part listed on several stories is satisfied when its named test exists on the slice branch, the generator recording all providing stories". |

Closure count, mediums: 11 CLOSED (M1, M2, M4, M5, M6, M11, M12, M13, M14, M15, M17), 2 ACCEPTED-AS-FLAGGED (M3, M10), 4 PARTIAL (M7, M8, M9, M16), 0 OPEN.

## Previous lows still present (carried into this report)
L2 (2.4 countdown, now M11), L3 (storage location, now L6), L4 (4.2 "enough times", now M11), L5 (4.10 25-hour Sunday, now L4), L6 and L8 and L7 (7.4, 6.4, 7.5 oracles, now L5), L9 (`B-<id>`) and L10 (misc) now L9, L11 (stray `#`, `stepsCompleted`) now L7. Fixed since: Owns cells for 1.15 and 1.17, `inputDocuments` now lists the amendments, "Stories 1.1-1.29 are verified with `verify`" (L13 of the previous round).
