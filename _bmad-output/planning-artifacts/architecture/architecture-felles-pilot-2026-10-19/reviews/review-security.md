# Security review of the architecture spine (FELLES)

Lens: threat model, ad-hoc Reviewer Gate lens. Spine reviewed: `ARCHITECTURE-SPINE.md` (draft, 2026-10-19). Spine not edited. Context: local-only demo, seeded dev credentials, 5-30 members, designed to production quality.

## Verdict

**Conditional pass.** The skeleton is sound: hashed session ids, default-deny route table, central policy, role-scoped projections with a key-set test, parameter binding, an Origin allowlist, no CORS. There are no critical gaps. Three high findings must be fixed before the freeze, because they are either guaranteed defects (S-01) or defeat a stated control (S-02, S-03). The medium items are mostly one-line additions to AD-11, AD-12, AD-13, AD-16, AD-22 and AD-26.

Counts: critical 0, high 3, medium 12, low 10 (25 findings).

Controls that hold up (no action): 256-bit random session id with SHA-256 at rest; `HttpOnly`/`SameSite=Lax`; role read per request; preflight blocked because there is no CORS plugin and JSON is not a simple content type; `Origin: null` is not in the allowlist and is refused; login is inside the Origin check (login CSRF closed); the envelope is an object, not a bare array (no JSON hijack); anonymous blocks cannot be ordered by id because blocking bookings never overlap, so start time is a total order; React escaping; `GET /api/health` returns nothing sensitive; no secrets exist in the design.

---

## HIGH

### S-01 scrypt parameters exceed Node's default `maxmem`; every login would fail (AD-11)
- Memory needed is about 128 x N x r = 128 x 65536 x 8 = 64 MiB. Node's `crypto.scrypt` defaults to `maxmem` 32 MiB and throws `ERR_CRYPTO_INVALID_SCRYPT_PARAMS` ("memory limit exceeded"). The spine states the parameters but not `maxmem`.
- Exploit/consequence: either the first login test fails (best case), or an agent "fixes" it by passing `maxmem: Infinity`/a huge value. The flip side is that "verification honours the stored parameters" lets any row in `users` dictate cost: a tampered or migrated hash with N=2^24 makes a login allocate gigabytes (self-DoS; the DB is trusted, but defence in depth is cheap).
- Close with, in AD-11 after "(`N=2^16, r=8, p=2`, 64-byte key)": "`maxmem` is set explicitly to `256 MiB`. Verification parses the stored parameters and rejects (as a failed login, logged at `error`) any set outside `N in [2^14, 2^17]`, `r in [8, 16]`, `p in [1, 4]` or a hash length other than 64 bytes. The dummy hash is generated at startup with the current parameters so a miss costs the same as a hit."

### S-02 Throttle is check-then-act across an `await`; parallel guesses bypass the limit (AD-12)
- The counter is read before async scrypt and incremented after it. 50 concurrent requests for one email all see "0 failures" and all run. The 5-attempt rule never engages within a burst. Also, the spine does not say whether a refused (429) attempt extends the 10 s window.
- Exploit: `for i in 1..200 curl -X POST /api/login -d '{"email":"admin@...","password":"guess$i"}' &` (with a valid Origin header). The limit is only the libuv pool (about 4 concurrent), not 5 tries. Conversely, if refusals refresh `lastFailure`, anyone can hold a victim's account in 429 forever by sending one request every 9 s (lockout abuse).
- Close with, in AD-12: "The attempt is reserved synchronously before verification (`failures += 1`, `lastAttemptAt = monotonicNow`) and the reservation is released only on success; the check, the reservation and the lookup of the stored hash happen in one synchronous block. A refused attempt does not change `lastFailure`. After the 5th failure the delay doubles per further failure (10 s, 20 s, ... capped at 5 min), and `Retry-After`/`retryAfterSeconds` report the remaining time."

### S-03 Unknown-email flood bypasses the per-email limit and starves the threadpool; map eviction clears a victim's counter (AD-11, AD-12)
- Each distinct email gets its own counter, so rotating emails never reaches 5. Each request costs 64 MiB and about 150-300 ms of one of 4 pool threads, with an unbounded queue. `fs` (static files), DNS and `crypto.randomBytes` share that pool, so a 100 req/s flood stalls static serving and every legitimate login. Because "size-bounded" does not say how eviction works, 10,000 junk emails also evict a targeted email's entry (reset to zero).
- Close with, in AD-12: "A global login limiter wraps verification: at most 2 scrypt verifications in flight; at most 8 queued; beyond that, 429 `RATE_LIMITED` before any hashing. The per-email map holds at most 1,024 entries; it evicts the entry with the oldest `lastAttemptAt` and never evicts an entry whose delay is still active (if full of active entries, the global limiter answers 429). `UV_THREADPOOL_SIZE` is set to 8 in the start script." Move "per-IP" out of Deferred only as far as this global cap.

