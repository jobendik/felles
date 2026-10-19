# Reconciliation: ARCHITECTURE-SPINE vs docs/requirements.md and PRD

Reviewer: read-only reconciliation. Spine status: draft, 2026-10-19. Verdicts: ok / weakened / contradicted / silent-risk. "silent-risk" means the spine does not say, and two independent builders could plausibly diverge. Items the spine delegates to the S00 contracts freeze are called out, because the spine itself does not carry the content.

Not verified: the pinned package versions (TypeScript 6.0.3, Vite 8.3.4, better-sqlite3 13.0.3, etc.) were not checked against a registry. The memlog was only grepped (hits were omitted as long lines), so a justification may exist there for items marked weakened.

## 1. Requirement table

| ID | Verdict | Where in spine | Note |
| --- | --- | --- | --- |
| AUT-01 | ok | AD-11, AD-12 | Identical `INVALID_CREDENTIALS`, dummy-hash verify for unknown email, 429 identical for unknown email. |
| AUT-02 | ok | AD-3, AD-11 | Default-deny routes, logout deletes row. Silent whether `GET /api/session` for an anonymous caller is 401 or 200 `{user:null}` (affects the `api/call` 401-to-login redirect and the Demo pill on the login page). See F-12. |
| AUT-03 | ok | AD-3, AD-14 | Coarse route `access` plus pure `policy.can`. Route-enumeration test walks the table. |
| AUT-04 | ok | AD-11, AD-19 | Cookie session survives refresh; name and role come from the session DTO. |
| RES-01 | ok | AD-4, AD-10, AD-19 | Filters in URL. Search semantics (which fields, case, diacritics) not stated; low. |
| RES-02 | ok | AD-2, AD-16 | Fields come from contracts. Entity shape not in spine (see F-02). CR-4 (seats optional) not restated but nothing contradicts it. |
| RES-03 | ok | AD-4 | `fieldErrors` array. Whether an archived resource may be edited is silent (low). |
| RES-04 | ok | AD-10, AD-4 | Guard and create share `UnitOfWork`; `RESOURCE_HAS_FUTURE_BOOKINGS` 409 with `details.futureBookingCount`. |
| RES-05 | ok | AD-2 | Via `approvalRequired` in the DTO; UI-owned. |
| BOK-01 | ok | AD-5, AD-10 | Active resource checked in the same transaction. Purpose required and 200 limit are not in the spine (see DEC-14). |
| BOK-02 | ok | AD-5 | Window, grid, duration and end-after-start on civil strings in `contracts/rules.ts`; not-past and 30 days on instants. Boundary operator for "not past" (start >= now, DEC-08) is not stated; low. |
| BOK-03 | ok | AD-8 | Predicate and adjacency stated exactly. |
| BOK-04 | ok | AD-7, AD-8 | Strong: BEGIN IMMEDIATE, trigger backstop, four named evidence tests. |
| BOK-05 | ok | AD-2/AD-9 (implicit) | Initial status from `approvalRequired` is never stated as a rule in an AD; only the capability map points at it. Low. |
| BOK-06 | ok | AD-9 | Before start only, admin reason for others'. Boundary (`start > now`) and the owner-cancel-own-as-admin case (no reason) are implied, not stated. Where the reason is stored is not stated (see F-07). |
| BOK-07 | ok | AD-4, AD-19 | Server is truth, no optimistic updates. |
| BOK-08 | ok | n/a (UI) | SHOULD, UI-only; no architectural divergence risk. |
| APP-01 | silent-risk | AD-6, AD-9 | Expired requests staying in the queue, marked, reject only, is not carried by any AD; the approvals list endpoint is not defined (see F-02, F-03). |
| APP-02 | ok | AD-9, AD-14 | Own-request rule: AD-9 lists it only under approve; AD-14 covers reject. "Approval records administrator and time" has no named fields (F-07). |
| APP-03 | ok | AD-9 | Compare-and-set, re-check of pending, start, active resource. |
| APP-04 | ok | AD-9, AD-15 | Rejected is non-blocking; owner sees reason via the detail projection. |
| VIS-01 | ok | AD-15 | Discriminated union detail/anonymous with exact-key-set tests. |
| VIS-02 | silent-risk | AD-14 | Default order is not specified. `GET /api/bookings` list scoping per role (Member own only? Admin all?) is not defined (F-02). |
| VIS-03 | silent-risk | AD-6 | Pending count excluding Expired is not stated; dashboard shape is deferred (F-03). |
| VIS-04 | silent-risk | AD-6, Deferred | 7-day window, confirmed count, top-3 rule and tie-break are not stated. Deferred line says "derived from DEC-04" (F-03). |
| VIS-05 | ok | AD-7, AD-15 | `subject_user_id` scoping, resource events admin-only, event type list. Payload fields deferred to contracts. |
| VIS-06 | silent-risk | none | No chart decision (library or hand-rolled SVG), no text-alternative data shape. SHOULD, low (F-14). |
| BR-1 | weakened | AD-5, AD-23 | Time model is good, but no AD mandates the DST test; seed covers only 2026-10-25, not 2027-03-28 (DEC-09). See F-05. |
| BR-2 | ok | AD-9, AD-10 | No DB-level protection against DELETE on `resources` (only bookings and activity_events have delete triggers); low. |
| BR-3 | ok | AD-9 | Triggers block DELETE and immutable-column updates. |
| BR-4 | ok | AD-4 | One error handler. |
| BR-5 | ok | AD-7 | Branded `Tx`; repository writes and `recordEvent` accept only `Tx`. |
| BR-6 | ok | AD-3, AD-26 | Public routes limited to `/api/health`, login (and possibly session read). |
| UI-1 | ok | AD-19 | Routes from EXPERIENCE.md; pages mapped to features. |
| UI-2 | ok | AD-18, AD-24 | Shell in S00; axe at 375 and 1440. No explicit no-horizontal-scroll assertion is named in AD-24 (low). |
| UI-3 | ok | AD-20, AD-24 | React Aria, jsx-a11y, axe helper. |
| UI-4 | ok | AD-20 | Skeleton, Alert, EmptyState, Toast, modal for confirmation. |
| UI-5 | ok | AD-5, AD-21 | Single formatter, nb-NO and Europe/Oslo. |
| SEED-1 | ok | AD-23 | Quantities (8 resources: 4 rooms, 4 equipment, at least 2 approval-required; 4 users: 2 admins, 2 members; at least 18 bookings with linked events) are not restated, only PRD-bound. Includes Expired and DST cases. Weak but fine. |
| SEED-2 | ok | AD-23 | Prompt y/N and `--force`. Warning text content is not specified; must also remove `-wal` and `-shm` sidecars and cope with a running server (Windows file lock). Low (F-13). |
| RUN-1 | silent-risk | AD-18, AD-22, Deferred | Start command ambiguous (does `npm start` build the SPA?); default DB path resolved relative to what cwd (F-04, F-06). Spec §6 contracts list not carried in the spine (F-02). No secrets: ok. |
| NFR-01 | ok | AD-25 | Matrix incl. macOS and smoke script. The manual-Mac fallback (OQ-5) is not mentioned; low. |
| NFR-02 | ok | AD-25 | |
| NFR-03 | weakened | AD-8, AD-24 | Collisions, concurrency, roles, transitions and integrity are well covered. UTC/local (DST) has no mandated test (F-05). |
| NFR-04 | weakened | AD-11, AD-13, AD-16 | Origin check, SameSite=Lax, HttpOnly, Secure, parameterised SQL and scrypt are all specified. The scrypt parameters as written exceed Node's default `maxmem` (F-08). |
| NFR-05 | ok | AD-22 | README listed in the capability map. Content requirements are not in the spine. Manual-evidence mechanism for NFR-05: see F-11. |
| NFR-06 | ok | AD-16 | Capability map says "indexes in schema", but no AD requires indexes; low. |
| DEC-01 | ok | AD-22, AD-25 | `.mjs` scripts, CI matrix. |
| DEC-02 | ok | Stack | Reference choices are kept. Tailwind is the spec's "valgfritt" and is declined (AD-20). Additions (React Router, TanStack Query, react-hook-form, React Aria, lucide, helmet, pino, temporal-polyfill, esbuild) are additive, not reference replacements. scrypt over a native hasher is justified in AD-11. DEC-02's "verify native build on Windows in S00" is covered only implicitly by the CI matrix and a Deferred note about `@types`. |
| DEC-03 | ok | AD-15 | |
| DEC-04 | silent-risk | AD-6, Deferred | Window definition (end > now and start < now + 7 d), top-3 ranking, zero-count exclusion and nb-NO tie-break absent. SQLite has no nb-NO collation, so the tie-break must be done in code; a builder may use SQL `ORDER BY name` (F-03). |
| DEC-05 | ok | n/a | Superseded by CR-3. |
| DEC-06 | ok | AD-9, AD-10 | `start > now`, final archive, reject expired without an active resource, history readable. |
| DEC-07 | ok | AD-9 | Reason storage and visibility to owner not specified at schema level (F-07). |
| DEC-08 | silent-risk | AD-5 | Says "not in the past" and "start <= now + 30 x 24 h"; start >= now vs > now is not stated. A request with start == now: valid for create (DEC-08), but Expired if pending (AD-6). Low (F-15). |
| DEC-09 | weakened | AD-5, AD-23 | Oslo wall-clock checks: ok. Fixed-clock tests around both 2026-10-25 and 2027-03-28 are not mandated (F-05). |
| DEC-10 | ok | AD-21 | |
| DEC-11 | ok | AD-11, AD-12 | Throttling is a SHOULD and is specified. Absolute 12 h (not sliding) is a clarification. |
| DEC-12 | ok | AD-7, AD-8 | |
| DEC-13 | ok | n/a | Process; AD-24 lets API and browser tests coexist. |
| DEC-14 | silent-risk | AD-2 | Limits (purpose <= 200, reasons <= 200, name <= 80, seats integer >= 1, fixed symbol and colour lists) are not named in the spine. They live in contracts, which a single S00 author writes; low-medium (F-09). |
| DEC-15 | silent-risk | none | `approvalRequired` applies to new bookings only; overlapping bookings on different resources by one user are allowed. Naturally true of the design but not stated, and it could be broken by a "re-evaluate pending on edit" feature or an over-eager per-user overlap check. Low. |
| DEC-16 | weakened | AD-4 | Adds a `before` cursor on the activity list ("Vis flere"); DEC-16 says lists support filters and `limit`, no pagination. Also adds 429 and 500. The deviation is sensible but is not recorded as a change to DEC-16 (F-10). |
| DEC-17 | ok | AD-7, Structural Seed | Writer in S00. |
| DEC-18 | ok | AD-23 | Past seed rows inserted directly; spine adds "still passes every trigger", which is stricter and fine. |
| DEC-19 | ok | n/a | Process. |
| CR-1 | ok | AD-25 | macOS in matrix plus smoke. |
| CR-2 | ok | AD-15 | |
| CR-3 | weakened | AD-6, AD-9 | (1) cannot approve: ok, `BOOKING_STARTED`. (2) derived label, stays pending: ok. (3) reject allowed with reason, owner sees reason: ok. (4) stays listed in the queue, reject only: no AD and no list contract. (5) excluded from approvable counts: no AD. See F-03. |
| CR-4 | ok | n/a | Nothing restricts seats to rooms. |
| Spec §6 error format | ok | AD-4 | Code, message, fieldErrors; adds details. |
| Spec §6 entity shapes | silent-risk | AD-2, Deferred | Delegated to S00 contracts; the spine has no field-level shape (F-02). |
| Spec §6 route list | silent-risk | AD-3, Conventions | Route table delegated to `contracts/routes.ts`. Spine never lists method, path or access per route. `/api/session` is named only in AD-6; `/api/resources`, `/api/bookings`, `/api/bookings/:id/*`, `/api/dashboard`, `/api/activity` appear nowhere with their verbs (F-02). |
| Spec §6 authorization rules | weakened | AD-14 | Object-level rules stated for bookings only; no matrix for resources, dashboard, activity, schedule (F-02). |
| Spec §6 UTC/local | ok | AD-5 | |
| Spec §6 stack table | ok | Stack, AD-20 | See DEC-02. |
| Spec "one documented start command" | silent-risk | AD-22 | Three commands are documented (install, seed, start). `npm start` presupposes a built SPA; whether it builds is unstated (F-04). |
| Spec "integration tests: isolated temp DBs, never dev DB" | weakened | AD-16, AD-24 | Guard triggers only on `VITEST` or `NODE_ENV=test`. Playwright server processes and `smoke.mjs` are neither; the guard does not protect them (F-06). |
| Spec "no secrets in Git" | ok | AD-22, AD-26 | `.env.example` only. |
| Spec "demo:reset warning" | ok | AD-23 | See SEED-2 note. |
| Spec "Origin check" | ok | AD-13 | Strict (Origin required on every non-safe request). E2E-07 must send a valid Origin so it proves role enforcement and not Origin refusal; AD-13 covers helpers only. |
| Spec "hash-stored passwords" | weakened | AD-11 | Specified, but see maxmem defect (F-08). |
| Spec "audit and change in same transaction" | ok | AD-7 | |
| Spec "archive only without future active bookings" | ok | AD-10 | |
| Spec "admin cannot approve own booking" | ok | AD-9, AD-14 | |
| E2E-01..10 | ok | AD-24 | E2E-03 via named evidence in AD-8. E2E-07 per AD-3. E2E-10 not named in a mechanism beyond axe at 375 px; keyboard-only flow test is implied. |

