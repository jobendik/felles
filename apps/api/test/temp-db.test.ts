import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createTempDb } from "./temp-db";

const holdLockScript = join(
  dirname(fileURLToPath(import.meta.url)),
  "children",
  "hold-write-lock.ts",
);

describe("temp-db", () => {
  it("[NFR-03] returns { path, db, dispose } over a temporary directory and disposes cleanly (@1.5)", async () => {
    const temp = createTempDb();
    expect(temp.db.open).toBe(true);
    expect(existsSync(temp.path)).toBe(true);
    expect(temp.path).not.toContain(join("data", "felles.db"));
    temp.db.exec("create table t (id integer)");
    await temp.dispose();
    expect(temp.db.open).toBe(false);
    expect(existsSync(temp.path)).toBe(false);
    expect(existsSync(dirname(temp.path))).toBe(false);
    await temp.dispose(); // idempotent
  });

  it("[NFR-03] dispose kills a still-running child, awaits its exit and then removes the directory (@1.5)", async () => {
    const temp = createTempDb();
    const child = temp.spawnChild(holdLockScript, [temp.path, "60000"]);
    await child.waitForLine("locked");
    expect(child.process.exitCode).toBeNull();
    await temp.dispose();
    expect(child.process.exitCode !== null || child.process.signalCode !== null).toBe(true);
    expect(existsSync(dirname(temp.path))).toBe(false);
  }, 30_000);

  it("[NFR-03] children start through process.execPath (@1.5)", async () => {
    const temp = createTempDb();
    const child = temp.spawnChild(holdLockScript, [temp.path, "10"]);
    expect(child.process.spawnfile).toBe(process.execPath);
    await child.exited;
    await temp.dispose();
  }, 30_000);
});
