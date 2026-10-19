# Adversary review: ARCHITECTURE-SPINE.md (FELLES)

Lens: construct two units that each obey every AD and still build incompatibly. Spine not edited. The .memlog.md was not present in the folder, so decision history was not consulted.

Cross-cutting root cause: the spine fixes the *mechanism* (contracts, routes, UnitOfWork) but delegates the *semantics* of shared data to "contracts at the S00 freeze" (Deferred, last bullet). The S00 agent is one author, so shapes will be consistent, but S00 has no AD telling it which semantic choices to make, and every slice after S00 is forbidden to change them (AD-18). Anything S00 leaves ambiguous is therefore frozen ambiguous. Most holes below are "semantic rule unstated; S00 and consumers each pick one".

Severity: B = blocker (silent data/permission/count divergence), H = high (visible bug at integration), M = medium (annoying, caught late).

Counts: B 4, H 6, M 4 (14 pairs; the 12 most damaging are first).

---

## P1 [B] "Expired" is derived in three places: DTO, list filters, aggregates

**Units:** S05 approvals queue (`bookings` module, list-pending use case) vs S06 dashboard counts (`dashboard` module) vs S03/S04 booking lists and schedule.

**Legal choices:**
- AD-6 says Expired = `pending` and `start <= now`, "never stored". It does not say whether the DTO carries a derived flag, whether `status` on the wire can be `"expired"`, or who computes it.
- S05 returns `status: "pending"` plus `expired: boolean` (server-computed with Clock). S06 counts `WHERE status='pending'` and subtracts nothing because the dashboard "pending count" query was written against the repository directly, or uses `start > now` while S05 uses `start >= now` (AD-6 says expired at `start <= now`; DEC-04 says approvable = "not expired"; the boundary equality case is stated only once).
- S04 (web) derives expired client-side from `serverNow + elapsed` (AD-6 says the web does that) while S05's API also sends `expired`; when the two disagree around the boundary the badge says "Utløpt" with an Approve button, or the reverse.
- Filter semantics: S03's `GET /bookings?status=pending` includes expired ones; S05 queue includes them (APP-01 says they stay listed); dashboard excludes them. All "obey" AD-6.

**Why every AD permits it:** AD-6 defines the predicate in prose only; AD-2 puts pure rules in `contracts/rules.ts` but never lists `isExpired` as a required export; AD-15 presenter layer is silent.

**Failure:** Admin sees "3 ventende" on dashboard, 4 rows in queue; the extra is the Expired one (that one is arguably correct, but the number on the dashboard card links to a queue whose header says 4). At exactly `start == now` the queue allows Approve while the API returns `BOOKING_STARTED`.

**Proposed AD (new AD-27 "Derived booking state"):** `contracts/rules.ts` exports `isExpired(status, startAtMs, nowMs) = status==='pending' && startAtMs <= nowMs` and `isApprovable` (its negation within pending). Every booking DTO carries `status` (the four stored values only, never `"expired"`) and `expired: boolean`, computed in the booking presenter from the Clock; the web renders the server flag and never recomputes it on list data (it uses its own clock only for countdowns/past checks on dates it has no flag for). SQL predicates for "approvable pending" and "expired" live once as named repository functions `countApprovable(db, now)` / `listPending(db, now, {includeExpired})` in the bookings repository; dashboard calls them through `bookings/index.ts`. Status filter on the wire is the four stored values plus a separate `expired=true|false` query param.

---

## P2 [B] Who owns the bookings repository (S03 vs S05) and the dashboard's SQL

**Units:** S03 agent (create/read/list/schedule) vs S05 agent (cancel/approve/reject) vs S06 agent (dashboard, activity read).

