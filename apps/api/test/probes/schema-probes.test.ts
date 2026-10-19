/* eslint-disable felles/no-or-replace, felles/no-session-insert -- the probes attack the schema with the very statements the lint rules ban */
// The probe suite (Story 1.7): every rule the schema promises is attacked directly in SQL, and the
// legitimate paths (approve, reject an Expired request, admin cancel with a reason, adjacent bookings) are
// shown to work. The SQL follows reviews/review-data-integrity.md (38 probes) with the AD-9 column names.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempDb, type TempDb } from "../temp-db";
import { assertUsesIndex } from "../snapshot/snapshot";

const HALF_HOUR = 1_800_000;
const HOUR = 3_600_000;
// Tuesday 2026-10-20 10:00 Oslo (08:00Z), on the grid.
const T0 = Date.UTC(2026, 9, 20, 8, 0);
const CREATED = Date.UTC(2026, 9, 19, 7, 0);

const INSERT_BOOKING =
  "insert into bookings (resource_id, user_id, start_at, end_at, purpose, status, created_at, decided_by_user_id, decided_at, decision_reason, cancelled_by_user_id, cancelled_at, cancel_reason) " +
  "values (@resource_id, @user_id, @start_at, @end_at, @purpose, @status, @created_at, @decided_by_user_id, @decided_at, @decision_reason, @cancelled_by_user_id, @cancelled_at, @cancel_reason)";

let temp: TempDb;
let admin: number;
let admin2: number;
let member: number;
let member2: number;
let room: number;
let room2: number;

interface BookingRow {
  resource_id: number;
  user_id: number;
  start_at: number;
  end_at: number;
  purpose: string;
  status: string;
  created_at: number;
  decided_by_user_id: number | null;
  decided_at: number | null;
  decision_reason: string | null;
  cancelled_by_user_id: number | null;
  cancelled_at: number | null;
  cancel_reason: string | null;
}

function booking(over: Partial<BookingRow> = {}): BookingRow {
  return {
    resource_id: room,
    user_id: member,
    start_at: T0,
    end_at: T0 + HOUR,
    purpose: "Møte",
    status: "pending",
    created_at: CREATED,
    decided_by_user_id: null,
    decided_at: null,
    decision_reason: null,
    cancelled_by_user_id: null,
    cancelled_at: null,
    cancel_reason: null,
    ...over,
  };
}

function insertBooking(over: Partial<BookingRow> = {}): number {
  return Number(temp.db.prepare(INSERT_BOOKING).run(booking(over)).lastInsertRowid);
}

function insertUser(email: string, role: string): number {
  return Number(
    temp.db
      .prepare(
        "insert into users (email, name, role, password_hash, created_at) values (?, ?, ?, ?, ?)",
      )
      .run(email, email.split("@")[0], role, "scrypt$4096$8$1$salt$hash", CREATED).lastInsertRowid,
  );
}

function insertResource(name: string, status = "active"): number {
  return Number(
    temp.db
      .prepare(
        "insert into resources (name, kind, location, symbol, colour, approval_required, status, created_at) values (?, 'room', '2. etasje', 'users', 'bla', 0, ?, ?)",
      )
      .run(name, status, CREATED).lastInsertRowid,
  );
}

function insertEvent(
  over: {
    type?: string;
    booking_id?: number | null;
    resource_id?: number | null;
    subject?: number | null;
    payload?: string;
  } = {},
): number {
  const type = over.type ?? "booking.created";
  return Number(
    temp.db
      .prepare(
        "insert into activity_events (type, actor_user_id, booking_id, resource_id, subject_user_id, payload, at) values (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        type,
        admin,
        over.booking_id ?? null,
        over.resource_id ?? null,
        over.subject ?? null,
        over.payload ?? "{}",
        CREATED,
      ).lastInsertRowid,
  );
}

const one = (sql: string, ...params: unknown[]) =>
  temp.db.prepare(sql).get(...params) as Record<string, unknown>;

beforeEach(() => {
  temp = createTempDb();
  admin = insertUser("magnus@felles.example", "admin");
  admin2 = insertUser("sofie@felles.example", "admin");
  member = insertUser("ingrid@felles.example", "member");
  member2 = insertUser("jonas@felles.example", "member");
  room = insertResource("Fjellet");
  room2 = insertResource("Fjorden");
});

afterEach(async () => {
  await temp.dispose();
});