---

## MEDIUM

### S-04 No Host header validation; DNS rebinding and non-loopback bind with public demo credentials (AD-13, AD-22)
- Binding to 127.0.0.1 does not stop `evil.example` (TTL 0, rebinding to 127.0.0.1) from reaching the server from the victim's browser. Writes are still stopped by the Origin allowlist and the victim's cookie is not sent to `evil.example`, so impact is limited to unauthenticated GETs (`/api/session`, `/api/health`, static) and attacker-visible `demoData`. The larger exposure is `FELLES_HOST=0.0.0.0` (a one-line env change) with README-published dev credentials: anyone on the LAN logs in as the administrator.
- Close with, in AD-13: "An `onRequest` hook rejects with 421 any request whose `Host` is not `localhost`, `127.0.0.1` or `[::1]` (with the configured port, plus the Vite dev port in development) or listed in `FELLES_ALLOWED_HOSTS`." In AD-22: "`config.ts` refuses to start when `FELLES_HOST` is not loopback while `app_meta.data_origin = synthetic-seed`, unless `FELLES_ALLOW_REMOTE_DEMO=1`, and then logs a warning at `warn` on every start." Note the Vite proxy must send `changeOrigin: true` or the allowlist must include `localhost:5173`.

### S-05 Default allowlist trusts the Vite origin in every run; cookies are not port-isolated (AD-13, AD-11)
- Cookies ignore ports and `SameSite` treats all `localhost:*` as same-site. Any other local web app on `localhost:5173` (another Vite project, which is very common for a developer machine) is in the default allowlist and can make authenticated writes with Jo's FELLES cookie in a production-style run. Separately, any local app on any port can overwrite `felles_sid` with its own session value (cookie injection): the victim then books as the attacker's account; the only credential needed is the published seed password.
- Close with, in AD-13: "The `5173` origins are in the allowlist only when `NODE_ENV=development`. `FELLES_ALLOWED_ORIGINS` entries must be exact `scheme://host[:port]` strings; `*` and `null` are rejected by the config schema." In AD-11 add: "`GET /api/session` returns the user id; the SPA re-fetches it on window focus and treats a changed id as a session change (see S-09)." Cookie `__Host-` prefix is not possible over http, so record in Deferred: "Cookie injection from sibling localhost ports is accepted at demo scale."

### S-06 Authorisation must precede state checks, or 409 leaks other members' booking state (AD-9, AD-14)
- AD-9 lists state checks (`BOOKING_NOT_PENDING`, `BOOKING_STARTED`, `OWN_REQUEST`) without fixing order relative to `policy.can`. If cancel runs the compare-and-set first, a Member calling `POST /api/bookings/{id}/cancel` on someone else's booking learns "409 not pending" vs "403": the status of a booking the AD-15 projection hides. Same for approve/reject (the Member route gate gives 403 first, fine) and `GET`.
- Close with, in AD-14: "In every use case the order is: load the row, `policy.can`, then state/rule checks, then write. A caller who may not read a booking never receives a state-dependent error for it." Add a test line to AD-3's route test: "Member x foreign booking x {cancel} returns 403 for every status."

### S-07 No input bounds anywhere: text lengths, `limit`, schedule range, body size, request timeouts (AD-2, AD-4, AD-16)
- AD-4 says lists take `limit` but gives no maximum; the SQLite driver is synchronous, so one `limit=10000000` activity list or a multi-year schedule range blocks the event loop for every user. `purpose`, `reason`, resource `name`/`description` have no stated length caps; Fastify's default body limit is 1 MiB. Stored text is also rendered in layouts and aria-live toasts.
- Close with, in AD-2: "Every string in a request schema has `trim()`, NFC normalisation, control characters (Cc/Cf including bidi overrides U+202A-202E, U+2066-2069) rejected, and a maximum length: email 254, name 80, description 500, purpose 200, reason 500. Every list query has `limit` int 1..100 (default 50); the schedule takes at most a 31-day range. All request schemas are `.strict()`." In AD-13: "Fastify `bodyLimit` is 16 KiB; `requestTimeout` 15 s, `connectionTimeout` 10 s, `maxParamLength` 32."

