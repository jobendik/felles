// The schema snapshot harness (AD-19): the schema is dumped from the migrated database (`sqlite_master`),
// normalised and compared with the committed snapshot, so any schema change shows up as a diff in review.
// `explainQueryPlan` and `assertUsesIndex` let later stories assert that a query uses the index it should.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Db } from "../../src/platform/db";

interface MasterRow {
  type: string;
  name: string;
  tbl_name: string;
  sql: string | null;
}

const TYPE_ORDER: Record<string, number> = { table: 0, index: 1, trigger: 2, view: 3 };

/** Removes CR, trims trailing whitespace on every line and trims the ends. */
export function normaliseSnapshotText(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .trim();
}

/** The whole schema as normalised text: one block per object, tables first, each group sorted by name. */
export function dumpSchema(db: Db): string {
  const rows = db
    .prepare(
      "select type, name, tbl_name, sql from sqlite_master where substr(name, 1, 7) <> 'sqlite_' and sql is not null",
    )
    .all() as MasterRow[];
  rows.sort(
    (a, b) =>
      (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9) ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
  const blocks = rows.map(
    (row) =>
      `-- ${row.type} ${row.name}${row.type === "table" ? "" : ` on ${row.tbl_name}`}\n${normaliseSnapshotText(row.sql ?? "")};`,
  );
  return `${blocks.join("\n\n")}\n`;
}

export function schemaHash(snapshot: string): string {
  return createHash("sha256").update(normaliseSnapshotText(snapshot)).digest("hex");
}

export interface SnapshotComparison {
  matches: boolean;
  /** A short unified-style description of the first differences, empty when equal. */
  diff: string;
  actualHash: string;
}

export function compareWithSnapshot(db: Db, snapshotPath: string): SnapshotComparison {
  const actual = normaliseSnapshotText(dumpSchema(db));
  const expected = existsSync(snapshotPath)
    ? normaliseSnapshotText(readFileSync(snapshotPath, "utf8"))
    : "";
  if (actual === expected) return { matches: true, diff: "", actualHash: schemaHash(actual) };
  const actualLines = actual.split("\n");
  const expectedLines = expected.split("\n");
  const diff: string[] = [];
  const length = Math.max(actualLines.length, expectedLines.length);
  for (let i = 0; i < length && diff.length < 40; i += 1) {
    if (actualLines[i] === expectedLines[i]) continue;
    if (expectedLines[i] !== undefined) diff.push(`- ${expectedLines[i]}`);
    if (actualLines[i] !== undefined) diff.push(`+ ${actualLines[i]}`);
  }
  return { matches: false, diff: diff.join("\n"), actualHash: schemaHash(actual) };
}

/**
 * Compares and fails with the diff. With `FELLES_UPDATE_SNAPSHOT=1` the snapshot and its hash file are
 * rewritten instead, which is the deliberate act of accepting a schema change.
 */
export function assertSchemaMatchesSnapshot(db: Db, snapshotPath: string, hashPath?: string): void {
  if (process.env.FELLES_UPDATE_SNAPSHOT === "1") {
    const text = normaliseSnapshotText(dumpSchema(db));
    writeFileSync(snapshotPath, `${text}\n`);
    if (hashPath !== undefined) writeFileSync(hashPath, `${schemaHash(text)}\n`);
    return;
  }
  const result = compareWithSnapshot(db, snapshotPath);
  if (!result.matches) {
    throw new Error(
      `The migrated schema differs from ${snapshotPath}. Review the change; to accept it run the tests with FELLES_UPDATE_SNAPSHOT=1.\n${result.diff}`,
    );
  }
}

/** The `detail` column of `EXPLAIN QUERY PLAN` for a statement. */
export function explainQueryPlan(db: Db, sql: string, params: unknown[] = []): string[] {
  // The statement under test is passed in by the test author, not by a request.
  // eslint-disable-next-line felles/no-sql-interpolation
  const rows = db.prepare(`explain query plan ${sql}`).all(...params) as { detail: string }[];
  return rows.map((row) => row.detail);
}

/** Fails unless the query plan searches using the named index and does not scan the table. */
export function assertUsesIndex(
  db: Db,
  sql: string,
  indexName: string,
  params: unknown[] = [],
): string[] {
  const plan = explainQueryPlan(db, sql, params);
  const usesIndex = plan.some(
    (line) =>
      line.includes(`USING INDEX ${indexName}`) ||
      line.includes(`USING COVERING INDEX ${indexName}`),
  );
  const scans = plan.some((line) => /^SCAN /.test(line));
  if (!usesIndex || scans) {
    throw new Error(
      `Expected a search using index ${indexName} without a table scan, got:\n${plan.join("\n")}`,
    );
  }
  return plan;
}