describe("structure", () => {
  const TABLES = [
    "users",
    "sessions",
    "resources",
    "bookings",
    "activity_events",
    "app_meta",
    "schema_migrations",
  ];

  it("[BR-3] the six tables exist, all STRICT (@1.7)", () => {
    for (const table of TABLES) {
      const row = one("select strict from pragma_table_list where name = ?", table);
      expect(row, table).toEqual({ strict: 1 });
    }
  });

  it("[BR-3] ids are INTEGER AUTOINCREMENT and *_at columns are INTEGER epoch milliseconds (@1.7)", () => {
    for (const table of ["users", "sessions", "resources", "bookings", "activity_events"]) {
      const sql = (one("select sql from sqlite_master where name = ?", table) as { sql: string })
        .sql;
      expect(sql.toLowerCase(), table).toContain("integer primary key autoincrement");
      const columns = temp.db.prepare("select name, type from pragma_table_info(?)").all(table) as {
        name: string;
        type: string;
      }[];
      for (const column of columns.filter((c) => c.name.endsWith("_at"))) {
        expect(column.type, `${table}.${column.name}`).toBe("INTEGER");
      }
    }
  });

  it("[BR-3] every enum column is NOT NULL with a CHECK (@1.7)", () => {
    const enums: [string, string][] = [
      ["users", "role"],
      ["resources", "kind"],
      ["resources", "symbol"],
      ["resources", "colour"],
      ["resources", "approval_required"],
      ["resources", "status"],
      ["bookings", "status"],
      ["activity_events", "type"],
    ];
    for (const [table, column] of enums) {
      const info = one(
        'select "notnull" as nn from pragma_table_info(?) where name = ?',
        table,
        column,
      );
      expect(info.nn, `${table}.${column}`).toBe(1);
    }
    expect(() =>
      temp.db
        .prepare(
          "insert into resources (name, kind, location, symbol, colour, approval_required, status, created_at) values ('x', null, 'y', 'users', 'bla', 0, 'active', 1)",
        )
        .run(),
    ).toThrow(/NOT NULL/);
  });

  it("[BR-3] every foreign key is ON DELETE RESTRICT (@1.7)", () => {
    for (const table of ["sessions", "bookings", "activity_events"]) {
      const keys = temp.db
        .prepare('select "table" as target, on_delete from pragma_foreign_key_list(?)')
        .all(table) as { target: string; on_delete: string }[];
      expect(keys.length, table).toBeGreaterThan(0);
      for (const key of keys) expect(key.on_delete, `${table} -> ${key.target}`).toBe("RESTRICT");
    }
  });

  it("[BR-3] bookings carry the AD-9 column names and none of the old ones (@1.7)", () => {
    const names = (
      temp.db.prepare("select name from pragma_table_info('bookings')").all() as { name: string }[]
    ).map((r) => r.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "decided_by_user_id",
        "decided_at",
        "decision_reason",
        "cancelled_by_user_id",
        "cancelled_at",
        "cancel_reason",
      ]),
    );
    for (const old of ["decided_by", "reject_reason", "cancelled_by"])
      expect(names).not.toContain(old);
  });

  it("[NFR-06] the overlap query uses the plain (resource_id, status, start_at) index (@1.7)", () => {
    const plan = assertUsesIndex(
      temp.db,
      "select id from bookings where resource_id = ? and status in ('pending','confirmed') and start_at < ? and ? < end_at",
      "bookings_blocking",
      [room, T0 + HOUR, T0],
    );
    expect(plan.join("\n")).toMatch(/resource_id=\?/);
    const index = (
      one("select sql from sqlite_master where name = 'bookings_blocking'") as { sql: string }
    ).sql.toLowerCase();
    expect(index).toContain("(resource_id, status, start_at)");
    expect(index).not.toContain(" where ");
  });

  it("[NFR-04] the connection has foreign keys and recursive triggers on (@1.7)", () => {
    expect(temp.db.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(temp.db.pragma("recursive_triggers", { simple: true })).toBe(1);
  });
});

