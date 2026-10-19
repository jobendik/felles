// AppError (AD-4): the only error type that use cases throw. The status and the approved Norwegian message
// come from the contracts catalogue, so an unknown code does not compile.
import {
  ERROR_STATUS,
  OVERLAP_TRIGGER_MESSAGE,
  messageFor,
  type ErrorCode,
  type ErrorDetailsMap,
  type ErrorEnvelope,
  type FieldError,
} from "@felles/contracts";

type DetailsArgs<C extends ErrorCode> = [undefined] extends [ErrorDetailsMap[C]]
  ? [details?: ErrorDetailsMap[C], options?: AppErrorOptions]
  : [details: ErrorDetailsMap[C], options?: AppErrorOptions];

export interface AppErrorOptions {
  fieldErrors?: FieldError[];
  cause?: unknown;
}

export class AppError<C extends ErrorCode = ErrorCode> extends Error {
  readonly code: C;
  readonly status: number;
  readonly details: ErrorDetailsMap[C] | undefined;
  readonly fieldErrors: FieldError[] | undefined;

  constructor(code: C, ...args: DetailsArgs<C>) {
    const [details, options] = args;
    super(
      messageFor(code, details as ErrorDetailsMap[C]),
      options?.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = details as ErrorDetailsMap[C] | undefined;
    this.fieldErrors = options?.fieldErrors;
  }

  /** Response headers this error requires: `Retry-After` for busy and rate-limited answers. */
  get headers(): Record<string, string> {
    if (this.code === "DATABASE_BUSY") return { "Retry-After": "1" };
    if (this.code === "RATE_LIMITED") {
      const seconds = (this.details as ErrorDetailsMap["RATE_LIMITED"] | undefined)
        ?.retryAfterSeconds;
      return seconds === undefined ? {} : { "Retry-After": String(seconds) };
    }
    return {};
  }

  /** The AD-4 envelope: `{ error: { code, message, fieldErrors?, details? } }`. */
  toEnvelope(): ErrorEnvelope {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.fieldErrors === undefined ? {} : { fieldErrors: this.fieldErrors }),
        ...(this.details === undefined ? {} : { details: this.details as Record<string, unknown> }),
      },
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

interface SqliteErrorLike extends Error {
  code: string;
}

function isSqliteError(error: unknown): error is SqliteErrorLike {
  return (
    error instanceof Error &&
    error.name === "SqliteError" &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

/** `SQLITE_BUSY*` and `SQLITE_LOCKED*` (also `SQLITE_BUSY_SNAPSHOT`) mean the write lock could not be had. */
export function isBusyError(error: unknown): boolean {
  return (
    isSqliteError(error) &&
    (error.code.startsWith("SQLITE_BUSY") || error.code.startsWith("SQLITE_LOCKED"))
  );
}

/** True when a trigger aborted a booking insert because the interval overlaps a blocking booking. */
export function isOverlapTriggerError(error: unknown): boolean {
  return (
    isSqliteError(error) &&
    error.code === "SQLITE_CONSTRAINT_TRIGGER" &&
    error.message === OVERLAP_TRIGGER_MESSAGE
  );
}

/**
 * Maps whatever was thrown to an AppError: AppErrors pass through, a busy database is 503 `DATABASE_BUSY`,
 * the overlap trigger is 409 `BOOKING_CONFLICT`, and anything else, including every other trigger message, is
 * 500 `INTERNAL`. Parser and SQLite messages never reach a response; they stay in the `cause`.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (isBusyError(error)) return new AppError("DATABASE_BUSY", undefined, { cause: error });
  if (isOverlapTriggerError(error))
    return new AppError("BOOKING_CONFLICT", undefined, { cause: error });
  return new AppError("INTERNAL", undefined, { cause: error });
}
