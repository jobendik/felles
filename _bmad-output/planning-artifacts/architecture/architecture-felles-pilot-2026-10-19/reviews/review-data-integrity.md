# Review: data integrity and concurrency (Reviewer Gate, ad-hoc lens)

Spine reviewed: `ARCHITECTURE-SPINE.md` (status draft, 2026-10-19), AD-5 to AD-10, AD-16, AD-17, AD-23, with the `.memlog.md` spike notes.
Method: real SQLite (better-sqlite3 13.0.3, SQLite 3.53.4, temporal-polyfill 1.0.6) on Windows 11, Node v25.9.0 (the spine pins Node 24; no behaviour here depends on the difference). Throwaway spikes live in `%TEMP%\felles-dataint\` (`s1-triggers.mjs`, `s1b.mjs`, `s2-concurrency.mjs` + `worker.mjs`, `s3-types.mjs`, `s4-time.mjs`, `s5-migrate.mjs`, `s6-reset.mjs`, `s7-plan.mjs`, `s8b.mjs`, `s9.mjs`, schema in `schema.mjs`). Nothing was written inside the repo except this file.

Every finding is marked **[VERIFIED]** (reproduced by a spike, output quoted) or **[REASONED]** (argued from documented SQLite or library behaviour, not run).

## Verdict

**Sound core, with gaps in the backstop layer. No critical finding.**
I could not produce an overlap, a lost update or a partial write through the designed path (single connection, `BEGIN IMMEDIATE`, trigger backstop, STRICT tables). Six high findings should be folded into the spine before the S00 freeze, because they land in frozen artefacts (the whole schema and its triggers, the migration runner, `contracts/time.ts`, `contracts/rules.ts`).

| Tier | Count |
| --- | --- |
| Critical | 0 |
| High | 6 |
| Medium | 11 |
| Low | 8 |

---

## What held up (verified, no change needed)

- Trigger overlap abort, adjacent intervals allowed, overlapping cancelled rows allowed (also for seed history rows). `BEFORE INSERT` raising `BOOKING_OVERLAP` surfaces as `SqliteError` with `message === 'BOOKING_OVERLAP'` and `code SQLITE_CONSTRAINT_TRIGGER`, so the repository must map by message (all triggers share one code).
- Spine triggers do not block legitimate transitions: approve of a pending booking (CAS update), cancel of a confirmed booking by the owner, reject of an Expired pending booking (past row inserted directly, then rejected with reason), cancel by an administrator with a reason. `UPDATE OF resource_id,user_id,start_at,end_at,purpose` does not fire for a status-only update.
- `UPDATE OF` immutability, illegal pairs (`cancelled -> confirmed`, `cancelled -> pending`), `DELETE FROM bookings`, event `UPDATE`/`DELETE` all abort. `ON CONFLICT DO UPDATE` is blocked.
- Crash mid-transaction (child `SIGKILL`ed after inserting booking and event inside `BEGIN IMMEDIATE`): `bookings=0, events=0`, write lock free in 2 ms, `integrity_check = ok`. WAL recovery is clean on Windows.
- Deferred read-then-write upgrade (conn A reads, conn B commits, A writes): `SQLITE_BUSY_SNAPSHOT` after 1 ms, `busy_timeout` does not apply, one row total. So even a deferred transaction cannot create an overlap in WAL mode; it fails loudly. `BEGIN IMMEDIATE` simply converts this into a wait.
- A second process that holds the lock for 800 ms makes the API wait 868 ms and then lose to the trigger with `BOOKING_OVERLAP` (C scenario). A WAL checkpoint with a concurrent reader never blocks writers.
- `db.transaction(fn).immediate()` nests via savepoints and rolls back as a unit when the outer call throws; raw `BEGIN` inside a transaction throws.
- Three processes racing to migrate the same fresh DB with the runner in finding H4: `["ok [1]","ok []","ok []"]` (no duplicate apply, no crash).
- `AUTOINCREMENT`: id of a rolled-back insert is reused (`rolledBackId 7, nextId 7`), id of a deleted max row is not (`deleted 7, next 8`). Both are fine for `B-<id>`.

---

## High

### H1. AD-9 trigger set leaves booking history rewritable, and approval without approver possible  [VERIFIED]

Spine lists immutability for `resource_id, user_id, start_at, end_at, purpose` only. Spike (spine schema):

```
GAP  rewrite reject_reason on rejected row         -> allowed
GAP  rewrite decided_by on rejected row            -> allowed
GAP  rewrite cancelled_by/cancel_reason on cancelled row -> allowed
GAP  pending -> confirmed with no approver         -> allowed
GAP  event with WRONG subject_user_id (admin)      -> allowed
GAP  un-archive resource / DELETE resource         -> allowed
```
The spine's own "Prevents: overwritten history" and BR-5 are not backed by the DB for the decision/cancellation columns, and AD-15's `subject_user_id` (the Member-visibility key) is trusted to the caller.

**Proposed AD-9 addition** (append to the Rule):
> Terminal rows (`rejected`, `cancelled`) are frozen: any `UPDATE` aborts (`BOOKING_TERMINAL`). Decision columns (`decided_by`, `decided_at`, `reject_reason`) are write-once. `pending -> confirmed` requires `decided_by IS NOT NULL`. Field consistency is declared as `CHECK`s on `bookings` (below). `activity_events.subject_user_id` must equal the owner of `booking_id` (trigger `events_subject_matches`); resource events carry NULL.

Verified SQL (the 38-probe suite passes 38 of 38 with the hardening applied; the six gaps above all abort):
```sql
-- CHECKs on bookings (verified not to block approve/reject/cancel/seed rows)
CHECK ((decided_by IS NULL) = (decided_at IS NULL)),
CHECK (decided_by IS NULL OR decided_by <> user_id),                      -- DB backstop for OWN_REQUEST
CHECK (status <> 'pending' OR decided_by IS NULL),
CHECK (status <> 'rejected' OR (decided_by IS NOT NULL AND reject_reason IS NOT NULL AND length(trim(reject_reason)) > 0)),
CHECK (status = 'rejected' OR reject_reason IS NULL),
CHECK ((status = 'cancelled') = (cancelled_by IS NOT NULL)),
CHECK ((cancelled_by IS NULL) = (cancelled_at IS NULL)),
CHECK (cancelled_by IS NULL OR cancelled_by = user_id OR (cancel_reason IS NOT NULL AND length(trim(cancel_reason)) > 0)),  -- admin cancel needs reason
CHECK (cancelled_by IS NOT NULL OR cancel_reason IS NULL)