describe("overlap and exclusivity", () => {
  it("[BOK-03] an overlapping blocking insert is aborted with BOOKING_OVERLAP in every shape (@1.7)", () => {
    insertBooking({ status: "confirmed" });
    const shapes: [string, number, number][] = [
      ["inside", T0 + HALF_HOUR, T0 + HOUR],
      ["containing", T0 - HOUR, T0 + 2 * HOUR],
      ["identical", T0, T0 + HOUR],
      ["overlapping the start", T0 - HALF_HOUR, T0 + HALF_HOUR],
      ["overlapping the end", T0 + HALF_HOUR, T0 + 2 * HOUR],
    ];
    for (const [name, start, end] of shapes) {
      expect(() => insertBooking({ user_id: member2, start_at: start, end_at: end }), name).toThrow(
        "BOOKING_OVERLAP",
      );
      expect(
        () =>
          insertBooking({
            user_id: member2,
            start_at: start,
            end_at: end,
            status: "confirmed",
            decided_by_user_id: admin,
            decided_at: CREATED,
          }),
        `${name} confirmed`,
      ).toThrow("BOOKING_OVERLAP");
    }
    expect(one("select count(*) as n from bookings").n).toBe(1);
  });

  it("[BR-3] adjacent bookings on either side succeed (@1.7)", () => {
    insertBooking({ status: "confirmed" });
    expect(() =>
      insertBooking({ user_id: member2, start_at: T0 + HOUR, end_at: T0 + 2 * HOUR }),
    ).not.toThrow();
    expect(() =>
      insertBooking({ user_id: member2, start_at: T0 - HOUR, end_at: T0 }),
    ).not.toThrow();
    expect(one("select count(*) as n from bookings").n).toBe(3);
  });

  it("[BR-3] non-blocking history may overlap: cancelled and rejected rows, in either order (@1.7)", () => {
    insertBooking({ status: "cancelled", cancelled_by_user_id: member, cancelled_at: CREATED });
    expect(() => insertBooking({ user_id: member2 })).not.toThrow(); // blocking over a cancelled row
    insertBooking({
      user_id: member2,
      resource_id: room2,
      status: "rejected",
      decided_by_user_id: admin,
      decided_at: CREATED,
      decision_reason: "Nei",
    });
    expect(() => insertBooking({ resource_id: room2 })).not.toThrow();
    expect(() =>
      insertBooking({
        user_id: member2,
        status: "cancelled",
        cancelled_by_user_id: member2,
        cancelled_at: CREATED,
      }),
    ).not.toThrow(); // history over a blocking row
  });

  it("[BOK-03] other resources are independent (@1.7)", () => {
    insertBooking({ status: "confirmed" });
    expect(() => insertBooking({ resource_id: room2 })).not.toThrow();
  });
});

describe("grid, duration and field relations", () => {
  it("[BOK-02] off-grid starts and ends are aborted by CHECK (@1.7)", () => {
    expect(() => insertBooking({ start_at: T0 + 15 * 60_000, end_at: T0 + HOUR })).toThrow(
      /CHECK constraint failed/,
    );
    expect(() => insertBooking({ start_at: T0, end_at: T0 + HOUR + 10 * 60_000 })).toThrow(
      /CHECK constraint failed/,
    );
  });

  it("[BOK-02] 30 minutes and exactly 4 hours pass; 4 h 30 min, zero length and a reversed interval fail (@1.7)", () => {
    expect(() => insertBooking({ start_at: T0, end_at: T0 + HALF_HOUR })).not.toThrow();
    expect(() =>
      insertBooking({ resource_id: room2, start_at: T0, end_at: T0 + 4 * HOUR }),
    ).not.toThrow();
    expect(() =>
      insertBooking({
        resource_id: room2,
        start_at: T0 + 8 * HOUR,
        end_at: T0 + 12 * HOUR + HALF_HOUR,
      }),
    ).toThrow(/CHECK constraint failed/);
    expect(() => insertBooking({ start_at: T0 + 20 * HOUR, end_at: T0 + 20 * HOUR })).toThrow(
      /CHECK constraint failed/,
    );
    expect(() => insertBooking({ start_at: T0 + 20 * HOUR, end_at: T0 + 19 * HOUR })).toThrow(
      /CHECK constraint failed/,
    );
  });

  it("[BR-3] a pending booking cannot be inserted with a decision; nobody decides their own booking (@1.7)", () => {
    expect(() => insertBooking({ decided_by_user_id: admin, decided_at: CREATED })).toThrow(
      /CHECK constraint failed/,
    );
    expect(() =>
      insertBooking({
        status: "confirmed",
        user_id: admin,
        decided_by_user_id: admin,
        decided_at: CREATED,
      }),
    ).toThrow(/CHECK constraint failed/);
    expect(() =>
      insertBooking({ status: "confirmed", decided_by_user_id: admin, decided_at: null }),
    ).toThrow(/CHECK constraint failed/);
  });

  it("[BR-3] a rejected row needs a decider and a non-blank reason (@1.7)", () => {
    const rejected = { status: "rejected", decided_by_user_id: admin, decided_at: CREATED };
    expect(() => insertBooking({ ...rejected, decision_reason: null })).toThrow(
      /CHECK constraint failed/,
    );
    expect(() => insertBooking({ ...rejected, decision_reason: "   " })).toThrow(
      /CHECK constraint failed/,
    );
    expect(() =>
      insertBooking({ ...rejected, decision_reason: "Utstyret er på service" }),
    ).not.toThrow();
  });

  it("[BR-3] only cancelled rows have a canceller, and cancelling someone else's booking needs a reason (@1.7)", () => {
    expect(() => insertBooking({ status: "cancelled" })).toThrow(/CHECK constraint failed/);
    expect(() => insertBooking({ cancelled_by_user_id: member, cancelled_at: CREATED })).toThrow(
      /CHECK constraint failed/,
    );
    expect(() =>
      insertBooking({ status: "cancelled", cancelled_by_user_id: admin, cancelled_at: CREATED }),
    ).toThrow(/CHECK constraint failed/);
    expect(() =>
      insertBooking({
        status: "cancelled",
        cancelled_by_user_id: admin,
        cancelled_at: CREATED,
        cancel_reason: "Rommet er stengt",
      }),
    ).not.toThrow();
    expect(() =>
      insertBooking({
        status: "cancelled",
        cancelled_by_user_id: member,
        cancelled_at: CREATED,
        cancel_reason: null,
      }),
    ).not.toThrow();
    expect(() =>
      insertBooking({ status: "cancelled", cancelled_by_user_id: member, cancelled_at: null }),
    ).toThrow(/CHECK constraint failed/);
  });

  it("[BR-3] unknown status values and blank purposes are aborted (@1.7)", () => {
    expect(() => insertBooking({ status: "expired" })).toThrow(/CHECK constraint failed/);
    expect(() => insertBooking({ purpose: "   " })).toThrow(/CHECK constraint failed/);
  });

  it("[BR-3] STRICT tables refuse text in integer columns and fractional epochs (@1.7)", () => {
    expect(() => insertBooking({ start_at: "not a number" as unknown as number })).toThrow(
      /cannot store TEXT|datatype/i,
    );
    expect(() => insertBooking({ start_at: T0 + 0.5 })).toThrow();
  });
});

