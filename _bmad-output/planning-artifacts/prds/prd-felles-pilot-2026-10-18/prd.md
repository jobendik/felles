---
title: FELLES
status: final
created: 2026-10-18
updated: 2026-10-19
---

# PRD: FELLES

## 0. Document purpose

This PRD frames the FELLES pilot for BMad planning and for handoff to implementation agents. It **builds on, and does not replace,** `docs/requirements.md` (Norwegian, v1.0). Part A of that file stays **authoritative for product scope and behaviour**; requirement IDs (AUT-01 … NFR-06, E2E-01 … E2E-10) are kept unchanged. The PRD may only *clarify* the spec where it is silent. Any *change* to an original requirement is proposed in the Requirement Change Register (§9.1) under that requirement's ID and takes effect only after Jo approves it. **One product change is approved (CR-3); NFR-01 is explicitly preserved (CR-1); CR-2 and CR-4 resolved as no change to the spec.** Part B of the spec (slices, agent rules, ORK criteria) is guidance; §7–8 and §10 restate the parts this PRD relies on.

## 1. Vision

FELLES is a small responsive web app where members of a 5–30 person office community find, book and manage shared rooms and equipment. Some resources book instantly; others need an Administrator's approval. It runs locally on real SQLite data, in Norwegian, and must feel like a finished product rather than a technical demo.

FELLES is also the test subject for a **reusable AI-assisted delivery workflow**: BMad planning, handoff to Agent Orchestrator, parallel agents in isolated Git worktrees, progress tracking, independent review and verified delivery. A working app is necessary but not sufficient: the pilot succeeds only if we can show, for each requirement, who built it, what changed, which tests prove it and when a human accepted it (§10).

## 2. Target user

### 2.1 Jobs to be done
- **Member:** get a room or equipment for a specific time without emailing around, and know it is really mine.
- **Administrator:** keep shared resources fair and available; approve or decline requests; see what is going on.
- **Pilot owner (Jo):** judge whether this workflow is trustworthy enough to reuse on bigger projects.

### 2.2 Non-users (v1)
Anonymous visitors, external guests, multiple organizations.

### 2.3 Key user journeys
*Derived from the spec's E2E scenarios; names are illustrative.*

- **UJ-1. Ingrid books a meeting room.** Member Ingrid logs in, finds a room, sees free time in the week view, books 10:00–11:00. It is `confirmed` at once and appears in Mine bookinger. If someone else books an overlapping time first, the server refuses with a clear conflict message and nothing changes. *(E2E-01/02/03)*
- **UJ-2. Ingrid asks for approval-gated equipment.** She books the projector; it is `pending` and blocks the slot. Administrator Magnus approves it, or rejects it with a reason Ingrid can read. *(E2E-04/05)*
- **UJ-3. Magnus keeps the house in order.** He checks the dashboard, processes the approval queue (never his own request; Administrator Sofie must), creates a resource, tries to archive one with a future booking and is refused, then archives another. He also cancels a member's booking and must give a reason. *(E2E-08/09, BOK-06)*
- **UJ-4. Ingrid changes her mind.** She cancels a future booking; the slot frees up and history keeps the record. *(E2E-06)*

## 3. Glossary