### S-08 Mass assignment and client-controlled scope (AD-2, AD-15, resources PATCH)
- Zod's default `object()` silently strips unknown keys; it does not reject them, so a typo'd or hostile `userId`, `status`, `role`, `archivedAt` produces no signal and a future refactor to spread the body into a repository call becomes an escalation. `PATCH /api/resources/{id}` is the exposed spot: if archive state (`status`) is a patchable field it bypasses AD-10's guard (future-booking check). Booking list "filters" could include `userId`; a Member passing another's id must not widen scope.
- Close with, in AD-3: "Request schemas are `.strict()` (unknown keys are 400). Fields set by the server (`userId`, `status`, `role`, `archivedAt`, timestamps) do not exist in any request schema. Resource archive is its own route (`POST /api/resources/{id}/archive`) and `PATCH` cannot carry `status`. For a Member the `userId` filter is derived from the session and a client-supplied one is not accepted."

### S-09 Multi-tab and shared-browser identity switch shows stale cross-user data (AD-11, AD-19)
- Cookies are shared by all tabs. Tab A is Ingrid (member). In tab B an admin logs in; tab A keeps Ingrid's cached TanStack data and header, but its next click acts as the administrator (role-confused UI, not a server bypass). Conversely after logout, the in-memory query cache and back-button history still show detail blocks, purposes and activity.
- Close with, in AD-19: "On logout, on any 401, and when `GET /api/session` returns a different user id than the cached one, the client calls `queryClient.clear()` before routing. The session query refetches on window focus and on `visibilitychange`." In AD-11: "Login with an existing valid cookie deletes that session row before creating the new one."

### S-10 No `Cache-Control` on API responses (AD-13)
- Neither helmet nor the spine sets `Cache-Control: no-store` on `/api`. Browsers may serve authenticated JSON from the back/forward cache after logout (violates the spirit of AUT-02) and heuristic caching of `GET /api/schedule` is possible.
- Close with, in AD-13: "Every `/api/**` response carries `Cache-Control: no-store`. Hashed `/assets/*` are `immutable`; `index.html` is `no-cache`."

### S-11 helmet defaults break or poison localhost (AD-13)
- `@fastify/helmet` defaults add `upgrade-insecure-requests` (known to blank the page on Safari/localhost over http, which collides with the macOS NFR-01 smoke) and `Strict-Transport-Security` (ignored over http, but once TLS is ever used on `localhost`, it pins HSTS for every other localhost dev server). The CSP also leaves `base-uri`, `form-action`, `object-src` implicit.
- Close with, in AD-13, replace the CSP sentence: "CSP is `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`, with `upgrade-insecure-requests` disabled and HSTS off unless `FELLES_COOKIE_SECURE=true`. `style-src 'unsafe-inline'` is accepted because React Aria sets inline styles; it permits CSS injection only, not script, and there is no user-controlled HTML anywhere (lint rule `react/no-danger` is an error)."

### S-12 Frozen clock disables expiry and throttle release (AD-6, AD-11, AD-12)
- `FELLES_NOW` "freezes" the clock. Session expiry (12 h) and the 10 s throttle window then never elapse. In the Playwright suites (fixed `FELLES_NOW`) a lockout test would lock the account forever; worse, if `FELLES_NOW` is left in a real `.env`, sessions never expire.
- Close with, in AD-6: "`FELLES_NOW` sets the start instant; the clock then advances monotonically from it. A frozen clock is available only through `buildApp({ clock })` in tests." In AD-22: "`config.ts` refuses `FELLES_NOW` when `NODE_ENV=production`." Throttle and session expiry both read the same clock, so test code advances it explicitly.