describe("legitimate transitions succeed", () => {
  it("[BR-3] approve: pending to confirmed with an approver records who and when (@1.7)", () => {
    const id = insertBooking();
    temp.db
      .prepare(
        "update bookings set status = 'confirmed', decided_by_user_id = ?, decided_at = ? where id = ?",
      )
      .run(admin, CREATED + HOUR, id);
    expect(
      one(
        "select status, decided_by_user_id as by, decided_at as at from bookings where id = ?",
        id,
      ),
    ).toEqual({ status: "confirmed", by: admin, at: CREATED + HOUR });
  });

  it("[BR-3] reject with a reason works, also for an Expired request whose start has passed (@1.7)", () => {
    const fresh = insertBooking({ resource_id: room2 });
    temp.db
      .prepare(
        "update bookings set status = 'rejected', decided_by_user_id = ?, decided_at = ?, decision_reason = ? where id = ?",
      )
      .run(admin, CREATED, "Upptatt", fresh);
    const expired = insertBooking({ start_at: CREATED - 24 * HOUR, end_at: CREATED - 23 * HOUR });
    temp.db
      .prepare(
        "update bookings set status = 'rejected', decided_by_user_id = ?, decided_at = ?, decision_reason = ? where id = ?",
      )
      .run(admin, CREATED, "Ikke behandlet i tide", expired);
    expect(one("select status from bookings where id = ?", expired)).toEqual({
      status: "rejected",
    });
  });

  it("[BR-3] cancel by the owner needs no reason; cancel by an Administrator with a reason works (@1.7)", () => {
    const own = insertBooking({
      status: "confirmed",
      decided_by_user_id: admin,
      decided_at: CREATED,
    });
    temp.db
      .prepare(
        "update bookings set status = 'cancelled', cancelled_by_user_id = user_id, cancelled_at = ? where id = ?",
      )
      .run(CREATED, own);
    const other = insertBooking({ resource_id: room2 });
    temp.db
      .prepare(
        "update bookings set status = 'cancelled', cancelled_by_user_id = ?, cancelled_at = ?, cancel_reason = ? where id = ?",
      )
      .run(admin, CREATED, "Rommet er stengt", other);
    expect(one("select count(*) as n from bookings where status = 'cancelled'").n).toBe(2);
  });

  it("[BR-3] cancelling without a reason as an Administrator on someone else's booking is aborted (@1.7)", () => {
    const id = insertBooking();
    expect(() =>
      temp.db
        .prepare(
          "update bookings set status = 'cancelled', cancelled_by_user_id = ?, cancelled_at = ? where id = ?",
        )
        .run(admin, CREATED, id),
    ).toThrow(/CHECK constraint failed/);
    expect(one("select status from bookings where id = ?", id)).toEqual({ status: "pending" });
  });

  it("[BR-3] a pending booking can be cancelled by its owner (@1.7)", () => {
    const id = insertBooking();
    temp.db
      .prepare(
        "update bookings set status = 'cancelled', cancelled_by_user_id = user_id, cancelled_at = ? where id = ?",
      )
      .run(CREATED, id);
    expect(one("select status from bookings where id = ?", id)).toEqual({ status: "cancelled" });
  });
});