Counts (rows above, by verdict): see the summary returned with this report.

## 2. Prioritised findings

### High

**F-01 (high) Default DB path depends on cwd (RUN-1, NFR-05, "never the dev DB").** AD-22 sets `FELLES_DB_PATH` default `data/felles.db`. npm workspaces run scripts with the workspace directory as cwd, so `npm start` from the root, `npm -w apps/api run dev`, `db:seed`, Playwright and `smoke.mjs` can each open a different file; `db:seed` then appears to succeed while the server opens an empty DB. Fix: add to AD-22 "a relative `FELLES_DB_PATH` is resolved against the repository root (found from `config.ts` via `import.meta.url`), never `process.cwd()`; `config.ts` logs the resolved absolute path at startup."

**F-02 (high) Spec §6 "contracts to fix before parallel development" are delegated, not carried.** The spine never lists route verbs, paths and access, entity field sets, or the per-route authorisation matrix, and `/api/session` appears only inside AD-6. Open points that two builders will answer differently: login/logout verbs on `/api/session`; whether archive is `PATCH /api/resources/:id` or `POST .../archive`; `GET /api/bookings` scope per role and how Mine bookinger and the approval queue are expressed (`?mine=true`, `?status=pending`); whether `/api/dashboard` serves both the Member start page and the Admin panel and what Members get; who may call `/api/activity`; the schedule route shape. Fix: add a "Route and access table" to the spine (about 20 rows: method, path, access, scope rule for Member and Admin, success status, error codes), and a one-line field list per entity (including booking `decidedBy`, `decidedAt`, `decisionReason`, `cancelReason`, `cancelledBy`). S00 then implements and may only extend.

