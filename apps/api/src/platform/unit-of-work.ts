// UnitOfWork (AD-7): every mutation runs through `run`, implemented as `db.transaction(fn).immediate()`
// (BEGIN IMMEDIATE) on the single connection. The callback is synchronous; asynchronous work such as password
// hashing happens before `run`.
import { AppError, isAppError, isBusyError } from "./app-error";
import type { Clock } from "./clock";
import type { Db } from "./db";

declare const txBrand: unique symbol;

/**
 * A transaction handle. It exists only inside `UnitOfWork.run`, carries the single `clock.now()` read of the
 * use case, and is unusable after the callback returns. Repository write functions accept only a Tx; reads
 * accept a Db or a Tx.
 */
export interface Tx {
  readonly [txBrand]: true;
  /** The use case's single clock read, taken as the first statement inside the transaction. */
  readonly now: number;
  /** The connection; throws once the transaction has ended. */
  readonly db: Db;
}

export type DbOrTx = Db | Tx;

/** The connection behind a Db or a Tx. */
export function connectionOf(source: DbOrTx): Db {
  return "now" in source && "db" in source ? (source as Tx).db : (source as Db);
}

class TxImpl {
  private open = true;
  constructor(
    private readonly connection: Db,
    readonly now: number,
  ) {}
  get db(): Db {
    if (!this.open)
      throw new Error("This transaction has ended; its Tx must not be used after run() returns.");
    return this.connection;
  }
  close(): void {
    this.open = false;
  }
}

/** Rejects a callback that returns a Promise at compile time. */
export type SyncResult<T> = T extends PromiseLike<unknown> ? never : T;

export class UnitOfWork {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  /**
   * Runs `fn` in one immediate transaction and returns its result. A throw rolls everything back. When the
   * write lock cannot be had within the busy timeout, the failure is `AppError` `DATABASE_BUSY` (503).
   */
  run<T>(fn: (tx: Tx) => SyncResult<T>): T {
    const transaction = this.db.transaction((): T => {
      const tx = new TxImpl(this.db, this.clock.now());
      try {
        const result = fn(tx as unknown as Tx);
        if (isThenable(result)) {
          throw new TypeError(
            "UnitOfWork.run callbacks must be synchronous; do asynchronous work before the transaction.",
          );
        }
        return result as T;
      } finally {
        tx.close();
      }
    });
    try {
      return transaction.immediate();
    } catch (error) {
      if (isAppError(error)) throw error;
      if (isBusyError(error)) throw new AppError("DATABASE_BUSY", undefined, { cause: error });
      throw error;
    }
  }
}

function isThenable(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}
