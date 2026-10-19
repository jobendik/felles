import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "../../src/platform/migrate";
import { createTempDb, type TempDb } from "../temp-db";
import {
  assertSchemaMatchesSnapshot,
  assertUsesIndex,
  compareWithSnapshot,
  dumpSchema,
  explainQueryPlan,
  normaliseSnapshotText,
  schemaHash,
} from "./snapshot";

let temp: TempDb;
let folder: string;

const MIGRATION =
  "create table items (id integer primary key autoincrement, group_id integer not null, status text not null, start_at integer not null) strict;\n" +
  "create index items_by_group on items (group_id, status, start_at);\n" +
  "create trigger items_no_delete before delete on items begin select raise(abort, 'ITEM_NO_DELETE'); end;\n";

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "felles-snap-"));
  writeFileSync(join(folder, "0001_items.sql"), MIGRATION);
  temp = createTempDb({ migrate: false });
  migrate(temp.db, { dir: folder });
});

afterEach(async () => {
  await temp.dispose();
  rmSync(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
});

describe("schema snapshot", () => {
  it("[RUN-1] is generated from sqlite_master: tables first, then indexes and triggers, sorted (@1.6)", () => {
    const dump = dumpSchema(temp.db);
    const markers = dump.split("\n").filter((line) => line.startsWith("-- "));
    expect(markers).toEqual([
      "-- table items",
      "-- table schema_migrations",
      "-- index items_by_group on items",
      "-- trigger items_no_delete on items",
    ]);
    expect(dump).toMatch(/CREATE TABLE items/i);
    expect(dump).not.toContain("sqlite_sequence");
    expect(dump.endsWith("\n")).toBe(true);
  });

  it("[RUN-1] compares equal after normalisation of line endings and trailing spaces (@1.6)", () => {
    const snapshotPath = join(folder, "schema.snap");
    const dump = dumpSchema(temp.db);
    writeFileSync(snapshotPath, dump.replace(/\n/g, "\r\n").replace(/;\r\n/g, ";   \r\n"));
    const result = compareWithSnapshot(temp.db, snapshotPath);
    expect(result.matches).toBe(true);
    expect(result.actualHash).toBe(schemaHash(dump));
    expect(() => assertSchemaMatchesSnapshot(temp.db, snapshotPath)).not.toThrow();
  });

  it("[RUN-1] a later schema change shows as a diff that names the changed lines (@1.6)", () => {
    const snapshotPath = join(folder, "schema.snap");
    writeFileSync(snapshotPath, dumpSchema(temp.db));
    writeFileSync(
      join(folder, "0002_more.sql"),
      "create table extras (id integer primary key) strict;\n",
    );
    migrate(temp.db, { dir: folder });
    const result = compareWithSnapshot(temp.db, snapshotPath);
    expect(result.matches).toBe(false);
    expect(result.diff).toContain("extras");
    expect(() => assertSchemaMatchesSnapshot(temp.db, snapshotPath)).toThrow(
      /differs from .*schema\.snap/,
    );
  });

  it("[RUN-1] a missing snapshot is a mismatch, never a silent pass (@1.6)", () => {
    expect(compareWithSnapshot(temp.db, join(folder, "absent.snap")).matches).toBe(false);
  });

  it("[RUN-1] normalisation is idempotent and removes CR and trailing blanks (@1.6)", () => {
    const text = "a  \r\nb\t\r\n";
    expect(normaliseSnapshotText(text)).toBe("a\nb");
    expect(normaliseSnapshotText(normaliseSnapshotText(text))).toBe("a\nb");
  });
});

describe("EXPLAIN QUERY PLAN helper", () => {
  const OVERLAP =
    "select id from items where group_id = ? and status in ('pending','confirmed') and start_at < ?";

  it("[NFR-06] assertUsesIndex passes for an indexed search and returns the plan (@1.6)", () => {
    const plan = assertUsesIndex(temp.db, OVERLAP, "items_by_group", [1, 100]);
    expect(plan.join("\n")).toContain("items_by_group");
  });

  it("[NFR-06] assertUsesIndex fails for a table scan and names the plan (@1.6)", () => {
    expect(() =>
      assertUsesIndex(temp.db, "select id from items where status = ?", "items_by_group", ["x"]),
    ).toThrow(/Expected a search using index items_by_group/);
    expect(explainQueryPlan(temp.db, "select * from items").join(" ")).toMatch(/SCAN/);
  });
});