**F-03 (high) Dashboard, CR-3 (4)/(5) and DEC-04 rules are bound but not stated.** AD-6 and Deferred "bind" CR-3 and DEC-04 but no AD says: the 7-day window is `end > now AND start < now + 7 d`; top 3 by `confirmed` count in that window, zero-count excluded, ties by name using `Intl.Collator('nb-NO')` in code (SQLite cannot collate nb-NO); pending counts on start page and panel exclude Expired (`start <= now`); the approvals list includes Expired items flagged `expired: true` and the dashboard returns `expiredCount` separately (UX note in PRD §9.1). Fix: add an AD "Dashboard and queue semantics" with those rules, and require the S06 test list to name window boundaries, tie-break and Expired exclusion with a fixed clock. Also state the queue contract in the route table (F-02).

### Medium

**F-04 (medium) "One documented start command" is ambiguous.** AD-22 documents `npm install`, `npm run db:seed`, `npm start`, and serves the built SPA. Unstated: whether `npm start` builds, whether `db:seed` runs migrations, and what `db:seed` does when `felles.db` already exists (AD-23 says "fresh migrated database"). Fix: state that `db:seed` migrates then seeds and refuses (non-zero exit, message pointing to `demo:reset`) on a non-empty DB; `npm start` runs `build` if `apps/web/dist` or the API bundle is missing, or `postinstall` builds; the README shows exactly this sequence.

