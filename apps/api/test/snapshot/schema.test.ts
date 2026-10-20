import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempDb, type TempDb } from "../temp-db";
import { assertSchemaMatchesSnapshot, normaliseSnapshotText, schemaHash } from "./snapshot";

const here = dirname(fileURLToPath(import.meta.url));
const snapshotPath = join(here, "schema.snap");
const hashPath = join(here, "schema.hash");

let temp: TempDb;

beforeEach(() => {
  temp = createTempDb();
});

afterEach(async () => {
  await temp.dispose();
});

describe("committed schema snapshot", () => {
  it("[RUN-1] the migrated database matches the committed snapshot; any schema change shows as a diff (@1.7)", () => {
    assertSchemaMatchesSnapshot(temp.db, snapshotPath, hashPath);
  });

  it("[RUN-1] the committed hash is the hash of the committed snapshot (@1.7)", () => {
    const snapshot = readFileSync(snapshotPath, "utf8");
    expect(readFileSync(hashPath, "utf8").trim()).toBe(schemaHash(normaliseSnapshotText(snapshot)));
    expect(snapshot).not.toContain("\r");
    expect(snapshot).toMatch(/-- table bookings/);
    expect(snapshot).toMatch(/-- trigger bookings_no_overlap on bookings/);
  });

  it("[RUN-1] the three S00 migrations are recorded in schema_migrations (@1.7)", () => {
    const before = temp.db.prepare("select count(*) as n from schema_migrations").get();
    expect(before).toEqual({ n: 3 });
  });
});