CREATE TRIGGER bookings_terminal_frozen BEFORE UPDATE ON bookings
WHEN OLD.status IN ('rejected','cancelled') BEGIN SELECT RAISE(ABORT,'BOOKING_TERMINAL'); END;
CREATE TRIGGER bookings_decision_write_once BEFORE UPDATE OF decided_by, decided_at, reject_reason, cancelled_by, cancelled_at, cancel_reason ON bookings
WHEN (OLD.decided_by IS NOT NULL AND (NEW.decided_by IS NOT OLD.decided_by OR NEW.decided_at IS NOT OLD.decided_at))
  OR (OLD.reject_reason IS NOT NULL AND NEW.reject_reason IS NOT OLD.reject_reason)
  OR (OLD.cancelled_by IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'BOOKING_DECISION_WRITE_ONCE'); END;
CREATE TRIGGER bookings_approve_needs_approver BEFORE UPDATE OF status ON bookings
WHEN OLD.status='pending' AND NEW.status='confirmed' AND NEW.decided_by IS NULL
BEGIN SELECT RAISE(ABORT,'BOOKING_APPROVER_REQUIRED'); END;
CREATE TRIGGER events_subject_matches BEFORE INSERT ON activity_events
WHEN NEW.subject_user_id IS NOT (SELECT user_id FROM bookings WHERE id = NEW.booking_id)   -- booking_id NULL -> subject must be NULL
BEGIN SELECT RAISE(ABORT,'EVENT_SUBJECT_MISMATCH'); END;
```
Note: a reason column CHECK uses `<>`/`IS NOT NULL` forms on purpose; a bare `reject_reason <> ''` passes for NULL.

### H2. `INSERT OR REPLACE` bypasses both the immutability and the no-delete triggers  [VERIFIED]

`bookings_immutable` and `bookings_no_delete` do not fire for `INSERT OR REPLACE` because SQLite's REPLACE conflict resolution deletes rows without delete triggers unless `recursive_triggers` is ON (default OFF).
```
spine                          REPLACE: ALLOWED | row now: [{"id":1,"purpose":"REWRITTEN","off":18000000}]
spine + recursive_triggers=ON  REPLACE: blocked: BOOKING_NO_DELETE | row stays "orig"
hardened (BEFORE INSERT guard) REPLACE: blocked: BOOKING_NO_DELETE | UPSERT: blocked
```
This silently changes a booking's time and purpose (violating BOK "never overwrite the interval") and erases audit rows. AD-8's "through any writer" claim is false for this writer. Fix in two parts, either is enough, both is belt and braces:

> **AD-16 addition:** the opener sets `PRAGMA recursive_triggers = ON` on every connection (seed, scripts, tests included; one `openDatabase()` function is the only constructor of `Database`). **AD-9 addition:** `BEFORE INSERT` guards on `bookings` and `activity_events` abort when `NEW.id` already exists.
```sql
CREATE TRIGGER bookings_no_replace BEFORE INSERT ON bookings
WHEN NEW.id IS NOT NULL AND EXISTS (SELECT 1 FROM bookings WHERE id = NEW.id)
BEGIN SELECT RAISE(ABORT,'BOOKING_NO_DELETE'); END;
-- same for activity_events with 'EVENT_NO_DELETE'
```
Also ban `OR REPLACE` / `REPLACE INTO` textually in the existing prepare lint rule (AD-16).

### H3. `busy_timeout = 5000` on a synchronous driver freezes the whole API for up to 5.5 s; SQLITE_BUSY has no mapped response  [VERIFIED]

Parent connection `BEGIN IMMEDIATE` while another process holds the write lock for 7 s:
```
B BEGIN IMMEDIATE vs 7s holder   SqliteError code=SQLITE_BUSY msg="database is locked"
B blocked for                    5519 ms; max event-loop gap 5519 ms
```
During the wait no other request is served, including `GET /api/health` (Playwright readiness, macOS smoke). The only expected cross-process writers are `db:seed`, `demo:reset` and test child processes, so this is a self-inflicted stall, and the resulting error falls into the generic 500 `INTERNAL` of AD-4. The deferred variant is worse: `SQLITE_BUSY_SNAPSHOT` returns in 1 ms with no wait.

**Proposed AD-7 change:**
> `busy_timeout = 2000`. `UnitOfWork.run` is implemented as `db.transaction(fn).immediate()`. A `SqliteError` whose `code` starts with `SQLITE_BUSY` (also `SQLITE_BUSY_SNAPSHOT`, `SQLITE_LOCKED`) maps to `503 DATABASE_BUSY` with `Retry-After: 1` and a Norwegian message, never 500; the log line is `warn`. No mutation is retried inside the server (a retry would re-run non-idempotent use cases). Tests: the cross-process test in AD-8(b) asserts `503` when the holder outlives the timeout and `409`/`201` when it releases earlier.

503 is a DEC-16 status-list extension (the memlog already lists 429 and 500 as extensions needing Jo); add it to the same approval line.

### H4. Migration checksums and the schema snapshot are line-ending dependent; repo has no `.gitattributes` and `core.autocrlf=true` here  [VERIFIED]

```
5 autocrlf=true checkout has CRLF                       true
5 with .gitattributes "*.sql text eol=lf": CRLF?        false
1 naive runner after EOL flip                           MIGRATION_CHECKSUM 0001_a.sql
2 sqlite_master.sql contains \r when file was CRLF      true
2 snapshot text equal across EOLs?                      false
2 normalised then exec: has \r                          false
```
Consequences: (a) a developer who changes `autocrlf`, re-clones, or whose editor rewrites line endings gets a startup failure `checksum changed` on an unmodified migration; (b) `sqlite_master.sql` stores the statement text including `\r`, so the committed schema snapshot (AD-17) differs between Windows (CRLF checkout) and macOS/Linux, and the CI matrix goes red on exactly one OS for a reason unrelated to the schema; (c) Prettier's default `endOfLine` is `lf`, so `prettier --check` fails on CRLF checkouts of any file.

**Proposed AD-17 addition (and S00 file list):**
> `.gitattributes` (frozen, S00): `* text=auto eol=lf` plus explicit `*.sql text eol=lf`, `*.snap text eol=lf`, `*.md text eol=lf`; Prettier `endOfLine: "lf"`. The runner reads each file, strips a leading BOM, normalises `\r\n?` to `\n`, then hashes **and executes** the normalised text, so the stored checksum and `sqlite_master.sql` are EOL-independent. The schema snapshot is generated from the migrated database and compared after the same normalisation.

Runner behaviours verified in the same spike and worth stating in AD-17:
- It runs inside `db.transaction(...).immediate()` and **re-reads** `schema_migrations` inside the transaction, otherwise two processes (`npm start` plus `npm run db:seed`) race on a fresh database. Verified: 3 racing runners, one applies, the others apply nothing.
- It applies **every unapplied file in numeric order**, not "versions above the maximum applied". The slice ranges (0300s, 0500s) make out-of-order arrival normal after a branch merge. Verified: `0001,0500` applied, later `0300` is applied; a "greater than max" runner would silently skip it.
- A version recorded in the database with no file on disk fails startup (`MIGRATION_MISSING_FILE`), which catches a branch switch onto older code.
- `PRAGMA foreign_keys` inside a migration transaction is a no-op (verified: stays `1`), and `journal_mode` inside a transaction does not switch (verified: `memory`). Both PRAGMAs belong only in `openDatabase()`. Migration files must not contain their own `BEGIN`/`COMMIT`, and the runner must pass the whole file to `exec` (never split on `;`; trigger bodies contain semicolons).

### H5. Top-3 ranking with nb-NO tie-break must not be done in SQL, and the tie-break needs a final `id` key  [VERIFIED]

Same name list sorted four ways (spike `s4-time.mjs`):
```
nb-NO      : aula | Aula | bergen | Bergen | Écran | Eske | Mote | Moterom | Møte | Møterom 10 | Møterom 2 | Projektor | Zebra | Ærlig | Ö-rom | Øst | Aa-rom | Ål | Åpent rom
SQLite BIN : Aa-rom | Aula | Bergen | Eske | Mote | Moterom | Møte | Møterom 10 | Møterom 2 | Projektor | Zebra | aula | bergen | Ål | Åpent rom | Ærlig | Écran | Ö-rom | Øst
```
SQLite `BINARY` puts uppercase before lowercase, `Å` before `Æ` and `Ø`, and `Aa-rom` first; nb-NO ICU puts `Æ < Ø < Å` and treats `Aa` as `Å` (last). For four tied resources {Zebra, Ærlig, Øst, Åpent rom}: nb-NO top three = Zebra, Ærlig, Øst; SQL-binary top three = Zebra, Åpent rom, Ærlig. A `ORDER BY cnt DESC, name LIMIT 3` implementation therefore fails the VIS-04 / DEC-04 test that the PRD requires in S06. Also, resource names are not unique (Deferred section), so two tied resources with the same name leave the order undefined.

**Proposed AD-6/AD-15 addition (dashboard) or AD-16 rule:**
> Ranking and any other language-sensitive ordering is done in application code: SQL returns `(resource_id, name, confirmed_count)` for all resources with count > 0 in the window; the use case sorts with one shared `Intl.Collator('nb-NO')` (non-numeric, default sensitivity) as `count desc, collator(name), id asc` and slices 3. No `ORDER BY name` in SQL feeds a user-visible order, and no `COLLATE` is defined for it. The same comparer is used for the resource catalogue order.

### H6. Activity "Vis flere" cursor must be the autoincrement id, not the timestamp, because the E2E clock is frozen  [REASONED]

AD-6 freezes the server clock (`FELLES_NOW`), so every event written during a test run has the same `at`; the seed's events share timestamps too (DST pair, same reference instant). AD-4 introduces a `before` cursor for the activity list but does not define it. A cursor on `at` skips or duplicates rows; a cursor on `(at, id)` works but needlessly. 

**Proposed AD-4/AD-15 addition:** `before` is an `activity_events.id` (the AUTOINCREMENT column is monotonic and never reused), the list is ordered `id DESC`, `at` is display data only. Index: `activity_events(subject_user_id, id)` and `(id)`.

---

## Medium

### M1. Retried `POST /api/bookings` is reported as a conflict with the user's own booking  [REASONED]
Client retries after a lost response (or the user double-clicks past the disabled button) arrive after the first commit; the overlap check hits the first request's row and returns 409 `BOOKING_CONFLICT`, so the UI says the slot is taken when it is the user's own booking. Same for cancel/approve/reject retries (409 `BOOKING_NOT_PENDING` is also the wrong code for a double cancel of a confirmed booking: AD-9 reuses it for every CAS failure).
**Proposed AD-9 addition:** on `BOOKING_CONFLICT`, if the conflicting row has the same `user_id`, `resource_id`, `start_at`, `end_at`, `purpose` and `created_at >= now - 60 s`, return that booking with 200 (create is idempotent by natural key). CAS failures return `409` with `details.currentStatus`, and the web treats "already in the requested target status" as success after refetch. Add codes `BOOKING_NOT_CANCELLABLE` for cancel (status already `cancelled`/`rejected`) so `BOOKING_NOT_PENDING` stays accurate.

### M2. Windows test-harness pitfalls for second-connection tests  [VERIFIED]
- Opening a WAL database while another process is closing its last connection fails with `SQLITE_IOERR_TRUNCATE` (disk I/O error), `busy_timeout` does not help:
  ```
  race-exit    { SQLITE_IOERR_TRUNCATE: 8, ok: 7 }     (open immediately after child's 'committed')
  after-exit   { ok: 15 }                              (await child 'exit' first)
  idle-alive   { ok: 15 }                              (child stays alive)
  ```
- `fs.rmSync` of the temp directory with an open handle (own connection or a still-running child) fails with `EPERM` on Windows (not `EBUSY`); after `db.close()` it succeeds and `-wal`/`-shm` are removed by the clean close (`t.db,t.db-shm,t.db-wal` while open, `t.db` after).
**Proposed AD-24 addition:** `temp-db.ts` returns `{ path, db, dispose }`; `dispose` closes the connection, awaits all spawned children's `exit`, then `rmSync(..., { recursive: true, force: true, maxRetries: 5, retryDelay: 50 })`. The parent keeps its own connection open for the whole child-process test (the child's last-close truncation then never races), children are always awaited to `exit` before the parent opens a new connection, and `openDatabase()` retries once on `SQLITE_IOERR_TRUNCATE`. Never leave a child holding a transaction on test failure (`afterEach` kills children).

### M3. `UnitOfWork.run` must reject async callbacks at the type level; the continuation runs outside any transaction  [VERIFIED]
`db.transaction(async () => {...}).immediate()` throws `Transaction function cannot return a promise` and rolls back the synchronous part, but the code after the first `await` still runs afterwards, in autocommit mode, on the same connection (spike `s9.mjs`: the continuation's insert executed and failed on a foreign key only because the booking had been rolled back; with `booking_id = NULL` it would have committed an orphan event).
**Proposed AD-7 addition:** `run<T>(fn: (tx: Tx) => T extends PromiseLike<unknown> ? never : T)`; implement with `db.transaction(...).immediate()` (not hand-written `exec('BEGIN IMMEDIATE')`); lint rule `no-misused-promises`-style ban on `async` arrow functions passed to `UnitOfWork.run`; `Tx` is invalid after the callback returns.

### M4. Read the Clock inside the transaction  [REASONED]
`approve` checks `start > now`; `archive` checks future bookings with `start > now`. If `now` is read before `BEGIN IMMEDIATE` and the lock wait takes seconds, the check uses a stale instant. **AD-6/AD-7:** the use case reads `clock.now()` once, as the first statement inside the transaction callback, and uses that single value for every check, every `*_at` column and the activity event `at` of that mutation (so `decided_at = event.at = created_at`).

### M5. Grid and duration have a free DB backstop; seed must be grid-aligned  [VERIFIED]
Oslo offsets are whole hours, so the `:00/:30` grid is a multiple of 1 800 000 ms in UTC too. These `CHECK`s passed the whole probe suite (08:15 start and a 5 h booking both abort with `CHECK constraint failed`; exactly 4 h and 30 min pass):
```sql
CHECK (end_at > start_at),
CHECK (start_at % 1800000 = 0 AND end_at % 1800000 = 0),
CHECK (end_at - start_at BETWEEN 1800000 AND 14400000)
```
The 08:00-22:00 window cannot be checked in SQL (needs the zone) and "not in the past" needs the injected clock; both stay application-only, and that should be said in AD-8. AD-23 must then say: the seed derives every start/end from Oslo civil values through the same server converter (never `now - 90 * 60000`), otherwise the first non-aligned seed row aborts S00.

### M6. The overlap trigger and the application query lose the partial index unless the status list is textually identical  [VERIFIED]
```
status IN ('pending','confirmed')       -> SEARCH b USING INDEX bookings_blocking (resource_id=? AND start_at<?)
status IN ('confirmed','pending')       -> SCAN b
status <> 'cancelled' AND <> 'rejected' -> SCAN b
```
Harmless at demo scale, but a repository author who writes the list in the other order silently drops NFR-06's index. **AD-16:** use a plain index `(resource_id, status, start_at)` (no partial predicate), or define the blocking-status SQL fragment once as a constant used by trigger, repository and index. Add `EXPLAIN QUERY PLAN` to the schema test for the overlap query.

### M7. "Archived is final" and "a resource is never deleted" (AD-10) have no database enforcement  [VERIFIED]
Spike: `UPDATE resources SET status='active'` on an archived row and `DELETE FROM resources` both succeed on the spine schema. AD-9's trigger list covers only `bookings` and `activity_events`. **Add to AD-10:** triggers `resources_archive_final` (abort when `OLD.status='archived' AND NEW.status<>'archived'`) and `resources_no_delete`; all foreign keys `ON DELETE RESTRICT` (verified: deleting a referenced user fails with `FOREIGN KEY constraint failed`); `users` and `sessions` rows are never deleted except `sessions` by logout/purge. SQL in the review spike `schema.mjs` (`HARDEN`).

### M8. Civil-input parsing traps in the single time module  [VERIFIED]
temporal-polyfill 1.0.6 accepts far more than `YYYY-MM-DD` / `HH:mm`:
```
PlainDate.from("2026-10-19T10:00")           "2026-10-19"      (datetime string accepted as a date)
PlainDate.from("20261019")                   "2026-10-19"      (basic format)
PlainDate.from("+002026-10-19")              "2026-10-19"
PlainDate.from("2026-10-19[Europe/London]")  "2026-10-19"      (annotation ignored)
PlainTime.from("08:00:30")                   "08:00:30"        (seconds accepted)
PlainDate.from({year:2026,month:2,day:30})   "2026-02-28"      (object form constrains by default)
PlainDate.from("2026-02-30")                 RangeError        (string form rejects)
```
**AD-5 addition:** the Zod schemas in `contracts/rules.ts` enforce `^\d{4}-\d{2}-\d{2}$` and `^([01]\d|2[0-3]):(00|30)$` before anything reaches Temporal; the converter uses `Temporal.PlainDateTime.from(`${date}T${time}`, { overflow: 'reject' }).toZonedDateTime('Europe/Oslo', { disambiguation: 'reject' })` and asserts the round-trip `plainDate.toString() === date`. Never build a `PlainDate` from an object with default overflow. Also note that `disambiguation: 'reject'` throws for both the ambiguous (2026-10-25 02:30) and the missing (2027-03-28 02:30) wall times, both with the same `RangeError: Ambiguous offset` message; since the 08:00-22:00 window excludes both, that branch is unreachable for valid input and must be mapped to 400, not 500, if it is ever reached.

### M9. "30 days" is `30 * 24 h`, which is one hour short of 30 calendar days across the DST switch  [VERIFIED]
With the E2E frozen clock `2026-10-19T07:00:00Z` (Monday 09:00 Oslo):
```
limit instant = 2026-11-18T07:00:00.000Z = Oslo 2026-11-18T08:00:00+01:00
2026-11-18 09:00 Oslo <= limit   false      (the natural "exactly 30 days ahead" slot is refused)
30 calendar days via Temporal add({days:30}) = 2026-11-18T09:00:00+01:00
```
The spine's `start <= now + 30 * 24 h` matches the requirement text ("mer enn 30 døgn", døgn = 24 h), but a test author or the date picker's `max` attribute will compute calendar days and disagree by one hour from 25 October to 28 March. **AD-5 addition:** state the interpretation explicitly ("30 døgn = 30 x 24 h, boundary inclusive; the last bookable start for the frozen test clock is 2026-11-18 08:00 Oslo"), put the constant and the check in `contracts/rules.ts` as a pure function of `(startInstant, nowInstant)`, and derive the date-picker `max` from the same function. Same interpretation question for the 7-day dashboard window (DEC-04, `end > now AND start < now + 7 x 24 h`; verified strict boundaries: ends exactly `now` excluded, starts exactly `now+7d` excluded); state "7 x 24 h" there as well.

### M10. Day and week ranges: always `startOfDay` plus `add({days})`, never `+ 24h`  [VERIFIED]
```
day 2026-10-25  start 2026-10-24T22:00Z end 2026-10-25T23:00Z  hours 25
day 2027-03-28  start 2027-03-27T23:00Z end 2027-03-28T22:00Z  hours 23
week from 2026-10-19: 169 h     week from 2027-03-22: 167 h
naive start + 24h on 2026-10-25 -> 2026-10-25T22:00Z   (loses the hour 22:00-23:00Z)
```
A `from&days` schedule query or "i dag" filter built on `+86400000` drops or double-counts an hour on both switch days, which is where DEC-09 asks for tests. **AD-5 addition:** `osloDayRange(date)` and `osloWeekRange(date, days)` are the only range builders, half-open `[start, end)`, overlap predicate `start_at < :to AND end_at > :from`.

### M11. `FELLES_NOW` without an offset is parsed in the machine's time zone  [VERIFIED]
```
Date.parse("2026-10-19T07:00:00") TZ=UTC -> 07:00Z ; TZ=Europe/Oslo -> 05:00Z ; TZ=America/New_York -> 11:00Z
```
A frozen clock that silently differs by machine breaks the "Monday 09:00 Oslo" E2E narrative. **AD-6/AD-22:** `config.ts` parses `FELLES_NOW` with `Temporal.Instant.from` (which requires `Z` or an offset) and fails startup otherwise; document the example value with `Z`.

---

## Low

- **L1. `demo:reset` (AD-23).** Verified: on Windows `rmSync` of the database directory or file fails with `EPERM` while the server (or a child) holds the file; on macOS/Linux `unlink` succeeds while the server keeps writing into the unlinked inode (reasoned, standard POSIX behaviour), so the demo appears reset but the server serves the old data. Deleting only `felles.db` and leaving `-wal`/`-shm` did **not** resurrect old data in my run (fresh DB showed no tables, `integrity_check ok`), but that is not a guarantee. Proposed AD-23 text: `demo:reset` deletes `felles.db`, `felles.db-wal`, `felles.db-shm` together; first it opens the file and runs `BEGIN EXCLUSIVE; ROLLBACK` as a liveness probe (fails with `SQLITE_BUSY` only while a writer is active) and additionally refuses when `GET http://127.0.0.1:PORT/api/health` answers, with the message "Stopp serveren først"; on `EPERM`/`EBUSY` it prints the same message.
- **L2. `synchronous = NORMAL` in WAL.** Committed transactions can be lost on power failure or OS crash (not on process crash, which I verified), never corrupt the file. Acceptable for a local demo; say so in AD-7 so nobody claims durability. `openDatabase()` should assert `pragma('journal_mode=WAL')` returned `'wal'` (it returns `'memory'` on `:memory:`, and silently `'delete'` on unsupported filesystems, e.g. a synced folder).
- **L3. `UPDATE OF` triggers fire on no-op writes.** `UPDATE bookings SET purpose = purpose` aborts with `BOOKING_IMMUTABLE`. That matches "any update" in AD-9 and is stricter, which is fine, but repositories must update only the columns they change (no generic "save whole row"). State it in AD-16.
- **L4. All triggers share `SQLITE_CONSTRAINT_TRIGGER`.** The repository maps by exact `message` (`BOOKING_OVERLAP`, `BOOKING_ILLEGAL_TRANSITION`, ...). List the stable trigger messages in the contracts error section so an unmapped one becomes `INTERNAL`, not an invented 409. Triggers run before CHECK evaluation, so a malformed row can report a trigger message rather than the CHECK error; cosmetic.
- **L5. Type coercion at the driver edge.** Verified: a float `1.5` into an `INTEGER` STRICT column fails (`SQLITE_CONSTRAINT_DATATYPE`), `NaN` becomes NULL (`NOT NULL constraint failed`), `Infinity` fails, a numeric string `"1792000000000"` is silently coerced to an integer, `true` and `Date` objects throw `TypeError`, `undefined` binds as NULL, BigInt works and `lastInsertRowid` is a `number`. JS numbers above int32 bind as REAL (`typeof(?) = 'real'`), so SQL arithmetic on bound parameters yields REAL, which is harmless for comparisons and lossless on insert into an INTEGER column. Epoch ms stays far inside 2^53 (year 9999 = 253 402 214 400 000). Consequence for AD-16: strictness lives in Zod and in repository mapping (`toBool`/`fromBool`, `Number.isSafeInteger` assertion in the instant mapper), not in SQLite; do not rely on the driver to reject strings. `BOOLEAN`/`DATETIME` column types are rejected by STRICT (verified), so the `INTEGER CHECK (x IN (0,1))` form is required, as the spine says. A nullable column with `CHECK (a IN (...))` accepts NULL, so every enum column needs `NOT NULL` (verified).
- **L6. Purpose length.** SQLite `length()` counts code points; Zod `.max()` counts UTF-16 units (`'😀😀'`: 2 vs 4). If a `CHECK (length(purpose) <= N)` is added it must use the larger bound or be omitted.
- **L7. Session purge on read versus "GET never mutates".** AD-11 purges expired session rows on access and AD-13 says GET never mutates; the purge is a write outside `UnitOfWork` that can hit `SQLITE_BUSY` on a read request. Perform it inside a `UnitOfWork` on login/logout only, and treat expiry as a pure comparison on read.
- **L8. Archive versus create is correct only because of the single write lock.** [REASONED] The database cannot backstop "no blocking booking on an archived resource" (it needs the injected clock to tell future from past, and the seed legitimately holds past bookings for archived resources). AD-10 is therefore a use-case-level guarantee; the cross-process test in AD-8(b) should include an archive-versus-create variant. With `BEGIN IMMEDIATE`, the second writer's reads begin after it holds the lock, so it sees the committed archive (SQLite WAL semantics, documented; the deferred variant instead fails with `SQLITE_BUSY_SNAPSHOT`, verified above).

Out of lens but noticed: with a frozen `FELLES_NOW`, the 10 s login lock in AD-12 never expires (the Clock never advances), so an E2E that trips the limiter cannot recover without restarting the server. Either let the frozen clock tick from the frozen origin (`now = FELLES_NOW + monotonic elapsed`) or key the lock on the real monotonic clock.

---

## Requested checks, answered directly

1. **Can any of the transaction modes produce an overlap, lost update or partial write?** No. Deferred read-then-write fails loudly with `SQLITE_BUSY_SNAPSHOT` (no overlap); `BEGIN IMMEDIATE` waits and then loses to the trigger; busy-timeout expiry throws `SQLITE_BUSY` after ~5.5 s with no write; checkpoints never block writers; `SIGKILL` mid-transaction leaves 0 rows and a free lock. The API response on `SQLITE_BUSY` is currently an unmapped 500 and the wait freezes the process (H3).
2. **Triggers.** The spine's set works and does not block approve, expired-reject, admin-cancel-with-reason or seed history inserts (30 of 38 probes pass on the spine; the 8 gap lines are H1, H2, M7, the REPLACE probe being re-verified separately in `s1b.mjs`). With the additions, 38 of 38 pass.
3. **STRICT/CHECK/epoch.** See L5, M5. No integer/float binding problem for epoch ms; the traps are NaN, numeric strings and `undefined`.
4. **Time.** DST conversions are correct (`2026-10-25 08:00 Oslo = 07:00Z`, `2027-03-28 08:00 Oslo = 06:00Z`; the earlier memlog numbers stand); traps are M8, M9, M10, H5.
5. **Archive race and retries.** L8 and M1.
6. **Activity atomicity and `subject_user_id`.** Atomicity holds (crash and fault-injection style probes), derivation is unenforced in the database (H1). Derive it inside `recordEvent(tx, event)` from the booking row (`SELECT user_id FROM bookings WHERE id = ?`), never from a caller argument; the trigger above is the backstop. A trigger-only approach that auto-writes the event from an `AFTER` trigger was considered and rejected: the actor is not available inside SQL.
7. **Windows.** M2 and L1.
8. **CRLF.** H4, with fix.

## Suggested spine edit list (for the editor, not applied)

AD-5: M8, M9, M10 text. AD-6: M4, M11. AD-7: `busy_timeout = 2000`, `db.transaction().immediate()`, async ban (H3, M3), durability note (L2). AD-8: add that the window and past-checks are app-only (M5), 503 expectation (H3), archive-versus-create variant (L8). AD-9: H1, H2, M1 text and SQL. AD-10: M7 triggers. AD-16: `recursive_triggers = ON`, REPLACE ban, index form, update-only-changed-columns, ordering done in code (H2, H5, M6, L3). AD-17: `.gitattributes`, normalised hash and execution, runner behaviours (H4). AD-23: grid-aligned seed, `demo:reset` guard (M5, L1). AD-24: `temp-db` dispose contract (M2). AD-4: `before` = id cursor, `503 DATABASE_BUSY`, `BOOKING_NOT_CANCELLABLE` (H3, H6, M1).
