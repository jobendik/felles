# FELLES architecture — approval brief for Jo

Status: approved by Jo and finalised, 2026-10-19 (decisions and copy recorded in `approved-copy.md`). The spine is `ARCHITECTURE-SPINE.md` (28 decisions, AD-1…AD-28). This page is the short version. No original requirement is changed and no approved UX decision is changed.

## The architecture in five lines

1. **Contract-first modular monolith.** `packages/contracts` holds every wire shape, route, error code and shared rule. The API is layered (routes → use cases → pure domain → repositories); the web is organised by feature under one composition root.
2. **One process, one SQLite file, one origin.** Fastify serves the built React app and `/api` on `127.0.0.1:3000`; dev uses Vite on 5173 with a proxy.
3. **Booking atomicity twice over.** One `BEGIN IMMEDIATE` transaction per mutation (check, write, audit event), plus database triggers and CHECKs that reject overlaps, illegal transitions and rewritten history from any writer.
4. **Time:** instants are UTC epoch ms in the database and ISO on the wire; bookings are submitted as Oslo civil date and times, converted once on the server; the browser only formats.
5. **Parallel-build safety:** S00 freezes contracts, schema, seams and an ownership map with a machine check; slices replace stub bodies and never touch frozen files.

## DEC-11, DEC-12, DEC-16 (OQ-6) — outcome

| Decision | Outcome |
| --- | --- |
| DEC-11 sessions and passwords | **Confirmed.** Opaque 32-byte session id, only its SHA-256 stored, absolute 12 h, HttpOnly/SameSite=Lax cookie, scrypt (N=2^16, r=8, p=2, explicit memory limit), identical response for unknown email, login throttling **built** (5 failures, 10 s, doubling, global limiter). |
| DEC-12 atomic booking | **Confirmed and strengthened.** `BEGIN IMMEDIATE` per mutation plus an overlap trigger as backstop. Spike: a second process waited for the lock and then lost cleanly; trigger aborts overlaps and allows back-to-back bookings. BOK-04 is preserved in full. |
| DEC-16 errors and lists | **Confirmed with extensions** (see decision 1 below): array `fieldErrors`, typed `details`, more codes, id cursor for "Vis flere". |

## What I need from you

**Decisions (recommended answer in bold)**

1. **DEC-16 status extension.** Add 421, 429, 500, 501, 503 and the new codes (`UNAUTHENTICATED`, `BOOKING_NOT_CANCELLABLE`, `DATABASE_BUSY`, `HOST_REFUSED`, `ORIGIN_REFUSED`, `RATE_LIMITED`, `INTERNAL`, `NOT_IMPLEMENTED`, `OWN_REQUEST`). No authorisation rule changes. **Approve.**
2. **Deviations from PRD §4.0 (planning, not product).** S00 grows: complete contract set with 501 stubs, UI kit, test kit, lint boundary rules, ownership and merge-gate scripts, session resolution and `countFutureBlocking`; the schedule endpoint lives in S03 (so S04 is UI only); `booking-actions` is its own feature; slices may add (not change) `ui/` files. Effect: S00 is the longest slice and runs with one agent. **Approve, and split S00 into the spec's three tasks with your checkpoint after T00-02.**
3. **PIL-09 checkpoint.** You review the contract draft (route table + DTO list) after T00-02, before S00 is accepted. **Approve.**
4. **Two-step contract freeze.** F1 at S00 acceptance; F2 at S03 acceptance for activity, dashboard and the final schedule DTO; afterwards only additive amendments approved by you. **Approve.**
5. **Chart semantics.** Expired requests are excluded from the pending bars; bars bucket by Oslo start day while the panel keeps the DEC-04 window. **Approve.**
6. **Copy needing your or UX's confirmation.** (a) Slots beyond the 30-day horizon on the last selectable date: disabled, accessible name "klokken 14:00, utenfor bookingvinduet" plus a one-line hint. (b) Error texts for `BOOKING_STARTED` on cancel/approve, `BOOKING_NOT_CANCELLABLE`, `RATE_LIMITED`, `ORIGIN_REFUSED`, `HOST_REFUSED`, `DATABASE_BUSY`, `INTERNAL` (drafted in the catalogue in S00 for your review at the contract checkpoint). **Approve the approach.**

**Action for you before S00**

7. **Node.** Your machine runs Node v25.9.0, which Vitest 5 and jsdom 30 do not support, and the repo will enforce `engines`. Install **Node 24 LTS** (or Node 26 once it becomes LTS on 2026-10-28).

## Notable technical choices (all in the spine)

- Stack follows spec §6; additions: React Router, TanStack Query, react-hook-form, React Aria Components (behaviour primitives), temporal-polyfill (server only), pino, helmet, lucide-react. No Tailwind.
- Pins verified on 2026-10-19 against the npm registry. Two deliberate holds: **TypeScript 6.0.3** (typescript-eslint does not yet accept 7) and **ESLint 9.39.5** (jsx-a11y stops at ESLint 9); `@hookform/resolvers` 5.9.2 because 6.0.0 failed to install on current npm.
- Security posture: Origin allowlist + Host allowlist + `Sec-Fetch-Site`, JSON-only bodies, no CORS, strict schemas with length bounds, `Cache-Control: no-store`, CSP without `upgrade-insecure-requests` (it breaks Safari on http localhost), loopback bind (refused otherwise while demo data exists).
- Windows safety: LF-normalised migration checksums, DB path resolved to the repo root, no `npm.cmd` spawning, temp-DB cleanup rules, per-worktree ports.
- Evidence: every test title carries a requirement id; `trace.mjs` turns test results into `trace.json` keyed by commit SHA and fails when a MUST has no passing test.

## Remaining risks

| Risk | Mitigation / owner |
| --- | --- |
| Fresh major versions (Vite 8, Vitest 5, React Router 8, better-sqlite3 13, TS 6/7 split) and agent training data may disagree with them | S00 starts with a clean install and empty-skeleton `verify` on Windows, commits the lockfile, and records verified idioms in a stack note |
| `better-sqlite3` verified only on Node 25.9 here; Node 24 load is inferred | S00 step 0 confirms on Node 24; `node:sqlite` is the documented fallback |
| S00 is large and sets the contracts "in the dark" | Jo checkpoint after T00-02; hello-slice dry run is part of S00 acceptance; F2 freeze at S03 |
| macOS evidence (NFR-01) needs a remote (OQ-4) | Unchanged; fallback is a manual smoke test on a Mac (OQ-5) |
| `react-aria-components` fit with React 19.3 is by peer range only | S00 builds the wrappers first; hand-written fallback for any primitive that fails |
| Native `<input type="date">` renders per browser locale | Day-in-words caption; week strip is the documented fallback |
| Reviews were done on spine v1; v2 was re-checked by one fix-verification pass, not a full re-review | See `reviews/review-fix-verification.md` |

## Review summary

Eight independent reviews (3 input reconciliations, rubric, version check, adversary, security, data integrity) found no critical product or security defect. They did raise 2 critical process findings, 4 adversary "blocker" pairs and 44 high findings (overlapping across reports); these were folded into v2, and the remainder sit under Deferred or Open Questions. Reports: `reviews/`.