**Legal choices:** AD-1 says SQL only in `*.repository.ts` and modules talk through `index.ts`. The Structural Seed lists one `modules/bookings/` with "S03; S05 files". AD-18: "slices replace bodies, never signatures or file names" and S00 creates stubs "in the file owned by the implementing slice". Nothing says whether there is one `bookings.repository.ts` or two, nor which functions it has.
- S03 creates `bookings.repository.ts` with `insert`, `findById`, `listByUser`, `listForSchedule`. S05, running in parallel (S04||S05||S06 after S03 — S05 depends on S03, but S04 and S06 run alongside), needs `transition(tx, id, from, to, fields)`, `listPending`. S05 adds them to S03's file (merge conflict; against "never edit another slice's file") or creates `bookings-approval.repository.ts` that repeats row mapping (two row mappers, divergent null handling, two copies of the compare-and-set).
- S06 dashboard needs booking counts. AD-1 permits only `bookings/index.ts`; the index is S03's, frozen "signature". S06 either adds exports (breaking the rule) or writes its own SQL in `dashboard.repository.ts` against the `bookings` table (AD-1 literally says SQL in `*.repository.ts`, and does not forbid a repository querying another module's table; only "two modules reaching into each other's SQL" in Prevents).

**Failure:** two row mappers: `reason` mapped to `null` in one, `undefined`/`""` in the other; dashboard's own "blocking statuses" list differs from the conflict check's.

**Proposed AD:** `modules/bookings` has exactly these files and owners: `bookings.repository.ts` (S00 writes the full signature set: `insert`, `findById`, `listByOwner`, `listForSchedule`, `listPending`, `transition`, `countApprovable`, `countConfirmedInWindow`, `topResourcesInWindow`, `hasFutureBlocking(resourceId)`; S03/S05/S06 each implement only the stubs tagged with their slice). One row mapper. No module other than `bookings` may name the `bookings` or `activity_events` tables in SQL; the dashboard calls `bookings/index.ts` aggregate functions. Add a lint rule (table-name regex in `prepare` strings, per directory).

---

## P3 [B] activity_events: who writes which event, in which use case, and the payload per type

**Units:** S03 create use case vs S05 approve/reject/cancel use cases vs S02 resource use cases vs S06 reader/UI.

**Legal choices:**
- `booking.created` for a pending request and for a booking that is auto-confirmed (non-approval resource): S03 writes one `booking.created` with `status` in payload; an equally legal S03 writes `booking.created` for pending and `booking.approved` (actor=system/null) for auto-confirmed, since the type list has `approved` and no `confirmed`. S06's activity text ("Ingrid ba om ...") then renders the wrong sentence for one of them.
- `booking.cancelled` by owner vs by admin: S05 puts `reason` in `payload.reason` for admin-cancel and nothing for owner; or `payload.cancelledBy:'owner'|'admin'`. S06 cannot tell without the payload shape, which the Deferred list explicitly leaves to "contracts at S00" without telling S00 what must be in it.
- `resource.updated` diffs: S02 writes `{before, after}` of the whole row; or `{changes:[{field,from,to}]}` of changed fields only; or no diff at all. S06 renders a list of changed fields and must parse all of them.
- Whether expired-reject writes `booking.rejected` with a flag.
- `actor_user_id` for seed-inserted history (DEC-18 inserts past bookings directly): no event, or synthetic events? SEED shapes the Member's activity list.

**Why permitted:** AD-7 requires "an activity event inside the transaction" but never names the event per use case; naming convention lists types only; AD-15 only covers `subject_user_id`.

**Failure:** Activity page shows blank text or "booking.created" raw for confirmed bookings; E2E "member sees reject reason in activity" fails; `resource.updated` renders `[object Object]`.

**Proposed AD:** a table in the spine (or contracts, frozen): per use case, the exactly-one event it writes and its payload Zod schema, discriminated by `type`. For example: create -> `booking.created` `{bookingId, resourceId, startAt, endAt, status}` always one event, never an extra `approved`; approve -> `booking.approved`; reject -> `booking.rejected {reason}`; cancel -> `booking.cancelled {reason|null, byRole}`; resource.created -> `{resourceId, name}`; resource.updated -> `{resourceId, changes: [{field, from, to}]}` only changed fields, none if empty (no event, 200 no-op); resource.archived -> `{resourceId}`. `recordEvent(tx, event)` takes this discriminated union so the compiler enforces it; S00's writer owns the schemas, not the slices. Payload is stored as JSON text column parsed at read with the same schema; payloads never contain `purpose`.

---

