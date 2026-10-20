// The in-house migration runner (AD-19). Forward-only `NNNN_slug.sql` files. Each file is read with its BOM
// stripped and CRLF normalised to LF; that normalised text is both hashed and executed, as a whole file, so a
// checksum and `sqlite_master.sql` do not depend on the platform's line endings. Every unapplied version is
// applied in ascending order inside one immediate transaction that re-reads `schema_migrations`.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { systemClock, type Clock } from "./clock";
import { findRepoRoot, type Db } from "./db";

export type MigrationErrorCode =
  | "MIGRATION_CHECKSUM"
  | "MIGRATION_MISSING_FILE"
  | "MIGRATION_FORBIDDEN_STATEMENT"
  | "MIGRATION_BAD_FILENAME"
  | "MIGRATION_DUPLICATE_VERSION"
  | "MIGRATION_FAILED";

export class MigrationError extends Error {
  readonly code: MigrationErrorCode;
  constructor(code: MigrationErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "MigrationError";
    this.code = code;
  }
}

export interface Migration {
  version: number;
  name: string;
  file: string;
  /** The normalised text that is hashed and executed. */
  sql: string;
  checksum: string;
}

const CREATE_SCHEMA_MIGRATIONS =
  "create table if not exists schema_migrations (version integer primary key, name text not null, checksum text not null, applied_at integer not null) strict";

const FILE_PATTERN = /^(\d{4})_([a-z0-9][a-z0-9_]*)\.sql$/;

export function defaultMigrationsDir(): string {
  return join(findRepoRoot(), "apps", "api", "db", "migrations");
}

/** Strips a leading BOM and turns CRLF and lone CR into LF. */
export function normaliseSql(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

export function checksumOf(normalised: string): string {
  return createHash("sha256").update(normalised).digest("hex");
}

// ---- forbidden statements ----

/** Replaces comments and quoted text with spaces so keywords inside them are not seen. */
function blankQuotedAndComments(sql: string): string {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i]!;
    const next = sql[i + 1];
    if (ch === "-" && next === "-") {
      while (i < sql.length && sql[i] !== "\n") i += 1;
    } else if (ch === "/" && next === "*") {
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i += 1;
      i += 2;
      out += " ";
    } else if (ch === "'" || ch === '"' || ch === "`") {
      const quote = ch;
      i += 1;
      while (i < sql.length) {
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) i += 2;
          else break;
        } else i += 1;
      }
      i += 1;
      out += " x ";
    } else if (ch === "[") {
      while (i < sql.length && sql[i] !== "]") i += 1;
      i += 1;
      out += " x ";
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

const FORBIDDEN_FIRST_WORDS = new Set([
  "BEGIN",
  "COMMIT",
  "END",
  "ROLLBACK",
  "SAVEPOINT",
  "RELEASE",
  "PRAGMA",
]);

/**
 * Throws when a statement outside a trigger body starts with transaction control or PRAGMA. Trigger bodies
 * (`CREATE TRIGGER … BEGIN … END;`) legitimately contain `;` and `CASE … END`, so they are skipped as units.
 */
export function assertNoForbiddenStatements(sql: string, file: string): void {
  const tokens =
    blankQuotedAndComments(sql).match(/[A-Za-z_][A-Za-z0-9_]*|;|[^\sA-Za-z0-9_;]+|\d+/g) ?? [];
  let atStatementStart = true;
  let inTriggerHeader = false;
  let inTriggerBody = false;
  let caseDepth = 0;
  let firstWord = "";
  for (const raw of tokens) {
    const word = raw.toUpperCase();
    if (inTriggerBody) {
      if (word === "CASE") caseDepth += 1;
      else if (word === "END" && caseDepth > 0) caseDepth -= 1;
      else if (word === "END" && caseDepth === 0) {
        inTriggerBody = false;
        atStatementStart = false; // the `;` after END closes the CREATE TRIGGER statement
        firstWord = "TRIGGER";
      }
      continue;
    }
    if (word === ";") {
      atStatementStart = true;
      inTriggerHeader = false;
      firstWord = "";
      continue;
    }
    if (atStatementStart && /^[A-Za-z_]/.test(raw)) {
      firstWord = word;
      atStatementStart = false;
      if (FORBIDDEN_FIRST_WORDS.has(word)) {
        throw new MigrationError(
          "MIGRATION_FORBIDDEN_STATEMENT",
          `${file} contains ${word} outside a trigger body; migrations hold no transaction control or PRAGMA.`,
        );
      }
      continue;
    }
    if (firstWord === "CREATE" && word === "TRIGGER") inTriggerHeader = true;
    if (inTriggerHeader && word === "BEGIN") {
      inTriggerHeader = false;
      inTriggerBody = true;
      caseDepth = 0;
    }
  }
}

// ---- loading ----

export function loadMigrations(dir: string = defaultMigrationsDir()): Migration[] {
  if (!existsSync(dir)) return [];
  const migrations: Migration[] = [];
  const seen = new Map<number, string>();
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".sql")) continue;
    const match = FILE_PATTERN.exec(file);
    if (match === null) {
      throw new MigrationError(
        "MIGRATION_BAD_FILENAME",
        `${file} must be named NNNN_slug.sql (lower-case slug).`,
      );
    }
    const version = Number(match[1]);
    const earlier = seen.get(version);
    if (earlier !== undefined) {
      throw new MigrationError(
        "MIGRATION_DUPLICATE_VERSION",
        `${file} and ${earlier} share version ${version}.`,
      );
    }
    seen.set(version, file);
    const sql = normaliseSql(readFileSync(join(dir, file), "utf8"));
    assertNoForbiddenStatements(sql, file);
    migrations.push({ version, name: match[2]!, file, sql, checksum: checksumOf(sql) });
  }
  return migrations.sort((a, b) => a.version - b.version);
}