describe("illegal transitions and rewriting history", () => {
  function approved(): number {
    return insertBooking({ status: "confirmed", decided_by_user_id: admin, decided_at: CREATED });
  }
  function rejected(): number {
    return insertBooking({
      status: "rejected",
      decided_by_user_id: admin,
      decided_at: CREATED,
      decision_reason: "Nei",
    });
  }
  function cancelled(): number {
    return insertBooking({
      status: "cancelled",
      cancelled_by_user_id: member,
      cancelled_at: CREATED,
    });
  }
  const update =
    (sql: string, ...params: unknown[]) =>
    () =>
      temp.db.prepare(sql).run(...params);

  it("[BR-3] approval without an approver is aborted (@1.7)", () => {
    const id = insertBooking();
    expect(update("update bookings set status = 'confirmed' where id = ?", id)).toThrow(
      "BOOKING_APPROVER_REQUIRED",
    );
    expect(one("select status from bookings where id = ?", id)).toEqual({ status: "pending" });
  });

  it("[BR-3] an Administrator cannot approve their own booking (@1.7)", () => {
    const id = insertBooking({ user_id: admin });
    expect(
      update(
        "update bookings set status = 'confirmed', decided_by_user_id = ?, decided_at = ? where id = ?",
        admin,
        CREATED,
        id,
      ),
    ).toThrow(/CHECK constraint failed/);
  });

  it("[BR-3] terminal rows are frozen: no status, decision or reason edit survives (@1.7)", () => {
    const r = rejected();
    const c = cancelled();
    expect(update("update bookings set status = 'confirmed' where id = ?", r)).toThrow(
      /BOOKING_TERMINAL|BOOKING_ILLEGAL_TRANSITION/,
    );
    expect(update("update bookings set status = 'pending' where id = ?", c)).toThrow(
      /BOOKING_TERMINAL|BOOKING_ILLEGAL_TRANSITION/,
    );
    expect(update("update bookings set status = 'confirmed' where id = ?", c)).toThrow(
      /BOOKING_TERMINAL|BOOKING_ILLEGAL_TRANSITION/,
    );
    expect(update("update bookings set decision_reason = 'Omskrevet' where id = ?", r)).toThrow(
      /BOOKING_TERMINAL|BOOKING_DECISION_WRITE_ONCE/,
    );
    expect(update("update bookings set decided_by_user_id = ? where id = ?", admin2, r)).toThrow(
      /BOOKING_TERMINAL|BOOKING_DECISION_WRITE_ONCE/,
    );
    expect(update("update bookings set cancel_reason = 'Omskrevet' where id = ?", c)).toThrow(
      /BOOKING_TERMINAL|BOOKING_DECISION_WRITE_ONCE/,
    );
    expect(update("update bookings set cancelled_by_user_id = ? where id = ?", admin, c)).toThrow(
      /BOOKING_TERMINAL|BOOKING_DECISION_WRITE_ONCE/,
    );
  });

  it("[BR-3] a confirmed booking cannot go back to pending or to rejected (@1.7)", () => {
    const id = approved();
    expect(update("update bookings set status = 'pending' where id = ?", id)).toThrow(
      /BOOKING_ILLEGAL_TRANSITION|CHECK constraint failed/,
    );
    expect(
      update("update bookings set status = 'rejected', decision_reason = 'x' where id = ?", id),
    ).toThrow(/BOOKING_ILLEGAL_TRANSITION|CHECK constraint failed/);
  });

  it("[BR-3] decision columns are write-once on a still-live booking (@1.7)", () => {
    const id = approved();
    expect(update("update bookings set decided_by_user_id = ? where id = ?", admin2, id)).toThrow(
      /BOOKING_DECISION_WRITE_ONCE/,
    );
    expect(update("update bookings set decided_at = decided_at + 1 where id = ?", id)).toThrow(
      /BOOKING_DECISION_WRITE_ONCE|CHECK constraint failed/,
    );
    expect(one("select decided_by_user_id as by from bookings where id = ?", id)).toEqual({
      by: admin,
    });
  });

  it("[BR-3] the interval, owner, resource and purpose never change, not even by a no-op set (@1.7)", () => {
    const id = insertBooking();
    for (const sql of [
      "update bookings set purpose = 'Annet' where id = ?",
      "update bookings set purpose = purpose where id = ?",
      "update bookings set start_at = start_at + 1800000, end_at = end_at + 1800000 where id = ?",
      "update bookings set end_at = end_at + 1800000 where id = ?",
      "update bookings set resource_id = " +
        "(select id from resources where name = 'Fjorden') where id = ?",
      "update bookings set user_id = (select id from users where email = 'jonas@felles.example') where id = ?",
    ]) {
      expect(update(sql, id), sql).toThrow("BOOKING_IMMUTABLE");
    }
  });

  it("[BR-3] bookings are never deleted (@1.7)", () => {
    const id = insertBooking();
    expect(update("delete from bookings where id = ?", id)).toThrow("BOOKING_NO_DELETE");
    expect(update("delete from bookings")).toThrow("BOOKING_NO_DELETE");
    expect(one("select count(*) as n from bookings").n).toBe(1);
  });

  it("[BR-3] INSERT OR REPLACE and upsert cannot overwrite a booking (@1.7)", () => {
    const id = insertBooking();
    const replace = () =>
      temp.db
        .prepare(
          "insert or replace into bookings (id, resource_id, user_id, start_at, end_at, purpose, status, created_at) values (?, ?, ?, ?, ?, 'OMSKREVET', 'pending', ?)",
        )
        .run(id, room, member, T0 + 4 * HOUR, T0 + 5 * HOUR, CREATED);
    expect(replace).toThrow("BOOKING_NO_DELETE");
    const upsert = () =>
      temp.db
        .prepare(
          "insert into bookings (id, resource_id, user_id, start_at, end_at, purpose, status, created_at) values (?, ?, ?, ?, ?, 'OMSKREVET', 'pending', ?) on conflict (id) do update set purpose = excluded.purpose",
        )
        .run(id, room, member, T0 + 4 * HOUR, T0 + 5 * HOUR, CREATED);
    expect(upsert).toThrow(/BOOKING_NO_DELETE|BOOKING_IMMUTABLE/);
    const plain = () =>
      temp.db
        .prepare(
          "insert into bookings (id, resource_id, user_id, start_at, end_at, purpose, status, created_at) values (?, ?, ?, ?, ?, 'OMSKREVET', 'pending', ?)",
        )
        .run(id, room, member, T0 + 4 * HOUR, T0 + 5 * HOUR, CREATED);
    expect(plain).toThrow(/BOOKING_NO_DELETE|UNIQUE constraint failed/);
    expect(one("select purpose, start_at from bookings where id = ?", id)).toEqual({
      purpose: "Møte",
      start_at: T0,
    });
  });

  it("[BR-3] recursive triggers are on, so REPLACE fires the delete guard even without the insert trigger (@1.7)", () => {
    expect(temp.db.pragma("recursive_triggers", { simple: true })).toBe(1);
  });
});