### S-13 Framework-generated errors and unknown routes bypass the envelope (AD-4, AD-22)
- AD-4 says one error handler formats everything, but Fastify raises JSON parse failures, 413, 415 and 404 before route handlers; default bodies leak `FST_ERR_*` codes and, for unknown `/api/*` paths, the SPA fallback could answer with `index.html` and status 200 (a typo'd `/api/bookngs` returns HTML to a JSON client and masks an unguarded-route test).
- Close with, in AD-22: "The SPA fallback applies only to `GET`/`HEAD` requests whose path does not start with `/api/` and has no file extension; everything else not found returns the 404 envelope via `setNotFoundHandler`. `setErrorHandler` maps `FST_ERR_CTP_*`, 413 and 415 to the envelope with `VALIDATION_ERROR`/`INTERNAL`-style codes and never echoes the parser message. Trigger `RAISE(ABORT, ...)` messages and any `SqliteError` are mapped by code or become generic 500; their text never reaches a response." Note also: a body-less POST (approve, logout) must not require a JSON body, so state "empty body is allowed when the contract has no body schema".

### S-14 Logging redaction paths are not specified; pino redaction is path-exact (AD-26)
- "Redaction of `cookie`, `authorization`, `password`, `set-cookie`" as written matches only top-level keys. Fastify logs headers under `req.headers.cookie` and `res.headers["set-cookie"]`; a body or Zod error logged at `error` may carry `body.password`.
- Close with, in AD-26: "`redact.paths`: `req.headers.cookie`, `req.headers.authorization`, `res.headers['set-cookie']`, `req.body`, `*.password`, `*.passwordHash`, `*.token`; the error serialiser drops `err.input`. Request logging records method, path without query, status and duration only. A test logs a login failure and a 500 and asserts the output contains neither the password, nor `felles_sid`, nor a booking purpose."

### S-15 Supply chain and install scripts (AD-22, AD-25)
- Lockfile is committed, but the spine does not say CI uses `npm ci`, has no `npm audit` step, and does not address install scripts: `better-sqlite3` runs an install script that downloads a prebuilt binary (or compiles with node-gyp) from the network; any other dependency with a postinstall also runs with the developer's privileges.
- Close with, in AD-25: "CI and the README use `npm ci`. `verify:full` in CI runs `npm audit --omit=dev --audit-level=high` (non-blocking while OQ-4 is open, blocking afterwards). `.npmrc` sets `save-exact=true` and `ignore-scripts=true`; the root `postinstall` explicitly runs `npm rebuild better-sqlite3` and nothing else is allowed to run scripts. Adding any dependency needs Jo's approval (freeze list)." In Deferred: "Evaluate Node's built-in `node:sqlite` (removes the native install step) when it is stable in the pinned Node."

---

## LOW

### S-16 Session housekeeping (AD-11)
- "Expired rows purged on access" implies a DELETE (write) on every authenticated GET, contradicting "GET never mutates" and taking the write path; and sessions never revisited stay forever. Repeated valid logins create unbounded rows.
- Close with, in AD-11: "Purge runs at login and on a 10-minute timer, not on reads; an expired row is simply rejected. At most 10 live sessions per user (oldest deleted)." State `Max-Age=43200` on the cookie and that logout and expiry clear it with the identical `Path`/`SameSite`/`Secure` attributes.

### S-17 Cookie `Secure` determination behind TLS terminators (AD-11, AD-22)
- "Secure when the request protocol is https" is false behind a terminator unless `trustProxy` is set, which the spine says nothing about. `FELLES_COOKIE_SECURE=auto` then never sets `Secure` in a real deployment.
- Close with, in AD-22: "`auto` means Secure when `request.protocol === 'https'`; `trustProxy` is off, so behind a terminator the operator sets `FELLES_COOKIE_SECURE=true`." (Production is out of scope; this makes the hook honest.)

### S-18 Email normalisation must be one function (AD-11, AD-12, AD-16)
- Throttle key, DB lookup and uniqueness may use different folding (JS `toLowerCase` is Unicode, SQLite `COLLATE NOCASE` is ASCII only; trailing spaces, fullwidth forms, combining characters). A mismatch lets `admin@x.no`, `ADMIN@x.no` and `admin@x.no ` use separate counters yet hit the same account.
- Close with, in AD-2: "`normaliseEmail` (trim, NFKC, lower-case) lives in `contracts/rules.ts`; the login schema, the throttle key and the seed all use it; `users.email` stores the normalised value with a `UNIQUE` index and a `CHECK (email = lower(email))`."

### S-19 403 vs 404 reveals which booking ids exist (AD-4, AD-14)
- Ids are sequential integers. A Member probing `GET /api/bookings/{id}` sees 403 for existing and 404 for absent, giving booking volume and creation rate (not identity). Accepted by the UX decision ("Ingen tilgang") and low at this scale.
- Close by adding to Deferred: "Booking existence is observable to Members via 403 vs 404 on `GET /api/bookings/{id}`; accepted for the UX 'Ingen tilgang' state. Reverse by returning 404 for non-owners."

### S-20 Conflict and error `details` must not carry foreign identity (AD-4, AD-15)
- A `BOOKING_CONFLICT` response that echoes the conflicting booking's id, purpose or owner would defeat the anonymous projection.
- Close with, in AD-4: "`details` of `BOOKING_CONFLICT` is empty or the anonymous interval only. Detail fields are typed per code in contracts and the key-set test of AD-15 covers error bodies for Members."

### S-21 Activity and dashboard scoping for Members (AD-15)
- The rule covers `activity_events`, but dashboard aggregates (VIS-03/04: pending counts, today's totals) could be computed over all users and show a Member system-wide numbers. The `before` cursor is also a client value.
- Close with, in AD-15: "Every dashboard figure and every activity query for a Member adds `subject_user_id = :me` (or `user_id = :me` for bookings) inside the repository function signature (`forActor(actor)`); the cursor is an integer id and only narrows the already-scoped set. Anonymous schedule blocks include only `pending`/`confirmed` bookings; cancelled and rejected ones are never projected to other Members."

### S-22 Prepared-statement lint is easy to bypass; dynamic SQL needs a rule (AD-16)
- The rule bans template literals with expressions passed to `prepare`/`exec`; `prepare(sql)` with `sql` built earlier by concatenation passes. Dynamic `ORDER BY` or search `LIKE` filters are the usual SQLi and wildcard-DoS entry points.
- Close with, in AD-16: "`prepare` and `exec` accept only string literals or a const imported from a `*.sql.ts` module; there is no dynamic ORDER BY (sort keys map through a fixed `Record`), `LIMIT` is a bound integer already clamped by the contract, and `LIKE` input has `%`, `_` and `\` escaped with an explicit `ESCAPE`."

### S-23 Database files committed or world-readable (AD-22)
- `.env` is ignored, but `data/` is not mentioned; `felles.db`, `-wal`, `-shm` hold password hashes and booking text. 
- Close with, in AD-22: "`.gitignore` covers `data/` and `*.db*`. The data directory is created with mode 0700 where the OS supports it."

### S-24 `busy_timeout = 5000` can freeze the whole API (AD-7)
- On a single connection with synchronous calls, `busy_timeout` only matters when another process (the seed script, a `sqlite3` shell) holds the lock; then each request blocks the event loop for up to 5 s, stalling every user.
- Close with, in AD-7: "The server opens the database with `busy_timeout = 250`; `db:seed` and `demo:reset` refuse to run while the port is listening (they check, then exit with a message)." AD-8(b)'s second-process test uses its own longer timeout.

### S-25 Seed credential handling (AD-23, README)
- AD-23 says passwords are "documented as development credentials only". Missing: a guard so the seed cannot run against a non-demo database, a check that the login screen shows no credentials, and a statement of what changes for anything beyond a demo.
- Close with, in AD-23: "The seed refuses to run when `NODE_ENV=production`, when the target database already has users without `data_origin = synthetic-seed`, or when `FELLES_HOST` is not loopback. Seed passwords live only in `db/seed/data.ts` and the README table, never in the SPA bundle or the login screen (the Demo pill is the only hint; EXPERIENCE decides whether the screen lists accounts, and if it does, that list is compiled out of a production build). Passwords are stored only as scrypt hashes generated at seed time." Add a Deferred line: "A real deployment needs per-user generated passwords, an admin reset path and password change (all out of scope, spec §9)."

---

## Items checked with no gap, for the record
- Sec-Fetch-Site with Vite proxy: requests go browser to `:5173`, so same-origin; the proxy forwards `Origin: http://localhost:5173`, which the dev allowlist covers.
- Static path traversal: `@fastify/static` rejects `..` and encoded variants and ignores dotfiles; the only requirement is that the root is `apps/web/dist` (not repo root or `data/`), and that production builds have `sourcemap: false`. Put both into the AD-22 sentence about serving.
- Schedule ordering/count/timing: ordering by start is a total order, so no id-order leak; interval counts are intentionally visible (VIS-01). Response size and timing differences between detail and anonymous blocks reveal at most that a block belongs to the caller, which they already know.
- SQL, privilege escalation: role per request from the DB; parameter binding; triggers block writes to protected columns.