// ---- applying ----

interface AppliedRow {
  version: number;
  name: string;
  checksum: string;
}

export interface MigrateOptions {
  dir?: string;
  clock?: Clock;
}

export interface MigrateResult {
  /** Versions applied by this call, in the order applied. */
  applied: number[];
}

/**
 * Applies every unapplied migration in ascending version order, inside one immediate transaction that
 * re-reads `schema_migrations`, so concurrent callers apply each version exactly once. A changed checksum or a
 * recorded version without a file fails with a clear message and applies nothing.
 */
export function migrate(db: Db, options: MigrateOptions = {}): MigrateResult {
  const migrations = loadMigrations(options.dir);
  const clock = options.clock ?? systemClock();
  db.exec(CREATE_SCHEMA_MIGRATIONS);
  const run = db.transaction((): MigrateResult => {
    const recorded = db
      .prepare("select version, name, checksum from schema_migrations order by version")
      .all() as AppliedRow[];
    const byVersion = new Map(migrations.map((m) => [m.version, m]));
    for (const row of recorded) {
      const file = byVersion.get(row.version);
      if (file === undefined) {
        throw new MigrationError(
          "MIGRATION_MISSING_FILE",
          `version ${row.version} (${row.name}) is recorded in the database but has no file; are you on older code?`,
        );
      }
      if (file.checksum !== row.checksum) {
        throw new MigrationError(
          "MIGRATION_CHECKSUM",
          `${file.file} changed after it was applied (recorded ${row.checksum.slice(0, 12)}, now ${file.checksum.slice(0, 12)}); migrations are forward-only.`,
        );
      }
    }
    const done = new Set(recorded.map((row) => row.version));
    const insert = db.prepare(
      "insert into schema_migrations (version, name, checksum, applied_at) values (?, ?, ?, ?)",
    );
    const applied: number[] = [];
    for (const migration of migrations) {
      if (done.has(migration.version)) continue;
      try {
        // The SQL is the committed migration file, never request data.
        db.exec(migration.sql);
      } catch (error) {
        throw new MigrationError(
          "MIGRATION_FAILED",
          `${migration.file}: ${(error as Error).message}`,
        );
      }
      insert.run(migration.version, migration.name, migration.checksum, clock.now());
      applied.push(migration.version);
    }
    return { applied };
  });
  return run.immediate();
}