**F-05 (medium) DST test is not a mandated requirement (BR-1, NFR-03, DEC-09).** The seed contains only 2026-10-25 and AD-24 never lists a UTC/local test. Fix: add to AD-24: "[BR-1] fixed-clock tests for both 2026-10-25 (fall back) and 2027-03-28 (spring forward): 08:00 and 22:00 Oslo convert to the expected UTC instants on the day before, of and after; Oslo-day ranges are 25 h and 23 h; a booking 10:00-11:00 round-trips through the API and the browser formatter unchanged; the 7-day window and 30-day limit are computed in 24 h units." Seed should add bookings around 2027-03-28 only if the reference instant is within range, otherwise unit-level fixtures suffice.

**F-06 (medium) Temp-DB guard does not cover Playwright and smoke (PIL-10, spec "never the dev DB").** The opener refuses the default dev path only when `VITEST` or `NODE_ENV=test`. Playwright boots the production build (NODE_ENV=production) and `smoke.mjs` is a plain script, so a missing `FELLES_DB_PATH` would silently use `data/felles.db` and the seed would wipe or pollute it. Fix: make the refusal independent of environment: `e2e/support` and `smoke.mjs` must pass an explicit `FELLES_DB_PATH` under `os.tmpdir()` and set `FELLES_REQUIRE_EXPLICIT_DB=1` (or `FELLES_TEST_RUN=1`), which the opener checks; add a test that the guard throws.

