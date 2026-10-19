# Addendum: technical hints for architecture (non-binding)

- Booking create: one `better-sqlite3` transaction started with `BEGIN IMMEDIATE`; overlap query `start < :end AND :start < end AND status IN ('pending','confirmed')`; insert Booking and Activity Event in the same transaction (DEC-12, DEC-17).
- Store instants as UTC ISO strings or epoch ms; convert with `Intl`/a tz library at the edges only. Inject a `Clock` into API and domain code; tests and seed use a fixed clock (DEC-09).
- Password hashing: prefer `node:crypto` scrypt to avoid another native dependency on Windows.
- Contracts package should export Zod schemas, inferred DTO types, the error-code enum and the status enums so parallel agents share one source (DEC-16).
- Parallelism: S01 and S02 touch separate API route modules and web pages; shared files (contracts index, DB migrations, app bootstrap, global CSS) are frozen after S00 or changed under a decision-log entry (PIL-06). Migration numbering needs a collision rule.
- Migration files: prefix with slice number and sequence (for example 0100_users.sql) so parallel slices never collide; schema changes still need Jo's approval after the freeze (PIL-06).