## P4 [B] subject_user_id derivation and actor/subject mismatch

**Units:** S00 `recordEvent` writer vs S03/S05 callers vs S06 reader.

**Legal choices:** AD-15: "`subject_user_id` holds the booking owner's id at write time (NULL for resource events)". Who derives it?
- Writer derives it by loading the booking inside `recordEvent(tx, …)` (an extra read; fine) or callers pass it. S05's reject passes `actor` (the admin) as subject by mistake, or S03 passes the creator, which is the same as owner today but not for an admin booking on behalf of someone (not currently possible, but the rule is unspecific).
- For `booking.created` the booking row is inserted in the same tx; the writer's lookup works. For a rejected request, the Member who owns it must see it: needs owner not actor. If caller passes `actorId` and the writer defaults `subject = actor`, S05 admin events are invisible to the Member (APP-04: Member sees reason) and visible in the admin's own filtered view only by accident.
- Resource events NULL; a resource event whose payload mentions a booking (archive refusal) would not be written; ok.

**Failure:** Member never sees "avvist" with reason in activity (VIS-05/APP-04 broken); or Member sees events for others' bookings if `subject` set to NULL-vs-actor wrongly.

**Proposed AD:** `recordEvent` signature is `recordEvent(tx, {type, actorUserId, bookingId?, resourceId?, payload})` and it alone derives `subject_user_id` from `bookings.user_id WHERE id = bookingId` (NULL when `bookingId` is absent). Callers cannot pass it. A schema CHECK/trigger: `type LIKE 'booking.%'` implies `subject_user_id IS NOT NULL`, `type LIKE 'resource.%'` implies NULL.

---

## P5 [H] Cancel reason vs rejection reason columns; who sets which fields

**Units:** S05 cancel use case vs S05 reject use case vs S04 "Mine bookinger" detail vs S03 booking DTO.