- **Member** — user with role `member`. **Administrator** — role `admin`; has all Member rights.
- **Resource** — one concrete room or equipment unit (`kind`: `room` | `equipment`; the spec's "kategori"); `active` or `archived`; held by at most one Booking at a time.
- **Approval Requirement** — Resource flag `approvalRequired`.
- **Booking** — time-bounded reservation of one Resource by one user. Status `pending`, `confirmed`, `rejected`, `cancelled`. Transitions: `pending → confirmed | rejected | cancelled`; `confirmed → cancelled`; `rejected` and `cancelled` are final. Bookings are never deleted and their times are never overwritten.
- **Blocking status** — `pending` or `confirmed`.
- **Expired request** — a `pending` Booking whose start has passed (derived label "utløpt", not a stored status; CR-3). It cannot be approved but can be rejected with a reason.
- **Activity Event** — immutable audit record (actor, timestamp, entity ID, type), written in the same transaction as the change.
- **Local time** — `Europe/Oslo`; storage is UTC.
- **Slice / Story** — slice S00–S07 is a delivery increment (§4.0); a story is the unit of work and ownership that the epics step derives from it (spec: "task").
- **Delivery status** — a story's lifecycle state (§7), separate from **agent runtime status** (what an agent session is doing).

## 4. Features and requirements

Acceptance text for every ID is in `docs/requirements.md` and is authoritative. The Amendment column points only to **clarifications** (§9, DEC); proposed changes are in §9.1. **Owner** is the slice responsible; the epics step refines it to stories, each MUST getting named acceptance evidence.

### 4.0 Slice map (adopted from spec §11, §14)
| Slice | Delivers | Depends on |
|---|---|---|
| S00 | Repo, schema and migrations, shared contracts, seed, scripts, verify gate, CI workflow file, app shell/navigation/layout, activity-event writer | – |
| S01 | Authentication and roles | S00 |
| S02 | Resource catalog and administration | S00 |
| S03 | Booking engine and conflict control | S01, S02 accepted |
| S04 | Booking UI, calendar, Mine bookinger | S03 |
| S05 | Approval and cancellation | S03 |
| S06 | Activity log, dashboard, chart | S03 |
| S07 | Integration, UX/a11y/security verification, documentation | S04, S05, S06 |

Parallel work is written S01 ∥ S02 (S01 and S02 in parallel). Acceptance gate: S03 starts only when S01 and S02 are *accepted* by Jo (ORK-02), so S01 ∥ S02 parallelism covers building, not acceptance; the waiting time this gate adds is measured (PIL-07).

Spec phases: **A** planning; **B** S00–S03 (first vertical cut); **C** S04–S06 (parallel); **D** S07.

### 4.1 Access and roles
| ID | Priority | Capability | Clarification | Owner |
|---|---|---|---|---|
| AUT-01 | MUST | E-mail/password login; generic error | DEC-11 | S01 |
| AUT-02 | MUST | Session required for API; logout; unauthenticated requests cannot read booking or user data (spec §4) | DEC-11 | S01 |
| AUT-03 | MUST | Server-enforced roles | – | S01 (policy); enforced in every slice |
| AUT-04 | MUST | Name + role shown; session survives refresh | – | S01 |

### 4.2 Resource catalog and administration
| ID | Priority | Capability | Clarification | Owner |
|---|---|---|---|---|
| RES-01 | MUST | Browse, search, filter, detail | – | S02 |
| RES-02 | MUST | Resource fields incl. `approvalRequired`, status; seats optional (CR-4: no restriction) | DEC-14 | S02 |
| RES-03 | MUST | Admin create/edit with field errors | DEC-14 | S02 |
| RES-04 | MUST | Archive only without future `pending`/`confirmed` Bookings; archived Resources cannot be booked and are hidden from the catalog | DEC-06, DEC-18 | S02: archive endpoint and future-booking guard, tested against the S00 Booking schema with directly inserted rows. S03: booking engine rejects archived Resources (`RESOURCE_ARCHIVED`) |
| RES-05 | SHOULD | Approval indicator in list | – | S02 |

### 4.3 Booking and conflict control
| ID | Priority | Capability | Clarification | Owner |
|---|---|---|---|---|
| BOK-01 | MUST | Create booking (resource, date, start, end, purpose); Resource must be active (spec §4) | DEC-14 | S03 API, S04 UI |
| BOK-02 | MUST | Time-window and duration rules | DEC-08, DEC-09 | S03 |
| BOK-03 | MUST | No overlap among blocking Bookings (`startA < endB && startB < endA`) | – | S03 |
| BOK-04 | MUST | Atomic conflict check under concurrency | DEC-12 | S03 |
| BOK-05 | MUST | `confirmed` vs `pending` by Approval Requirement | DEC-15 | S03 |
| BOK-06 | MUST | Owner/Admin cancellation before start; Admin reason for others' | DEC-07 | S05 API + UI |
| BOK-07 | MUST | Availability display and clear responses; server is truth | – | S04 |
| BOK-08 | SHOULD | Rebook from earlier Booking | – | S04 |

### 4.4 Approval
| ID | Priority | Capability | Clarification | Owner |
|---|---|---|---|---|
| APP-01 | MUST | Pending queue for Administrators; Expired requests stay listed, marked "utløpt", reject only | CR-3 | S05 |
| APP-02 | MUST | Approve / reject; rejection needs reason (also for Expired requests); approval records Administrator and time; not own Booking | DEC-14, CR-3 | S05 |
| APP-03 | MUST | Only `pending` is processable; no double processing; Resource must still be active and the time valid. Approval after start is refused (`BOOKING_STARTED`) | CR-3 | S05 |
| APP-04 | MUST | Rejection frees slot; Member sees reason | – | S05 |

### 4.5 Calendar, overview, activity
| ID | Priority | Capability | Clarification | Owner |
|---|---|---|---|---|
| VIS-01 | MUST | Week view per Resource, navigation, status; other members' Bookings appear as anonymous "Reserved" blocks | DEC-03, CR-2 | S04 |
| VIS-02 | MUST | Mine bookinger, upcoming first, detail/cancel | – | S04 owns the module and exposes a cancel slot; S05 supplies the action |
| VIS-03 | MUST | Start page: upcoming Bookings + Resources; Admin pending count (approvable only; Expired requests excluded) | DEC-04, CR-3 | S06 |
| VIS-04 | MUST | Admin 7-day panel (confirmed count, pending approvals, top 3 Resources); Expired requests excluded from pending | DEC-04, CR-3 | S06 |
| VIS-05 | MUST | Activity log, scoped by role (Members: own Bookings; Administrators: all) | DEC-03 | Writing: S00 writer + every mutating slice; reading/UI: S06 |
| VIS-06 | SHOULD | Activity chart with text alternative | – | S06 |

### 4.6 Foundation, seed, rules and quality (spec §4–§8, given stable IDs for traceability)
| ID | Pri | Capability (spec source) | Owner |
|---|---|---|---|
| BR-1 | MUST | UTC storage, Oslo display, DST handled; tested around one summer/winter switch (§4) | S00 helpers, S03 tests |
| BR-2 | MUST | Active Resources only at creation and approval; no hard delete of Resources with history (§4) | S02, S03, S05 |
| BR-3 | MUST | Bookings are never overwritten or deleted; change = cancel + new (§4) | S03, S05 |
| BR-4 | MUST | All mutations validated server-side with structured errors (§4) | every slice; format set in S00 |
| BR-5 | MUST | Audit event and data change in one transaction (§4) | S00 writer; each mutating slice |
| BR-6 | MUST | No unauthenticated read of booking/user data (§4) | S01; route-enumeration test in S07 |
| UI-1 | MUST | 8 pages (§5): Login S01; Resources + detail S02; Resource admin S02; Calendar S04; Mine bookinger S04; Approvals S05; Dashboard S06; Activity S06 | per page |
| UI-2 | MUST | App shell, role-based navigation, shared layout, nb-NO date/number helpers; works at 375 px and 1440 px with no horizontal scroll | S00 shell; all pages; S07 verifies |
| UI-3 | MUST | Keyboard navigation, visible focus, labelled fields, errors understandable without colour, good contrast; WCAG 2.2 AA where practical (§5) | all UI slices; S07 verifies |
| UI-4 | MUST | Loading, empty, error, unavailable, success states and confirmation before destructive actions (§5) | all UI slices |
| UI-5 | MUST | UI text in Norwegian bokmål; dates, times and numbers in nb-NO formatting (§5) | all UI slices; formatting helpers in S00 |
| SEED-1 | MUST | ≥8 Resources (4 rooms, 4 equipment, ≥2 approval-required); ≥4 users (2 Administrators, 2 Members; hashed passwords; dev credentials documented as such); ≥18 Bookings varied in time and status with linked Activity Events, placed around the current week, clearly marked synthetic; injectable clock (§7) | S00 |
| SEED-2 | optional | `npm run demo:reset` with a clear warning before replacing local demo data (§7) | S00 |
| RUN-1 | MUST | One documented start command after install + seed; contracts per spec §6 (entity shapes, route list, error format, authorization rules, time handling) frozen in S00; no secrets in Git; workspaces `apps/web`, `apps/api`, `packages/contracts` | S00; S07 verifies |
| NFR-01 | MUST | Local run on macOS (and Windows 11), documented, without paid services or external API keys. Evidence: macOS CI job plus macOS runtime smoke test (PIL-11) | S00 (portable scripts), S07 (smoke test) |
| NFR-02 | MUST | Typecheck, lint, tests, build pass | S00 defines gate; all enforce |
| NFR-03 | MUST | Tests cover collisions, concurrency, roles, transitions, transaction integrity, UTC/local | S01 and S02 (role tests), S03 (collision, concurrency, UTC/local), S05 (transitions, concurrent approval); S07 verifies |
| NFR-04 | MUST | Parameterized SQL, hashed passwords, HttpOnly cookie, `SameSite=Lax`+, `Secure` over HTTPS, server-side access control, `Origin` check on writes, with a suitable supplement if the architecture requires it | S01 (+S00 config) |
| NFR-05 | MUST | README starts project without chat context | S00 skeleton, S07 final |
| NFR-06 | SHOULD | Responsive local lookups | S07 |

### 4.7 Acceptance scenarios (spec §10) and evidence plan
Spec E2E scenarios are the mandatory product evidence. Where a scenario needs UI from a later slice, the earlier API-level proof is interim evidence and the browser (Playwright) test is still required (DEC-13).

| Scenario | API-level evidence | Browser evidence |
|---|---|---|
| E2E-01 | S03 | S04 |
| E2E-02 | S03 | S04 |
| E2E-03 | S03 (exactly one success; no duplicate, no orphaned Activity Event) | – |
| E2E-04, -05, -06 | S05; E2E-05 plus: Expired request rejected with reason, approval after start refused (CR-3) | S07 (needs S04+S05 integrated) |
| E2E-07 | extended with each slice that adds an admin route; final sweep over all admin routes in S07 | – |
| E2E-08 | create/edit/archive S02; guard S02; archived-not-bookable S03 | S07 |
| E2E-09 | S05 | S07 |
| E2E-10 | – | S07 |

**Requirements without a spec E2E scenario** (VIS-03, VIS-04, VIS-05) get API-level tests in S06 with a fixed clock: the 7-day window boundaries, top-3 ranking and tie-break, exclusion of Expired requests (CR-3), and role-scoped activity visibility (Member sees only own Bookings' events, Administrator sees all). A browser check of the dashboard and Activity pages is part of S07. The epics step names the remaining non-E2E MUSTs and their evidence.

## 5. Non-goals

Everything in spec §9 (payments, e-mail/SMS, calendar sync, in-app AI, uploads, multi-tenant, mobile app, production deploy, advanced search, recurring bookings, physical access control). Additionally for v1: user registration, password change/reset, profile management, un-archiving a Resource, editing a Booking's time.

## 6. MVP scope

**In:** every MUST in §4, the 8 pages, seed data, README, automated verification. **SHOULD** items (RES-05, BOK-08, VIS-06, NFR-06, login throttling per DEC-11) are last-in-slice stories and are listed as residual work if undelivered. **Optional:** SEED-2.
**Out:** §5.

## 7. Delivery status, traceability and evidence

*Process requirements for the experiment, not product features. Nothing in §7–§8 is considered done by being written here; see §10.*

**PIL-01 Traceability.** Every MUST has an owner slice (§4), at least one story and acceptance evidence recorded against a commit SHA: a named automated test, or for non-automatable MUSTs (NFR-05, NFR-01 manual run, contrast, README fresh-clone start) a documented manual check. The epics document carries the requirement → story → evidence table; a gap is a planning defect.

**PIL-02 Delivery status: simplest BMad-compatible tracking.** Use BMad's native sprint-status states unchanged, with no custom states and no second register:

| Pilot stage | Where it is recorded |
|---|---|
| planned | sprint-status `backlog` / `ready-for-dev` |
| in progress | sprint-status `in-progress` |
| implemented → tested → reviewed | sprint-status `review`; each step is an **evidence entry** in the story file's ledger: `implemented @<sha>`, `tested @<sha> + verify run result`, `reviewed @<sha> + report path`. A new commit invalidates earlier entries. |
| accepted | sprint-status `done`, set **only by Jo**, with date and SHA in the ledger |

Requirement-level status is **computed** from its stories' ledgers when reported and is never stored separately. `OQ-1` (whether this is enough) is deferred to sprint planning; BMad's internal status system is not customized now.

**PIL-03 Agent completion is not acceptance.** An agent reporting "done" yields at most an `implemented` ledger entry. `tested`, `reviewed` and `done` require the matching recorded evidence; `done` additionally requires Jo.

**PIL-04 One authoritative source.** Delivery status lives only in the sprint-status file (`_bmad-output/implementation-artifacts/`). Agent runtime status (running, blocked, session, logs) belongs to Agent Orchestrator and is never read as delivery status. Boards are views, not registers.

**PIL-05 Task cards.** Each story carries the spec §11 handoff fields: stable ID, goal, requirement refs, dependencies, file/module ownership, acceptance criteria, test commands, definition of done.

**PIL-06 Parallelism and gates.** Agent ramp (spec §12 rule 4): one agent for S00; two for S01 ∥ S02 in separate Git worktrees; three (S04/S05/S06) only after the integration cost of two is judged. Entry gate for any parallel start: the RUN-1 contracts, schema, shared config/layout are frozen and approved by Jo. Later changes to those need Jo's approval, not just a log entry. Each parallel pair gets a recorded file-ownership partition. Each story has one owner at a time; reservation mechanism is delegated to Agent Orchestrator (OQ-2).

**PIL-07 Experiment metrics.** Per story, in `_bmad-output/pilot-log.md`: wall-clock time, time waiting for acceptance, agent runs, human interventions, test failures and retries, review findings (count/severity), and tokens/cost only where reliably measurable, else `unknown`.

**PIL-08 History.** For any accepted MUST we can navigate requirement → story (and why it was chosen) → agent run → commit → test evidence → acceptance record, and show this on screen.

**PIL-09 Plan approval.** No application code starts before Jo approves the PRD, architecture, epics and S00 contracts (spec §12 rule 1).

## 8. Quality gates

**PIL-10 Local verification.** `npm run verify` = typecheck, lint, unit/integration tests, production build. `npm run verify:full` adds Playwright E2E. Scripts avoid Bash-only syntax. Tests use temporary databases only. This is the S00 gate.

**PIL-11 CI parity and macOS.** A GitHub Actions workflow runs the same `verify:full` on Windows (primary), Linux and **macOS** (NFR-01 is not weakened, CR-1). A final **macOS runtime smoke test** (fresh install, seed, start with the documented command, login, one booking created through the API, one conflict refused) runs on the macOS job and is part of S07 acceptance of NFR-01. The workflow file is an S00 deliverable but non-blocking until a GitHub remote exists (OQ-4); creating or pushing to a remote needs Jo's explicit approval. No paid services, external API keys or secrets in CI. Assumption: the repository is public or macOS runner minutes are otherwise free; confirm before creating the remote. Until a remote exists, the fallback evidence for NFR-01 is a manual smoke test on a real Mac (OQ-5). Without either, NFR-01 cannot reach `verified`, and the product definition of done is not met.

**PIL-12 Merge gate.** A branch merges to `main` only when `tested` and `reviewed` are recorded on its exact commit and the shared integration tests are green on the merge candidate (ORK-07, ORK-10).

**PIL-13 Product definition of done** (spec §10): all MUST implemented, all E2E green, documented local start, no known severe defects, behaviour shown against the real SQLite database, SHOULD gaps listed as residual work.

**Constraint:** no paid external APIs or services at any point; no external resource created without Jo's approval.

## 9. Decision log

*DEC-11, DEC-12 and DEC-16 are approved in principle, subject to architecture review (OQ-6). Status: **Jo** = decided by Jo; a CR marks an item that touches an original requirement and is resolved in §9.1; **Default** = proposed default adopted under Jo's instruction to use defaults, a clarification where the spec is silent; **CR-n** = would change an original requirement, so not in effect until approved (§9.1).*

| ID | Decision | Status |
|---|---|---|
| DEC-01 | Windows 11 is the primary dev/test platform; macOS compatibility stays mandatory (NFR-01) and is evidenced by a macOS CI job and a final macOS smoke test (PIL-11). No OS-specific scripts or paths. | Jo (CR-1) |
| DEC-02 | Stack per spec §6 (React, TypeScript, Vite, Fastify, SQLite/`better-sqlite3`, Zod, Vitest, Playwright, npm workspaces). Verify native build on Windows in S00. | Jo |
| DEC-03 | Other members see Bookings as anonymous "Reserved" blocks with status; the owner and Administrators see booker and purpose. Members see activity on their own Bookings; Resource-change events are Administrator-only. | Jo (CR-2) |
| DEC-04 | "Next seven days" = Bookings with end > now and start < now+7 d (so a Booking in progress counts). Top three Resources ranked by `confirmed` count, ties broken by name in nb-NO sort order, zero-count excluded. Start-page pending count = approvable `pending` Bookings, meaning not expired (CR-3). | Default |
| DEC-05 | *Superseded by CR-3.* Original default: no approval or rejection after start, shown as "utløpt"; replaced because CR-3 lets Administrators still reject. | Jo |
| DEC-06 | "Future Booking" = start > now. Archiving is final in the MVP (un-archiving is not built; Jo to confirm). Rejecting an Expired request does not require an active Resource. Archive is rejected while a future `pending`/`confirmed` Booking exists. Archived Resources hidden from catalog, visible in history. | Default |
| DEC-07 | Admin cancelling another user's Booking needs a stored reason shown to the owner; cancelling one's own needs none. Before start only. | Default |
| DEC-08 | "Not in the past" = start ≥ now; "30 days ahead" = start ≤ now + 30×24 h. | Default |
| DEC-09 | The 08:00–22:00 window and 30-minute grid are checked in Oslo wall-clock time. (No Booking can span a DST switch, as the switch is at night.) DST tests use a fixed clock around 2026-10-25 and 2027-03-28. | Default |
| DEC-10 | UI in Norwegian bokmål; code, API codes, docs and planning artifacts in English; domain values stay English. | Default |
| DEC-11 | Users exist only via seed (no registration, password change, profile editing). Server-side opaque sessions in SQLite, 12 h lifetime, HttpOnly cookie. Basic login throttling is SHOULD. Hash algorithm chosen in architecture. All original security requirements (AUT-01…04, NFR-04, spec §4) are preserved. | Jo: approved in principle, subject to architecture review |
| DEC-12 | Booking creation (overlap check, insert, Activity Event) is one immediate SQLite write transaction. Evidence: concurrency tests against a running server and temporary DB. BOK-04 atomicity is preserved in full. | Jo: approved in principle, subject to architecture review |
| DEC-13 | Interim API-level evidence in Phase B for E2E-01…03, -07; browser tests follow per §4.7. This refines spec §14 (Part B), not any Part A requirement. | Default |
| DEC-14 | Validation limits (final in Zod, shared in `packages/contracts`): purpose required ≤200 chars; rejection and admin-cancel reasons required ≤200; Resource name required ≤80; seats optional integer ≥1 (CR-4: no rooms-only restriction); colour/symbol from a fixed list. | Default |
| DEC-15 | `approvalRequired` changes apply to new Bookings only; one user may hold overlapping Bookings on different Resources. | Default |
| DEC-16 | API errors `{error:{code,message,fieldErrors?}}`; 400 validation, 401, 403, 404, 409 conflict/invalid state. Lists support filters and `limit`, no pagination. Route details in architecture; authorization rules (AUT-03) unchanged. | Jo: approved in principle, subject to architecture review |
| DEC-17 | The Activity Event writer is S00 (a Part B refinement); each mutating slice writes its events; S06 reads and displays. | Default |
| DEC-18 | Phase B order S00 → (S01 ∥ S02) → S03. Seed Bookings in the past are inserted directly, bypassing creation rules. | Default |
| DEC-19 | `docs/requirements.md` Part A stays authoritative for scope and behaviour. The PRD may clarify where silent. A change to an original requirement is recorded in §9.1 with its ID and needs Jo's approval first. Part B is guidance that planning may refine. | Jo |

### 9.1 Requirement change register

*Only CR-3 changes an original requirement. Decided by Jo on 2026-10-19.*

| CR | Req. | Original | Decision | Effect on the original spec |
|---|---|---|---|---|
| CR-1 | NFR-01 (MUST) | Runs locally on macOS with documented setup | **Proposal rejected.** NFR-01 stays fully mandatory. Windows 11 is the primary dev platform. Add a macOS CI job and a final macOS runtime smoke test (PIL-11). | None, preserved |
| CR-2 | VIS-01, VIS-05 | Spec silent on who sees whom in the calendar | **Approved, option (a):** other members see anonymous "Reserved" blocks; owners and Administrators see details. | None, clarification where the spec is silent |
| CR-3 | APP-01, APP-02, APP-03, VIS-03, VIS-04 | A `pending` Booking can be approved or rejected; time validity is checked on approval; Administrators see the pending count | **Approved with modification: product change.** A `pending` Booking whose start has passed (Expired request): (1) cannot be approved (`BOOKING_STARTED`); (2) is shown as "utløpt" in the UI and stays `pending` in the DB until resolved; (3) can still be **rejected by an Administrator with a reason**, so old requests can be resolved, and the Member sees the reason; (4) stays listed in the approval queue marked "utløpt", reject only; (5) is excluded from the approvable pending counts of VIS-03/VIS-04. The own-Booking rule (APP-02) and the cancel-before-start rule (BOK-06) are unchanged. | APP-03 "time valid" gains an explicit rule; APP-01/02 and VIS-03 extended |
| CR-4 | RES-02 | Seating "eventuelt" (optional) | **Approved:** original preserved, no rooms-only restriction. | None, preserved |

*UX note: the approval queue may hold Expired requests while the approvable count is zero, so the UI shows the expired count separately. Items (4) and (5) of CR-3 are Claude's reading of "must still be able to reject"; confirm at the UX/epics review.*

## 10. Pilot evaluation criteria (spec §13, ORK-01 … ORK-10)

*These are experiment results, tested separately. A capability described in this PRD is **not** a capability demonstrated. Status vocabulary: `not started` → `demonstrated` (observed once) → `verified` (evidence recorded and Jo-accepted). All start at `not started`.*

| ID | What we want to prove | Evidence that counts | Supported by | Status |
|---|---|---|---|---|
| ORK-01 | Requirement → slice → task traceable | Every MUST has an owner slice and test evidence | PIL-01, §4 | not started |
| ORK-02 | Dependencies govern order | S03 does not start before S01, S02 are accepted | §4.0, PIL-02 | not started |
| ORK-03 | Two agents work in parallel | S01/S02 in separate worktrees, no shared-file conflict | PIL-06 | not started |
| ORK-04 | Live monitoring is useful | Board shows agent status, active task, last event, blocker, test result, branch | PIL-04, OQ-2 | not started |
| ORK-05 | Interrupted work can resume | Session ended mid-task; a new one continues from repo, status and log; blockers logged and tasks reassignable | PIL-04, OQ-2 | not started |
| ORK-06 | A real test failure blocks completion | Observed failure; story never reaches `tested` | PIL-02, PIL-03 | not started |
| ORK-07 | QA before integration | Review and tests on the exact commit before merge | PIL-12 | not started |
| ORK-08 | History is understandable | Open requirement → story → run → commit → test evidence | PIL-08 | not started |
| ORK-09 | Resource use visible | Time, runs, cost or `unknown` | PIL-07 | not started |
| ORK-10 | Deterministic integration | Parallel branches merge only when shared integration tests are green | PIL-12 | not started |

**Pilot success** (spec §14): every ORK criterion `verified` or its gap explained, PIL-13 definition of done met, and Jo can trace one accepted MUST end to end on screen. **Counter-metric:** do not shorten time or cost by weakening tests, skipping review or marking work accepted early.

## 11. Open questions (deferred to later phases)

1. **OQ-1** — Is native sprint-status plus the evidence ledger (PIL-02) enough? *Sprint planning.*
2. **OQ-2** — Agent Orchestrator: input format for story cards, task reservation, status/monitoring interface, resume and reassignment (ORK-04/05). *Before the first handoff; nothing is configured now.*
3. **OQ-3** — Which metrics can be measured reliably (tokens, cost, run counts)? *First agent run.*
4. **OQ-4** — Create a GitHub remote, when and where? Needed for CI, hence for the macOS job and NFR-01 verification (PIL-11). *Needs Jo's approval.*
5. **OQ-5** — Does the macOS smoke test run on the CI runner only, or also on a real Mac? *Decide in S07 planning.*
6. **OQ-6** — Architecture review of DEC-11, DEC-12, DEC-16 (approved in principle). *Architecture step.*
