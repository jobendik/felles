import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempDb, type TempDb } from "../../test/temp-db";
import { fixedClock } from "./clock";
import {
  MigrationError,
  assertNoForbiddenStatements,
  checksumOf,
  loadMigrations,
  migrate,
  normaliseSql,
} from "./migrate";

const migrateChild = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "children",
  "migrate-child.ts",
);

let temp: TempDb;
const folders: string[] = [];

function migrationsFolder(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "felles-migrations-"));
  folders.push(dir);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}

beforeEach(() => {
  temp = createTempDb({ migrate: false });
});

afterEach(async () => {
  await temp.dispose();
  for (const dir of folders.splice(0)) {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});

const tables = () =>
  (
    temp.db.prepare("select name from sqlite_master where type = 'table'").all() as {
      name: string;
    }[]
  )
    .map((row) => row.name)
    .sort();

const CREATE_A = "create table a (id integer primary key, note text not null) strict;\n";

describe("line endings and the BOM", () => {
  it("[RUN-1] CRLF and LF forms of a migration get the identical checksum and the same stored schema (@1.6)", () => {
    const lf = CREATE_A + "create index a_note on a (note);\n";
    const crlf = lf.replace(/\n/g, "\r\n");
    const bom = "\uFEFF" + crlf;
    const dirs = [lf, crlf, bom].map((text) => migrationsFolder({ "0001_init.sql": text }));
    const checksums = dirs.map((dir) => loadMigrations(dir)[0]!.checksum);
    expect(new Set(checksums).size).toBe(1);
    expect(checksums[0]).toBe(checksumOf(normaliseSql(lf)));

    migrate(temp.db, { dir: dirs[1]! });
    const stored = temp.db.prepare("select sql from sqlite_master where name = 'a'").get() as {
      sql: string;
    };
    expect(stored.sql).not.toContain("\r");
    expect(stored.sql.startsWith("\uFEFF")).toBe(false);
  });

  it("[RUN-1] an already applied migration that is re-read in another line-ending form still verifies (@1.6)", () => {
    const lf = CREATE_A;
    migrate(temp.db, { dir: migrationsFolder({ "0001_init.sql": lf }) });
    const result = migrate(temp.db, {
      dir: migrationsFolder({ "0001_init.sql": lf.replace(/\n/g, "\r\n") }),
    });
    expect(result.applied).toEqual([]);
  });
});

describe("whole-file execution", () => {
  it("[RUN-1] executes the whole file including a trigger body that contains semicolons (@1.6)", () => {
    const sql =
      CREATE_A +
      "create table log (id integer primary key, msg text not null) strict;\n" +
      "create trigger a_log after insert on a begin\n" +
      "  insert into log (msg) values ('one');\n" +
      "  insert into log (msg) values (case when new.note = 'x' then 'x' else 'other' end);\n" +
      "end;\n";
    const result = migrate(temp.db, { dir: migrationsFolder({ "0001_init.sql": sql }) });
    expect(result.applied).toEqual([1]);
    temp.db.prepare("insert into a (note) values ('x')").run();
    expect(temp.db.prepare("select msg from log order by id").all()).toEqual([
      { msg: "one" },
      { msg: "x" },
    ]);
    expect(tables()).toEqual(expect.arrayContaining(["a", "log", "schema_migrations"]));
  });

  it("[RUN-1] a failing migration rolls back everything it did and records nothing (@1.6)", () => {
    const dir = migrationsFolder({
      "0001_ok.sql": CREATE_A,
      "0002_bad.sql":
        "create table b (id integer) strict;\ninsert into no_such_table values (1);\n",
    });
    expect(() => migrate(temp.db, { dir })).toThrow(MigrationError);
    expect(tables()).toEqual(["schema_migrations"]);
    expect(temp.db.prepare("select count(*) as n from schema_migrations").get()).toEqual({ n: 0 });
  });

  it("[RUN-1] applied_at comes from the injected clock (@1.6)", () => {
    migrate(temp.db, {
      dir: migrationsFolder({ "0001_init.sql": CREATE_A }),
      clock: fixedClock(123456),
    });
    expect(temp.db.prepare("select applied_at from schema_migrations").get()).toEqual({
      applied_at: 123456,
    });
  });
});

describe("forbidden statements", () => {
  const rejected: [string, string][] = [
    ["BEGIN", "begin;\ncreate table a (id integer);\ncommit;\n"],
    ["COMMIT", "create table a (id integer);\nCOMMIT;\n"],
    ["ROLLBACK", "create table a (id integer);\nrollback;\n"],
    ["SAVEPOINT", "savepoint s;\ncreate table a (id integer);\n"],
    ["RELEASE", "create table a (id integer);\nrelease s;\n"],
    ["PRAGMA", "pragma foreign_keys = off;\ncreate table a (id integer);\n"],
    ["END", "create table a (id integer);\nend;\n"],
  ];
  for (const [word, sql] of rejected) {
    it(`[RUN-1] rejects ${word} outside a trigger body (@1.6)`, () => {
      expect(() => assertNoForbiddenStatements(sql, "0001_x.sql")).toThrow(MigrationError);
      expect(() => loadMigrations(migrationsFolder({ "0001_x.sql": sql }))).toThrow(
        /MIGRATION_FORBIDDEN_STATEMENT/,
      );
    });
  }

  it("[RUN-1] allows BEGIN/END inside trigger bodies, CASE … END, and keywords in strings and comments (@1.6)", () => {
    const ok =
      "-- begin; commit; pragma\n" +
      "/* BEGIN COMMIT */\n" +
      "create table a (id integer primary key, note text not null default 'commit; pragma x') strict;\n" +
      "create trigger t1 before insert on a when case when new.note = 'begin' then 1 else 0 end = 1\n" +
      "begin\n  select raise(abort, 'END; COMMIT');\nend;\n" +
      "create trigger t2 after insert on a begin\n  update a set note = case when note = '' then 'x' else note end where id = new.id;\nend;\n" +
      'create table "pragma" (id integer);\n';
    expect(() => assertNoForbiddenStatements(ok, "0001_ok.sql")).not.toThrow();
  });
});

describe("file names", () => {
  it("[RUN-1] enforces NNNN_slug.sql and unique versions, and ignores non-SQL files (@1.6)", () => {
    expect(() => loadMigrations(migrationsFolder({ "init.sql": CREATE_A }))).toThrow(
      /MIGRATION_BAD_FILENAME/,
    );
    expect(() => loadMigrations(migrationsFolder({ "0001_Init.sql": CREATE_A }))).toThrow(
      /MIGRATION_BAD_FILENAME/,
    );
    expect(() =>
      loadMigrations(migrationsFolder({ "0001_a.sql": CREATE_A, "0001_b.sql": CREATE_A })),
    ).toThrow(/MIGRATION_DUPLICATE_VERSION/);
    expect(
      loadMigrations(migrationsFolder({ "README.md": "x", "0002_b.sql": CREATE_A })).map(
        (m) => m.version,
      ),
    ).toEqual([2]);
    expect(loadMigrations(join(tmpdir(), "felles-does-not-exist"))).toEqual([]);
  });
});

describe("applying in order", () => {
  it("[RUN-1] applies every unapplied version in ascending order, including a lower one that arrives later (@1.6)", () => {
    const base = {
      "0001_a.sql": "create table s1 (id integer) strict;\n",
      "0500_b.sql": "create table s5 (id integer) strict;\n",
    };
    expect(migrate(temp.db, { dir: migrationsFolder(base) }).applied).toEqual([1, 500]);
    const later = migrationsFolder({
      ...base,
      "0300_c.sql": "create table s3 (id integer) strict;\n",
    });
    expect(migrate(temp.db, { dir: later }).applied).toEqual([300]);
    const order = temp.db
      .prepare("select version from schema_migrations order by applied_at, rowid")
      .all() as { version: number }[];
    expect(order.map((r) => r.version)).toEqual([1, 500, 300]);
    expect(migrate(temp.db, { dir: later }).applied).toEqual([]);
  });

  it("[RUN-1] applies a batch of unapplied versions in numeric order, not name order of arrival (@1.6)", () => {
    const dir = migrationsFolder({
      "0200_b.sql": "create table second (id integer) strict;\ninsert into first values (1);\n",
      "0100_a.sql": "create table first (id integer) strict;\n",
    });
    expect(migrate(temp.db, { dir }).applied).toEqual([100, 200]);
  });
});

describe("integrity failures", () => {
  it("[RUN-1] a changed checksum fails with a clear message and applies nothing new (@1.6)", () => {
    migrate(temp.db, { dir: migrationsFolder({ "0001_a.sql": CREATE_A }) });
    const changed = migrationsFolder({
      "0001_a.sql": CREATE_A + "-- edited\n",
      "0002_b.sql": "create table b (id integer) strict;\n",
    });
    expect(() => migrate(temp.db, { dir: changed })).toThrow(
      /MIGRATION_CHECKSUM.*0001_a\.sql changed after it was applied/,
    );
    expect(tables()).not.toContain("b");
  });

  it("[RUN-1] a recorded version without a file fails with a clear message (@1.6)", () => {
    migrate(temp.db, {
      dir: migrationsFolder({
        "0001_a.sql": CREATE_A,
        "0002_b.sql": "create table b (id integer) strict;\n",
      }),
    });
    expect(() => migrate(temp.db, { dir: migrationsFolder({ "0001_a.sql": CREATE_A }) })).toThrow(
      /MIGRATION_MISSING_FILE.*version 2 \(b\)/,
    );
  });
});

describe("racing processes", () => {
  it("[RUN-1] three processes racing to migrate one fresh database apply the schema once (@1.6)", async () => {
    const dir = migrationsFolder({
      "0001_a.sql": CREATE_A + "create index a_note on a (note);\n",
      "0002_b.sql": "create table b (id integer primary key) strict;\n",
    });
    mkdirSync(dirname(temp.path), { recursive: true });
    temp.db.close(); // the children open their own connections
    const startAt = Date.now() + 2500;
    const children = [1, 2, 3].map(() =>
      temp.spawnChild(migrateChild, [temp.path, dir, String(startAt)]),
    );
    const lines = await Promise.all(children.map((child) => child.waitForLine("result", 30_000)));
    await Promise.all(children.map((child) => child.exited));
    const applied = lines.map((line) => JSON.parse(line.replace("result ", "")) as number[]);
    expect(applied.filter((list) => list.length > 0)).toHaveLength(1);
    expect(applied.flat().sort()).toEqual([1, 2]);
    expect(applied.filter((list) => list.length === 0)).toHaveLength(2);
  }, 60_000);
});