**Legal choices:** S00 owns the schema. Spine says only "reasons". Options within S00's freedom: one `reason` column; or `decision_reason` + `cancel_reason`; plus `decided_by`, `decided_at`, `cancelled_by`, `cancelled_at`. Triggers (AD-9) forbid updating `resource_id, user_id, start_at, end_at, purpose` but not `reason`/`decided_*`.
- Approve sets `decided_by, decided_at` (APP-02 "records Administrator and time"); reject sets same plus reason; cancel sets `cancelled_at` and `cancelled_by`, reason only when admin cancels another. Nothing prevents cancel overwriting `decided_by` (history loss, contradicting BR-3 "never overwritten") or a second transition overwriting an earlier reason (confirmed -> cancelled overwrites approval's `decided_*`).
- DTO: S03 defines `BookingDto.reason: string|null`; the web shows "Begrunnelse" for rejected and cancelled the same, but needs to know whether it is a rejection reason vs an admin-cancel reason ("Avvist: ..." vs "Kansellert av administrator: ...").

**Failure:** after approve then cancel, the audit shows no approver; Member sees an admin's cancel reason labelled as rejection.

**Proposed AD:** columns `decided_by_user_id`, `decided_at` (approve/reject only, write-once: trigger rejects update when not NULL), `decision_reason` (reject only, NOT NULL when status=rejected via CHECK), `cancelled_by_user_id`, `cancelled_at`, `cancel_reason` (NOT NULL via CHECK when cancelled and cancelled_by != user_id). DTO exposes `decision: {by, at, reason}|null` and `cancellation: {by, at, reason}|null`, never a generic `reason`. Per-transition field table in the transition-table AD. Owner and admin only see `by` names per AD-15 viewer rules (a Member sees "Administrator" for cancel, not the name? must be stated).

---

## P6 [H] Schedule, availability and "upcoming": shape, ordering, window, empty vs null

**Units:** S03 schedule endpoint (`modules/bookings`) vs S04 week grid and slot picker vs S06 dashboard "upcoming bookings".

**Legal choices:**
- Schedule: `GET /resources/:id/schedule?week=2026-10-19` returns `{items: Block[]}` with blocks in start order; or grouped by Oslo day `{days:[{date, blocks}]}`. Both obey "lists return `{items}`" if the grouped form is an item list.
- Which blocks: Expired pending shown? Rejected/cancelled excluded or included (a non-blocking status block)? Block that crosses midnight Oslo? Week boundaries: Monday 00:00 Oslo (DST week of 2026-10-25 has 169 h) computed with `Instant` arithmetic `+7*24h` (wrong) vs `Temporal` days.
- Availability / slot picker: S04 computes free slots client-side from schedule blocks plus rules in contracts; or S03 supplies `GET .../availability?date=`. Spine lists no availability route; if S00's route table contains one, its shape is undefined. If both exist they use different adjacency semantics (adjacent allowed, AD-8) — a client that uses `<=` shows an adjacent slot as taken.
- "Upcoming": S04 "Mine bookinger" = `end > now` ordered ascending; S06 dashboard "upcoming" = `start >= now` (in-progress excluded) ordered ascending; in-progress booking appears in Mine but not on the start page. DEC-04 defines "next seven days" only for the admin panel (end > now, start < now+7d); VIS-03's "upcoming Bookings" has no window or limit: 5? 10? all?
- Empty vs null: `items: []` vs `null` when no bookings; `topResources: []`.

**Failure:** Start page and Mine bookinger disagree about the same booking; in-progress booking missing on dashboard; Sunday-night block drawn on the wrong day; grid wrong in DST week.

**Proposed AD (add to AD-4/AD-16):** (1) Every list endpoint specifies in the route table: statuses included, sort key and direction with a total-order tie-break `(start_at, id)`, default and max `limit`, and returns `{items: []}`; an empty result is `[]`, never null or 404. (2) Define `upcoming(b) = status in (pending-not-expired, confirmed) && end_at > now` once in `bookings/index.ts`, used by Mine and dashboard; dashboard passes `limit=5` (or whatever Jo decides) and a "Se alle" link to Mine. (3) Schedule takes `weekStart` as Oslo Monday civil date and the server returns blocks overlapping `[mon 00:00, nextMon 00:00)` Oslo in order with their real instants (not clipped); the web splits by Oslo day with `Intl`. (4) No availability endpoint; slot availability is computed in `contracts/rules.ts` from blocks (`overlaps` is exported there, half-open). If an endpoint exists, name it in the table.

---

## P7 [H] Pagination, cursors and sort across lists; DEC-04 nb-NO tie-break

**Units:** S06 activity read (`before` cursor) vs S02 resource list vs S05 queue vs S06 top-3.

**Legal choices:** AD-4: "lists take filters and `limit`; only the activity list takes `before`". `before` of what: event id, `created_at`, or an opaque token? Events created in the same millisecond (seed, tests with frozen clock!) make a timestamp cursor skip or repeat rows. Under `FELLES_NOW` frozen, every event has the same `created_at`, so ordering by time alone is undefined. Response: `{items}` only, so how does the web know there is no more? `hasMore`? Next cursor = last item's id (client computes) or `nextBefore` field?
- DEC-04 tie-break "by name in nb-NO sort order": S06 sorts in SQL (`ORDER BY name` — SQLite BINARY collation: "Å" after "Z" works, but "aa" vs "å", case: "projektor" sorts after "Skjerm") or in JS with `localeCompare('nb')` or `Intl.Collator('nb-NO')`. Node 24 full-ICU is default but the result differs from SQLite's, and for equal names (duplicates allowed per Deferred) there is no final tie-break.
- Resource list sort order (S02) differs from the select in the booking form (S04) — each picks name sort differently, or insertion order.
- Search (RES-01): `LIKE` is ASCII case-insensitive only; "ø/æ/å" and "Å" are not folded. S02 implements search server-side with `LIKE`, the web filters client-side with `toLocaleLowerCase('nb')`; "øl" vs "Øl".

**Failure:** top-3 order wrong for names starting with Å/Ø/Æ; activity "Vis flere" duplicates or skips rows with the frozen clock; search for "ørret" misses "Ørret".

**Proposed AD:** one `contracts/collation.ts` (pure): `compareNb(a,b) = Intl.Collator('nb-NO',{sensitivity:'base' ... }).compare` followed by `a.id - b.id` as final tie-break; used by every module that sorts by text (API sorts in code after fetch for catalogue-sized data; no SQL ORDER BY name). Search = case/diacritic-insensitive on `normaliseSearch(s) = s.normalize('NFC').toLocaleLowerCase('nb-NO')`, done server-side once in resources use case with the same function; the web only passes `q`. Activity cursor: `before` = event id (integer, monotone autoincrement); order `ORDER BY id DESC`; response `{items, nextBefore: number|null}`; limit default 20, max 100.

---

## P8 [H] Cache invalidation across features

**Units:** S05 booking-actions (approve/reject/cancel) vs S04 calendar and Mine vs S06 dashboard/activity vs S02 archive.

**Legal choices:** AD-19: `api/invalidation.ts` maps each mutation to key prefixes; file is S00-owned and in the web kit, not in the freeze list explicitly ("route and nav tables", "ui/ tokens"); `api/` is S00 but who may edit it? S00 writes the map before any feature exists, so it guesses. S05 adds cancel to the map (editing S00's file — conflict with S04/S06 doing the same). Alternatively each feature calls `queryClient.invalidateQueries` inline (AD-19 does not ban it).
- Approve must invalidate: pending queue, pending count, dashboard stats, schedule of the resource, Mine list, booking detail, activity list. Archive: resource list, resource detail, dashboard "top resources", future schedule. S05 invalidates the 3 it knows.
- Keys: `keys.bookings.list(filters)` shape defined in S00; S04 uses `['bookings','mine']` ad hoc.

**Failure:** after approve, dashboard card and activity feed stay stale until refetch; counts disagree with the queue (compounds P1).

**Proposed AD:** `api/invalidation.ts` is in the freeze list and is *complete* at S00: every mutation contract maps to a coarse prefix set; rule: any booking mutation invalidates `['bookings']`, `['dashboard']`, `['activity']`; any resource mutation invalidates `['resources']`, `['dashboard']`, `['bookings','schedule']`, `['activity']`. Features call `useContractMutation(contract)` which applies the map; direct `invalidateQueries` is lint-banned in `features/`. All query keys must start with the module name.

---

## P9 [H] 501 stub mechanism vs route-enumeration test vs "refuse to start"

**Units:** S00 route stubs vs the AD-3 enumeration test vs slices that replace stubs.

**Legal choices:** AD-3 requires 401 without session on every non-public route and 403 for Member on admin routes; AD-18 says stubs return 501. A stub registered via `registerRoute` goes through the access check, so 401/403 come first (good). But if a stub is registered with `access:'public'` for speed or as a raw `app.get` (AD-3 says refuses to start if a handler is registered outside the table; raw stubs would fail that), or if the stub returns 501 *before* the guard (the guard is a preHandler in one implementation and an in-handler call in another), then the enumeration test passes against stubs (it only needs non-200?) or fails once the slice replaces the stub with a handler that forgot the guard — the test is the only protection, and it asserts 401/403 only for the cases listed. A slice that implements a route as `authenticated` where the table says `admin` can't happen (table frozen), but the object-level policy (AD-14) is not enumerated: Member reading another's booking (403) is only in unit tests per slice.
- A stub's 501 `NOT_IMPLEMENTED` code isn't in the AD-4 status mapping; the contracts error enum is frozen after S00, so slices cannot add codes; the E2E expecting "all routes implemented" has no mechanical check, so a slice can leave a stub and still pass `verify`.

**Failure:** shipped build with a 501 route; or the enumeration test green while an `admin` route lacks the guard once a slice replaces it with a hand-rolled handler.

**Proposed AD:** stubs are produced by `stub(contract)` helper in `http/register-route.ts` that uses the same `registerRoute` path (access checked before body); the enumeration test additionally asserts that after all slices merge, no registered route responds 501 (a `NOT_IMPLEMENTED_ALLOWED` list is empty at S07 and the test is gated by an env var set in the S07 integration job); `NOT_IMPLEMENTED` and `INTERNAL` are in the S00 error enum and mapped to 501/500 explicitly in AD-4. Each slice's done-criteria includes: its routes removed from the stub list.

---

## P10 [H] Seed vs triggers vs migration ordering across slices

**Units:** S00 seed + schema vs S01/S02/S03/S05/S06 migrations (ranges 0100–0600).

**Legal choices:** AD-17: S00 delivers the whole schema, freeze, "any new migration needs Jo's approval"; yet it also allocates ranges per slice. Ranges and the freeze conflict: an S05 agent that needs an index (NFR-06) adds `0500_idx.sql`; S06 adds `0600_...`. Applied order is by number, so 0500 runs before 0600 on a fresh DB, but on a DB where 0600 was applied first (a branch merged earlier) the runner behaviour is unspecified: fail on out-of-order, or apply missing lower versions? Checksum covers changed files only.
- The committed schema snapshot compared in tests: two parallel branches both regenerate it, textual merge conflict, or each branch's snapshot passes alone but the merge fails.
- Seed (S00) inserts past bookings "directly" while triggers (AD-9) forbid `DELETE` and certain updates; AD-23 says it passes every trigger. A migration that adds a trigger later (S05) can retroactively break the seed's data or `demo:reset`; seed is S00, frozen? ("db/seed" not in the freeze list: S06 needs bookings for dashboard tests and edits `data.ts`, S05 needs an Expired pending; both edit one file.)
- Seed dependent on `Clock` reference instant for relative dates; `FELLES_NOW` unset -> real clock -> E2E Playwright set it, but dev seed differs from CI seed by date: week boundary content.

**Failure:** merge conflict on seed data and schema snapshot; migration runner refuses to start on the integration branch.

**Proposed AD:** the runner applies all pending versions in ascending order regardless of what is already applied, and fails only on checksum change or on a *gap that is lower than the max applied and already recorded as missing for a different content*; schema snapshot is generated by sorting `sqlite_master` and lives in a per-slice file `schema-snapshot/NNNN.txt` or is regenerated by CI only (never hand-merged). Seed: `db/seed/data.ts` is split into per-slice fixture files (`seed/s03.ts`, ...) registered in an S00-owned index, each exporting a function `(ctx) => void`; fixtures needed by tests are named (`FIXTURE.expiredPending`), exported by S00 with ids stable. Declare `db/seed` in the freeze list or give it per-slice files.

---

## P11 [H] How the web learns the user role and where navigation gating lives

**Units:** S01 auth feature (session query) vs S00 nav config/shell vs S05 approvals page vs S06 dashboard (admin panel).

**Legal choices:** `GET /api/session` returns `serverNow`, `demoData` and presumably `user:{id,name,role}`; its shape is S01's? (route in contracts; S00 stubs). Role read from DB each request (AD-11) so the web's cached role can be stale after nothing (no role changes, fine). Gating:
- S00 nav table has `adminOnly` entries filtered in the shell using `useSession()`; S05's approvals page additionally checks `role==='admin'` and redirects to dashboard; S06's dashboard renders the admin panel on `role==='admin'`, while S06 uses `dashboard` response's `adminPanel: null` for Members. Two sources: role in session vs presence of data in response.
- Direct URL to `/godkjenninger` by Member: route guard in the router (S00) shows "Ingen tilgang" page, or redirects to `/`, or the page fires the API and renders the 403 error. All three legal; E2E-07 expects one.
- `useSession` loading state: nothing says first render waits for the session (flash of Member nav).

**Failure:** Member sees empty admin tab flash; inconsistent denied UX; dashboard shows admin panel with API 403.

**Proposed AD:** `GET /api/session` is the sole source of role; `app/session.tsx` (S00) exposes `useSession()` and `<RequireRole role>` route element; the router (frozen) wraps admin routes in `RequireRole` which renders the shared "Ingen tilgang" screen (no redirect); the shell renders nothing until the session query has settled; nav `adminOnly` is derived from the contract route `access`. Dashboard payload for a Member omits nothing: `adminPanel: null` is returned by the server for Members and the web displays the panel iff `adminPanel !== null` — never by checking role.

---

## P12 [M-H] Optional-field null/omit and the AD-15 union

**Units:** S03 presenter (booking DTO) vs S02 presenter (resource DTO) vs S04 web parser.

**Legal choices:** AD-16: optional fields are `null`, never omitted, "except across the AD-15 union". AD-15 anonymous block: "no id, no user, no purpose" — absent keys. Zod `.strict()` or default strip? Tests "assert exact key set". The web parses with the same Zod: an `anonymous` block parsed by a union with `detail` (which has `bookerName: string`) falls to the discriminator; what is the discriminator? `kind:'detail'|'anonymous'` is not stated. S03 uses `visibility`, S04 reads `kind`... but the schema is S00-owned, so the real divergence is *what the viewer sees where a Member's own block appears inside a list of mixed blocks*, and whether the owner viewing the schedule gets the `detail` form for own blocks and `anonymous` for others — and an Administrator gets `detail` for all including rejected/cancelled blocks (are those even returned?).
- `seats?: number|null`; request body: client omits vs sends null: both must be accepted; PATCH semantics: omitted = unchanged, null = clear — nowhere stated. (RES update: "seats cleared" feature.)
- Zod 4 `z.string().optional()` vs `.nullable()` vs both in request vs response: web form with react-hook-form sends `""` for empty text input; server expects null; trimmed? `purpose` whitespace-only.

**Failure:** resource edit cannot clear seats; empty description stored as `""` in one path, `null` in another and the equality compare `before/after` in `resource.updated` diffs registers phantom changes.

**Proposed AD:** requests: optional fields accept `null` or omission, both mean "no value"; full replace semantics for PUT (no PATCH); strings are trimmed and `""` normalised to `null` by a shared `optionalText` Zod helper in contracts used by both sides. Schedule block union discriminator is `kind: 'detail'|'anonymous'`, schemas `.strict()`. Response optional fields are `null`.

---

## P13 [M] Field-error message ownership (Norwegian text)

**Units:** API validation mapper vs web react-hook-form `zodResolver`.

**Legal choices:** AD-4: `message` from catalogue; `fieldErrors` array of `{path, code, message}`. Zod default messages are English. Server error handler converts ZodError -> fieldErrors: with which codes? `code` for field errors (`TOO_LONG`? `REQUIRED`?) are English enum but the enum is for error codes, field codes unspecified. Client uses `zodResolver` with the same schema, producing Zod's English messages unless each schema sets a custom message; AD-21 says components contain no literal text and API messages come from catalogue "the web may override by `code`". So the client form (zodResolver) and the server (`fieldErrors`) produce different texts for the same violation, and server 400 field errors mapped into RHF `setError` use `message` while client-side use Zod's.

**Failure:** English "String must contain at most 200 character(s)" or two different Norwegian phrasings for the same limit; tests assert one.

**Proposed AD:** all Zod schemas in contracts use `z.config` custom error map keyed to `messages.nb` (a single `errorMap` exported by contracts and installed on both sides); a field violation is `{path, code: 'REQUIRED'|'TOO_LONG'|'TOO_SHORT'|'INVALID_FORMAT'|'OUT_OF_RANGE'|'NOT_ON_GRID'|…, message}` with the code set enumerated and the message templated with params (`max`); web displays server `message` verbatim and does not re-translate.

---

## P14 [M] DST / Oslo-day boundaries computed in two places; Windows path/line-endings

**Units:** server `time` module (Oslo-day ranges, AD-5) vs `contracts/rules.ts` (civil validation) vs web `Intl` split; S00 scripts on Windows.

**Legal choices:**
- AD-5 puts conversion and day ranges in "a single module" server-side; web does day bucketing with `Intl`; dashboard 7-day window (DEC-04: now+7 d) computed as `now + 7*24h` (ms arithmetic, correct for an instant window) while "i dag" bounds use Oslo-day ranges. A DST-week schedule (169 h/167 h) built as `weekStart + 7*86_400_000` is a legal reading of "week" and wrong by an hour twice a year; the 2026-10-25 seed bookings are exactly there. 23:30-to-00:30 bookings are impossible (window 08:00–22:00), so the damage is the week grid's last/first hour and the "i dag" end.
- `disambiguation: "reject"` for local times that don't exist/ambiguous: the window excludes 02:00–03:00 so safe; but the *date-only* arithmetic (add days to a civil date) done in JS `Date` by a slice rather than Temporal PlainDate drifts.
- Windows: the `ban Date.now`/`new Date()` rule exempts clock files only, but `new Date(iso)` with arguments is allowed everywhere, so any slice can reintroduce local-zone behaviour. Prettier `endOfLine`, `.gitattributes` (`* text=auto eol=lf`) are not specified; schema snapshot, checksum of migration files (AD-17) and the committed `tokens.css` comparison (AD-20) are byte-exact: a Windows checkout with CRLF changes SQL checksums (startup fails with "changed checksum" or differing snapshot) and `gen-tokens` output diff fails lint on Windows only. Path separators in `scripts/trace.mjs`/lint overrides (`no-restricted-imports` patterns) on `\\`.

**Failure:** CI green on Linux, red on Windows (or vice versa); DST-week schedule off by one hour; local dev on Windows fails startup with checksum mismatch.

**Proposed AD:** (a) `contracts/time.ts` exports the *only* civil-date arithmetic (`addDays(civil, n)`, `osloDayRange(civil)`, `osloWeekRange(mondayCivil)`, `windowFromNow(nowMs, days)`), implemented once with Temporal and used by server and web (the web does not use Temporal for local->UTC, per AD-5; these helpers return instants from civil dates, so make an exception: only the server calls the instant-producing ones, the web consumes ISO days from the API). Ban `new Date(<arg>)`, `setDate`, `getTimezoneOffset` outside `i18n/format.ts` and `contracts/time.ts`. (b) Add `.gitattributes` (`* text=auto eol=lf`), `.editorconfig`, Prettier `endOfLine: "lf"`; migration checksums computed over LF-normalised bytes; path handling in scripts via `node:path` and `url.fileURLToPath`; ESLint overrides with forward-slash globs only.

---

## Summary table

| # | Pair | Sev |
|---|---|---|
| P1 | Expired derivation: DTO / filters / dashboard / web | B |
| P2 | bookings repository ownership S03/S05/S06 | B |
| P3 | Activity event per use case and payloads | B |
| P4 | subject_user_id derivation | B |
| P5 | cancel vs decision reason columns, write-once fields | H |
| P6 | schedule/availability/upcoming/empty semantics | H |
| P7 | cursor, sort, nb-NO collation, search | H |
| P8 | cache invalidation map ownership | H |
| P9 | 501 stubs vs route-enumeration, no-501 gate | H |
| P10 | seed vs triggers vs migrations ordering / snapshot | H |
| P11 | role source and nav/route gating | H |
| P12 | null/omit, union discriminator, empty string | M |
| P13 | Norwegian field-error text ownership | M |
| P14 | DST / Oslo-day arithmetic; CRLF and checksums on Windows | M |

(Counts: Blocker 4, High 6, Medium 4. P12-P14 carry mixed risk; P14's CRLF checksum failure is a certain Windows-dev breaker and could be promoted to High.)

## Recommended minimum set of spine edits

1. New AD "Derived booking state and shared predicates" (P1, P6): `isExpired`, `isUpcoming`, `overlaps` in `contracts/rules.ts`; DTO carries `expired`.
2. New AD "Bookings module file ownership and repository signature set" (P2), plus a table-name lint rule.
3. New AD "Activity events: one event per use case, typed payloads, subject derived in the writer" (P3, P4).
4. Amend AD-9 with a per-transition field-write table and write-once columns (P5).
5. Amend AD-4 with list conventions: total order, default and max limit, `nextBefore`, `[]` for empty (P6, P7); add `compareNb` and `normaliseSearch`.
6. Amend AD-18 freeze list: `api/invalidation.ts`, `app/session`, `db/seed` index; complete the invalidation map at S00 (P8, P10, P11).
7. Amend AD-3 so stubs go through `registerRoute` and add a no-501 integration gate (P9).
8. Amend AD-16/AD-5 for null/omit request semantics, union discriminator, civil date helpers, `.gitattributes` and LF-normalised checksums (P12, P14); add the error-map rule (P13).
