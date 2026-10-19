// An isolated database for tests (AD-26): { path, db, dispose } over a temporary directory. `dispose` closes
// the connection, awaits every spawned child's exit and removes the directory with retries (Windows holds
// handles briefly). Children always start through process.execPath and are killed when a test fails.
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_DB_PATH, findRepoRoot, openDatabase, type Db } from "../src/platform/db";
import { migrate } from "../src/platform/migrate";

export interface ChildHandle {
  readonly process: ChildProcess;
  /** Resolves with the exit code once the child has exited. */
  readonly exited: Promise<number | null>;
  /** Resolves when the child prints a line that contains `text`. */
  waitForLine(text: string, timeoutMs?: number): Promise<string>;
  /** Everything the child wrote to stdout so far. */
  output(): string;
  kill(): void;
}

export interface TempDb {
  readonly path: string;
  readonly db: Db;
  /** Starts `node --import tsx <script> ...args` through process.execPath; tracked for disposal. */
  spawnChild(script: string, args?: string[]): ChildHandle;
  dispose(): Promise<void>;
}

const here = dirname(fileURLToPath(import.meta.url));

export interface TempDbOptions {
  /** Apply the migrations of apps/api/db/migrations (default true); `false` gives an empty database. */
  migrate?: boolean;
  /** A different migrations directory, for the runner's own tests. */
  migrationsDir?: string;
}

export function createTempDb(options: TempDbOptions = {}): TempDb {
  const repoRoot = findRepoRoot(here);
  const directory = mkdtempSync(join(tmpdir(), "felles-test-"));
  const path = join(directory, "felles.db");
  if (resolve(path).toLowerCase() === resolve(repoRoot, DEFAULT_DB_PATH).toLowerCase()) {
    throw new Error("The temporary database must never be the development database.");
  }
  const db = openDatabase({ dbPath: path, nodeEnv: "test", isVitest: true });
  if (options.migrate !== false) migrate(db, { dir: options.migrationsDir });
  const children: ChildHandle[] = [];
  let disposed = false;

  function spawnChild(script: string, args: string[] = []): ChildHandle {
    const child = spawn(process.execPath, ["--import", "tsx", script, ...args], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const waiters: { text: string; resolve: (line: string) => void }[] = [];
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
      for (const waiter of [...waiters]) {
        const line = stdout.split(/\r?\n/).find((l) => l.includes(waiter.text));
        if (line !== undefined) {
          waiters.splice(waiters.indexOf(waiter), 1);
          waiter.resolve(line);
        }
      }
    });
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });
    const exited = new Promise<number | null>((resolveExit) => {
      child.once("exit", (code) => resolveExit(code));
      child.once("error", () => resolveExit(null));
    });
    const handle: ChildHandle = {
      process: child,
      exited,
      output: () => stdout,
      kill: () => {
        if (child.exitCode === null && child.signalCode === null) child.kill();
      },
      waitForLine(text, timeoutMs = 20_000) {
        const existing = stdout.split(/\r?\n/).find((l) => l.includes(text));
        if (existing !== undefined) return Promise.resolve(existing);
        return new Promise<string>((resolveLine, rejectLine) => {
          const timer = setTimeout(
            () =>
              rejectLine(
                new Error(
                  `Child did not print "${text}" in ${timeoutMs} ms. stdout: ${stdout} stderr: ${stderr}`,
                ),
              ),
            timeoutMs,
          );
          waiters.push({
            text,
            resolve: (line) => {
              clearTimeout(timer);
              resolveLine(line);
            },
          });
          void exited.then(() => {
            clearTimeout(timer);
            rejectLine(
              new Error(
                `Child exited before printing "${text}". stdout: ${stdout} stderr: ${stderr}`,
              ),
            );
          });
        });
      },
    };
    children.push(handle);
    return handle;
  }

  async function dispose(): Promise<void> {
    if (disposed) return;
    disposed = true;
    for (const child of children) child.kill();
    await Promise.all(children.map((child) => child.exited));
    if (db.open) db.close();
    rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }

  return { path, db, spawnChild, dispose };
}
