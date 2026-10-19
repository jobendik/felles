// The only constructor of a better-sqlite3 Database (AD-7, AD-18). One API process owns the file.
import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "../config";

export type Db = Database.Database;

/** The default development database path, relative to the repository root. */
export const DEFAULT_DB_PATH = join("data", "felles.db");

export const BUSY_TIMEOUT_MS = 2000;

export interface OpenDatabaseOptions {
  /** Where relative paths resolve; defaults to the repository root found from this file. */
  repoRoot?: string;
  /** Receives the absolute path once the database is open. */
  log?: (message: string, fields: { dbPath: string }) => void;
}

/** Walks up from `startDir` to the directory whose package.json declares the workspaces. */
export function findRepoRoot(startDir: string = dirname(fileURLToPath(import.meta.url))): string {
  let dir = startDir;
  for (;;) {
    const manifest = join(dir, "package.json");
    if (existsSync(manifest)) {
      const parsed = JSON.parse(readFileSync(manifest, "utf8")) as { workspaces?: unknown };
      if (parsed.workspaces !== undefined) return dir;
    }
    const parent = dirname(dir);
    if (parent === dir)
      throw new Error("Cannot find the repository root (no package.json with workspaces)");
    dir = parent;
  }
}

export function resolveDbPath(dbPath: string, repoRoot: string): string {
  return isAbsolute(dbPath) ? resolve(dbPath) : resolve(repoRoot, dbPath);
}

function isTruncateRace(error: unknown): boolean {
  return error instanceof Error && (error as { code?: unknown }).code === "SQLITE_IOERR_TRUNCATE";
}

function connect(file: string): Database.Database {
  try {
    return new Database(file);
  } catch (error) {
    if (!isTruncateRace(error)) throw error;
    // Windows: opening a WAL database while another process closes its last connection can fail once.
    return new Database(file);
  }
}

/**
 * Opens the database with the settings of AD-7: WAL (asserted), foreign keys and recursive triggers on,
 * `busy_timeout` 2000 and `synchronous = NORMAL`. The default development path is refused under test.
 */
export function openDatabase(
  config: Pick<Config, "dbPath" | "nodeEnv" | "isVitest">,
  options: OpenDatabaseOptions = {},
): Db {
  const repoRoot = options.repoRoot ?? findRepoRoot();
  const file = resolveDbPath(config.dbPath, repoRoot);
  const developmentDefault = resolveDbPath(DEFAULT_DB_PATH, repoRoot);
  const underTest = config.nodeEnv === "test" || config.isVitest;
  if (underTest && file.toLowerCase() === developmentDefault.toLowerCase()) {
    throw new Error(
      `Refusing to open the development database ${file} under test; give the harness a temporary FELLES_DB_PATH.`,
    );
  }
  if (config.dbPath === ":memory:" || config.dbPath === "") {
    throw new Error(
      "The database must be a file: WAL cannot be asserted for an in-memory database.",
    );
  }

  mkdirSync(dirname(file), { recursive: true });
  const db = connect(file);
  try {
    const journal = db.pragma("journal_mode = WAL", { simple: true });
    if (typeof journal !== "string" || journal.toLowerCase() !== "wal") {
      throw new Error(`Could not enable WAL for ${file} (journal_mode is ${String(journal)}).`);
    }
    db.pragma("foreign_keys = ON");
    db.pragma("recursive_triggers = ON");
    db.pragma(`busy_timeout = ${BUSY_TIMEOUT_MS}`);
    db.pragma("synchronous = NORMAL");
    assertPragma(db, "foreign_keys", 1);
    assertPragma(db, "recursive_triggers", 1);
    assertPragma(db, "busy_timeout", BUSY_TIMEOUT_MS);
  } catch (error) {
    db.close();
    throw error;
  }
  options.log?.("database opened", { dbPath: file });
  return db;
}

function assertPragma(db: Db, name: string, expected: number): void {
  const actual = db.pragma(name, { simple: true });
  if (actual !== expected)
    throw new Error(`PRAGMA ${name} is ${String(actual)}, expected ${expected}`);
}