describe("resources, users and sessions", () => {
  it("[RES-04] archiving works, un-archiving is aborted and archived is final (@1.7)", () => {
    temp.db.prepare("update resources set status = 'archived' where id = ?").run(room);
    expect(() =>
      temp.db.prepare("update resources set status = 'active' where id = ?").run(room),
    ).toThrow("RESOURCE_ARCHIVE_FINAL");
    expect(one("select status from resources where id = ?", room)).toEqual({ status: "archived" });
    expect(() =>
      temp.db.prepare("update resources set name = 'Nytt navn' where id = ?").run(room),
    ).not.toThrow();
  });

  it("[RES-04] resources are never deleted, with or without bookings (@1.7)", () => {
    insertBooking();
    expect(() => temp.db.prepare("delete from resources where id = ?").run(room)).toThrow(
      "RESOURCE_NO_DELETE",
    );
    expect(() => temp.db.prepare("delete from resources where id = ?").run(room2)).toThrow(
      "RESOURCE_NO_DELETE",
    );
  });

  it("[RES-04] resource names are not unique and an archived resource keeps its history (@1.7)", () => {
    expect(() => insertResource("Fjellet")).not.toThrow();
    const booked = insertBooking({
      start_at: CREATED - 48 * HOUR,
      end_at: CREATED - 47 * HOUR,
      status: "confirmed",
      decided_by_user_id: admin,
      decided_at: CREATED,
    });
    temp.db.prepare("update resources set status = 'archived' where id = ?").run(room);
    expect(one("select resource_id as r from bookings where id = ?", booked)).toEqual({ r: room });
  });

  it("[BR-3] users are never deleted while referenced; foreign keys restrict (@1.7)", () => {
    insertBooking();
    expect(() => temp.db.prepare("delete from users where id = ?").run(member)).toThrow(
      /FOREIGN KEY constraint failed/,
    );
    expect(() => insertBooking({ resource_id: 9999 })).toThrow(/FOREIGN KEY constraint failed/);
    expect(() => insertBooking({ user_id: 9999, resource_id: room2 })).toThrow(
      /FOREIGN KEY constraint failed/,
    );
  });

  it("[AUT-01] e-mails are unique and lower-case; roles and hashes are constrained (@1.7)", () => {
    expect(() => insertUser("Ingrid@Felles.example", "member")).toThrow(/CHECK constraint failed/);
    expect(() => insertUser("ingrid@felles.example", "member")).toThrow(/UNIQUE constraint failed/);
    expect(() => insertUser("ny@felles.example", "owner")).toThrow(/CHECK constraint failed/);
    expect(() =>
      temp.db
        .prepare(
          "insert into users (email, name, role, password_hash, created_at) values ('plain@felles.example', 'P', 'member', 'hunter2', 1)",
        )
        .run(),
    ).toThrow(/CHECK constraint failed/);
  });

  it("[AUT-02] sessions store only a 64-character hash and must expire after they were created (@1.7)", () => {
    const hash = "a".repeat(64);
    const insert = (token: string, created: number, expires: number) =>
      temp.db
        .prepare(
          "insert into sessions (token_hash, user_id, created_at, expires_at) values (?, ?, ?, ?)",
        )
        .run(token, member, created, expires);
    expect(() => insert(hash, CREATED, CREATED + 12 * HOUR)).not.toThrow();
    expect(() => insert(hash, CREATED, CREATED + 12 * HOUR)).toThrow(/UNIQUE constraint failed/);
    expect(() => insert("short", CREATED, CREATED + HOUR)).toThrow(/CHECK constraint failed/);
    expect(() => insert("b".repeat(64), CREATED, CREATED)).toThrow(/CHECK constraint failed/);
    expect(() =>
      temp.db.prepare("delete from sessions where token_hash = ?").run(hash),
    ).not.toThrow();
  });
});

