import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempDb, type TempDb } from "../../test/temp-db";
import { AppError } from "./app-error";
import { fixedClock, steppableClock } from "./clock";
import { UnitOfWork, connectionOf, type Tx } from "./unit-of-work";

const holdLockScript = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "children",
  "hold-write-lock.ts",
);

let temp: TempDb;

beforeEach(() => {
  temp = createTempDb();
  temp.db.exec("create table notes (id integer primary key, body text not null)");
});

afterEach(async () => {
  await temp.dispose();
});

const count = () => (temp.db.prepare("select count(*) as n from notes").get() as { n: number }).n;

describe("UnitOfWork.run", () => {
  it("[BR-5] commits the change when the callback returns (@1.5)", () => {
    const uow = new UnitOfWork(temp.db, fixedClock(1000));
    const result = uow.run((tx) => {
      connectionOf(tx).prepare("insert into notes (body) values (?)").run("a");
      return "done";
    });
    expect(result).toBe("done");
    expect(count()).toBe(1);
  });

  it("[BR-5] rolls back the change and the audit row when the callback throws after the change (@1.5)", () => {
    temp.db.exec("create table audit (id integer primary key, note text not null)");
    const uow = new UnitOfWork(temp.db, fixedClock(1000));
    expect(() =>
      uow.run((tx) => {
        const db = connectionOf(tx);
        db.prepare("insert into notes (body) values (?)").run("a");
        db.prepare("insert into audit (note) values (?)").run("created");
        throw new Error("boom before commit");
      }),
    ).toThrow("boom before commit");
    expect(count()).toBe(0);
    expect((temp.db.prepare("select count(*) as n from audit").get() as { n: number }).n).toBe(0);
  });

  it("[BR-5] an AppError thrown inside keeps its code and rolls back (@1.5)", () => {
    const uow = new UnitOfWork(temp.db, fixedClock(1000));
    try {
      uow.run((tx) => {
        connectionOf(tx).prepare("insert into notes (body) values (?)").run("a");
        throw new AppError("BOOKING_CONFLICT");
      });
      expect.unreachable();
    } catch (error) {
      expect((error as AppError).code).toBe("BOOKING_CONFLICT");
    }
    expect(count()).toBe(0);
  });

  it("[BR-5] a callback that returns a Promise is rejected by type and at run time, with a rollback (@1.5)", () => {
    const uow = new UnitOfWork(temp.db, fixedClock(1000));
    const insertAsync = async (tx: Tx) => {
      connectionOf(tx).prepare("insert into notes (body) values (?)").run("a");
    };
    // @ts-expect-error an async callback returns a Promise and does not compile
    const asyncRun = () => uow.run(insertAsync);
    expect(asyncRun).toThrow(/synchronous|promise/i);
    expect(count()).toBe(0);
  });

  it("[BR-5] Tx is unusable after the callback returns and carries now from the injected Clock (@1.5)", () => {
    const clock = steppableClock(1_792_000_000_000);
    const uow = new UnitOfWork(temp.db, clock);
    let leaked: Tx | undefined;
    const seen = uow.run((tx) => {
      leaked = tx;
      clock.advance(5000); // a later read must not change this transaction's now
      return tx.now;
    });
    expect(seen).toBe(1_792_000_000_000);
    expect(() => leaked!.db).toThrow(/transaction has ended/);
    const next = uow.run((tx) => tx.now);
    expect(next).toBe(1_792_000_005_000);
  });

  it("[BR-5] the clock is read inside the transaction, as the first statement (@1.5)", () => {
    let inTransactionAtRead: boolean | null = null;
    const clock = {
      now: () => {
        inTransactionAtRead = temp.db.inTransaction;
        return 1000;
      },
    };
    new UnitOfWork(temp.db, clock).run(() => 1);
    expect(inTransactionAtRead).toBe(true);
  });

  it("[BR-5] repository reads can use the Db or the Tx through connectionOf (@1.5)", () => {
    const uow = new UnitOfWork(temp.db, fixedClock(1));
    uow.run((tx) => {
      expect(connectionOf(tx)).toBe(temp.db);
    });
    expect(connectionOf(temp.db)).toBe(temp.db);
  });

  it("[BOK-04] a write lock held by another process beyond the timeout raises DATABASE_BUSY (503, Retry-After 1) (@1.5)", async () => {
    const holder = temp.spawnChild(holdLockScript, [temp.path, "4500"]);
    await holder.waitForLine("locked");
    const uow = new UnitOfWork(temp.db, fixedClock(1000));
    const started = Date.now();
    let caught: AppError | undefined;
    try {
      uow.run((tx) => {
        connectionOf(tx).prepare("insert into notes (body) values (?)").run("late");
      });
    } catch (error) {
      caught = error as AppError;
    }
    const waited = Date.now() - started;
    expect(caught?.code).toBe("DATABASE_BUSY");
    expect(caught?.status).toBe(503);
    expect(caught?.headers).toEqual({ "Retry-After": "1" });
    expect(waited).toBeGreaterThanOrEqual(1800);
    expect(waited).toBeLessThan(3500);
    await holder.exited;
    expect(count()).toBe(0);
  }, 30_000);

  it("[BOK-04] a holder that releases within the timeout lets the mutation succeed after waiting (@1.5)", async () => {
    const holder = temp.spawnChild(holdLockScript, [temp.path, "700"]);
    await holder.waitForLine("locked");
    const started = Date.now();
    const uow = new UnitOfWork(temp.db, fixedClock(1000));
    uow.run((tx) => {
      connectionOf(tx).prepare("insert into notes (body) values (?)").run("after wait");
    });
    expect(Date.now() - started).toBeGreaterThanOrEqual(300);
    await holder.exited;
    expect(count()).toBe(1);
  }, 30_000);
});
