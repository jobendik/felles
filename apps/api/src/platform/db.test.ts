import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BUSY_TIMEOUT_MS, DEFAULT_DB_PATH, findRepoRoot, openDatabase, type Db } from "./db";

const opened: Db[] = [];
const folders: string[] = [];

function tempFolder(): string {
  const folder = mkdtempSync(join(tmpdir(), "felles-db-test-"));
  folders.push(folder);
  return folder;
}

function track(db: Db): Db {
  opened.push(db);
  return db;
}

afterEach(() => {
  for (const db of opened.splice(0)) if (db.open) db.close();
  for (const folder of folders.splice(0)) {
    rmSync(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});

describe("openDatabase", () => {
  it("[BR-5] opens in WAL with foreign keys, recursive triggers, busy_timeout 2000 and synchronous NORMAL (@1.5)", () => {
    const folder = tempFolder();
    const db = track(
      openDatabase({ dbPath: join(folder, "a.db"), nodeEnv: "test", isVitest: true }),
    );
    expect(db.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(db.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(db.pragma("recursive_triggers", { simple: true })).toBe(1);
    expect(db.pragma("busy_timeout", { simple: true })).toBe(2000);
    expect(BUSY_TIMEOUT_MS).toBe(2000);
    expect(db.pragma("synchronous", { simple: true })).toBe(1); // NORMAL
  });

  it("[BR-5] refuses the default development path under test, by NODE_ENV or by Vitest (@1.5)", () => {
    const root = tempFolder();
    expect(() =>
      openDatabase(
        { dbPath: DEFAULT_DB_PATH, nodeEnv: "test", isVitest: false },
        { repoRoot: root },
      ),
    ).toThrow(/development database/);
    expect(() =>
      openDatabase(
        { dbPath: DEFAULT_DB_PATH, nodeEnv: "development", isVitest: true },
        { repoRoot: root },
      ),
    ).toThrow(/development database/);
    expect(() =>
      openDatabase(
        { dbPath: join(root, DEFAULT_DB_PATH), nodeEnv: "test", isVitest: true },
        { repoRoot: root },
      ),
    ).toThrow(/development database/);
    expect(existsSync(join(root, "data"))).toBe(false);
  });

  it("[RUN-1] resolves a relative FELLES_DB_PATH against the repository root and logs it absolute (@1.5)", () => {
    const root = tempFolder();
    const logged: string[] = [];
    const db = track(
      openDatabase(
        { dbPath: join("data", "felles.db"), nodeEnv: "development", isVitest: false },
        { repoRoot: root, log: (_message, fields) => logged.push(fields.dbPath) },
      ),
    );
    expect(db.open).toBe(true);
    expect(logged).toEqual([resolve(root, "data", "felles.db")]);
    expect(existsSync(resolve(root, "data", "felles.db"))).toBe(true);
  });

  it("[BR-5] an in-memory database is refused because WAL cannot be asserted (@1.5)", () => {
    expect(() => openDatabase({ dbPath: ":memory:", nodeEnv: "test", isVitest: true })).toThrow(
      /file/,
    );
  });

  it("[RUN-1] finds the repository root by its workspaces manifest (@1.5)", () => {
    const root = findRepoRoot();
    expect(existsSync(join(root, "apps", "api", "package.json"))).toBe(true);
  });
});