describe("activity events", () => {
  it("[BR-5] an event whose subject is not the booking's owner is aborted (@1.7)", () => {
    const id = insertBooking({ user_id: member });
    expect(() => insertEvent({ booking_id: id, subject: admin })).toThrow("EVENT_SUBJECT_MISMATCH");
    expect(() => insertEvent({ booking_id: id, subject: null })).toThrow("EVENT_SUBJECT_MISMATCH");
    expect(() => insertEvent({ booking_id: id, subject: member2 })).toThrow(
      "EVENT_SUBJECT_MISMATCH",
    );
    expect(() => insertEvent({ booking_id: id, subject: member })).not.toThrow();
  });

  it("[BR-5] resource events carry a resource and no subject; booking events need a booking (@1.7)", () => {
    expect(() =>
      insertEvent({ type: "resource.created", resource_id: room, subject: admin }),
    ).toThrow(/CHECK constraint failed|EVENT_SUBJECT_MISMATCH/);
    expect(() =>
      insertEvent({ type: "resource.created", resource_id: room, subject: null }),
    ).not.toThrow();
    expect(() =>
      insertEvent({ type: "resource.created", resource_id: null, subject: null }),
    ).toThrow(/CHECK constraint failed/);
    expect(() => insertEvent({ type: "booking.created", booking_id: null, subject: null })).toThrow(
      /CHECK constraint failed/,
    );
  });

  it("[BR-5] events are append-only: update, delete and replace are aborted (@1.7)", () => {
    const booked = insertBooking();
    const event = insertEvent({ booking_id: booked, subject: member });
    expect(() =>
      temp.db.prepare("update activity_events set payload = '{}' where id = ?").run(event),
    ).toThrow("EVENT_IMMUTABLE");
    expect(() =>
      temp.db.prepare("update activity_events set at = at where id = ?").run(event),
    ).toThrow("EVENT_IMMUTABLE");
    expect(() => temp.db.prepare("delete from activity_events where id = ?").run(event)).toThrow(
      "EVENT_NO_DELETE",
    );
    expect(() =>
      temp.db
        .prepare(
          "insert or replace into activity_events (id, type, actor_user_id, booking_id, subject_user_id, payload, at) values (?, 'booking.created', ?, ?, ?, '{}', 1)",
        )
        .run(event, admin, booked, member),
    ).toThrow("EVENT_NO_DELETE");
    expect(one("select count(*) as n from activity_events").n).toBe(1);
  });

  it("[BR-5] payloads must be JSON objects and never contain a purpose (@1.7)", () => {
    const booked = insertBooking();
    expect(() =>
      insertEvent({
        booking_id: booked,
        subject: member,
        payload: JSON.stringify({ status: "pending", purpose: "Hemmelig" }),
      }),
    ).toThrow(/CHECK constraint failed/);
    expect(() => insertEvent({ booking_id: booked, subject: member, payload: "not json" })).toThrow(
      /CHECK constraint failed/,
    );
    expect(() => insertEvent({ booking_id: booked, subject: member, payload: "[1]" })).toThrow(
      /CHECK constraint failed/,
    );
    expect(() =>
      insertEvent({
        booking_id: booked,
        subject: member,
        payload: JSON.stringify({ status: "pending" }),
      }),
    ).not.toThrow();
  });

  it("[BR-5] unknown event types are aborted (@1.7)", () => {
    expect(() =>
      insertEvent({ type: "booking.exploded", booking_id: insertBooking(), subject: member }),
    ).toThrow(/CHECK constraint failed/);
  });

  it("[BR-5] a booking and its event commit or roll back together in one transaction (@1.7)", () => {
    const write = temp.db.transaction((fail: boolean) => {
      const id = insertBooking();
      insertEvent({ booking_id: id, subject: member });
      if (fail) throw new Error("rolled back");
    });
    expect(() => write.immediate(true)).toThrow("rolled back");
    expect(one("select count(*) as n from bookings").n).toBe(0);
    expect(one("select count(*) as n from activity_events").n).toBe(0);
    write.immediate(false);
    expect(one("select count(*) as n from bookings").n).toBe(1);
    expect(one("select count(*) as n from activity_events").n).toBe(1);
  });
});