**F-07 (medium) APP-02/BOK-06/DEC-07 record-keeping fields not specified.** "Approval records Administrator and time", "stored reason shown to owner" (reject reason, admin-cancel reason) need columns or event payloads, and AD-9's immutability trigger lists only five frozen columns. Different builders could put reasons only in the event payload (invisible to Members under the scoped projection if they read from `activity_events`) or in a column. Fix: in the entity field list (F-02) fix `decided_by`, `decided_at`, `decision_reason`, `cancelled_by`, `cancel_reason` on `bookings` as the source for the owner view, with events carrying only ids; extend the update-allowed triggers accordingly.

**F-08 (medium) scrypt parameters exceed Node's default maxmem.** `N=2^16, r=8` needs about 64 MiB (128 x N x r); Node's `crypto.scrypt` default `maxmem` is 32 MiB, so the first S01 implementation throws `ERR_CRYPTO_INVALID_SCRYPT_PARAMS` and the builder will improvise (lower N, or an npm hasher, contradicting the "no native dependency" prevent). Also seeding four users and parallel test workers at 64 MiB and p=2 is slow. Fix: state `maxmem: 128 * 1024 * 1024` in AD-11 (or choose `N=2^15, r=8, p=1` with explicit maxmem) and a test that hash and verify round-trips; allow a cheaper cost only via a test-only injected parameter object, never an env var.

**F-09 (medium) DEC-14 limits not in the spine.** Fix: one line in AD-2 listing them (purpose 1-200, reasons 1-200, resource name 1-80 trimmed, seats integer >= 1 optional, symbol and colour from the fixed lists in DESIGN.md), plus the rule that trimming happens in the schema.

**F-10 (medium) DEC-16 deviation unrecorded.** The `before` cursor on the activity list, 429 and 500 go beyond DEC-16's "filters and limit, no pagination; 400/401/403/404/409". Fix: record in the memlog and APPROVAL-BRIEF as an architecture-review amendment to DEC-16 for Jo's approval (OQ-6 allows it), or drop the cursor and use a `limit` only with "Vis flere" raising the limit.

**F-11 (medium) Evidence for non-automatable MUSTs.** PIL-01 requires named manual checks (NFR-05 fresh-clone start, contrast, NFR-01 on a real Mac). `scripts/trace.mjs` only maps test titles. Fix: allow a `manual-evidence.md` (requirement id, steps, commit SHA, date, who) read by `trace.mjs`, and say so in AD-24.

### Low

**F-12 (low) Anonymous `GET /api/session` behaviour.** Decide 200 `{user:null, serverNow, demoData}` (so the login page can show the Demo pill and the client clock) versus 401. Fix: state it in the route table; recommended 200 with `user:null`, and make `api/call` not treat that as an auth failure.

**F-13 (low) demo:reset hardening.** Fix: warning text must name the DB path and say all local data including non-synthetic bookings will be lost; delete `-wal` and `-shm`; fail with a clear message if the file is locked (Windows) or the server is running.

**F-14 (low) VIS-06 chart.** No library decision. Fix: state hand-rolled SVG (no chart dependency) with a visually hidden table as text alternative, fed by a dashboard series in the contract.

**F-15 (low) Boundary operators.** Fix: one line in AD-5/AD-9: create requires `start >= now` (DEC-08); cancel, archive-guard and "future" use `start > now`; Expired is `start <= now`. Note the consequence that a pending booking created for exactly `now` is immediately Expired.

**F-16 (low) DEC-15 and resource edits.** Fix: one line stating `bookings.status` at creation is derived once from `approvalRequired` and never re-derived; no per-user overlap rule exists; archived resources are not editable (or are; decide).

**F-17 (low) AD-17 vs AD-18.** Slice-owned migration ranges (0100s to 0600s) coexist with "any new migration after S00 needs Jo's approval". Fix: clarify that the ranges are reserved numbers for Jo-approved migrations only.

**F-18 (low) E2E-07 must send Origin.** Fix: add to AD-24 that raw-API role tests use the shared client that sets Origin, so the 403 is proven to be the role check (assert `error.code` is `FORBIDDEN`, not `ORIGIN_REFUSED`).