describe("enum columns", () => {
  it("[BR-4] unknown kinds, symbols, colours, roles and statuses are aborted (@1.7)", () => {
    const insert =
      (kind: string, symbol: string, colour: string, status: string, approval: number) => () =>
        temp.db
          .prepare(
            "insert into resources (name, kind, location, symbol, colour, approval_required, status, created_at) values ('x', ?, 'y', ?, ?, ?, ?, 1)",
          )
          .run(kind, symbol, colour, approval, status);
    expect(insert("room", "users", "bla", "active", 0)).not.toThrow();
    expect(insert("boat", "users", "bla", "active", 0)).toThrow(/CHECK constraint failed/);
    expect(insert("room", "sparkles", "bla", "active", 0)).toThrow(/CHECK constraint failed/);
    expect(insert("room", "users", "magenta", "active", 0)).toThrow(/CHECK constraint failed/);
    expect(insert("room", "users", "bla", "deleted", 0)).toThrow(/CHECK constraint failed/);
    expect(insert("room", "users", "bla", "active", 2)).toThrow(/CHECK constraint failed/);
  });

  it("[RES-02] seats are optional, but not zero or absurd (@1.7)", () => {
    const set = (seats: number | null) => () =>
      temp.db.prepare("update resources set seats = ? where id = ?").run(seats, room);
    expect(set(null)).not.toThrow();
    expect(set(8)).not.toThrow();
    expect(set(0)).toThrow(/CHECK constraint failed/);
    expect(set(1001)).toThrow(/CHECK constraint failed/);
  });
});

describe("app metadata", () => {
  it("[SEED-1] app_meta stores the data origin as key and value (@1.7)", () => {
    temp.db
      .prepare("insert into app_meta (key, value) values ('data_origin', 'synthetic-seed')")
      .run();
    expect(one("select value from app_meta where key = 'data_origin'")).toEqual({
      value: "synthetic-seed",
    });
    expect(() =>
      temp.db.prepare("insert into app_meta (key, value) values ('data_origin', 'x')").run(),
    ).toThrow(/UNIQUE constraint failed/);
  });
});
