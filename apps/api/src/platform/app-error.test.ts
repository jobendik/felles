import { describe, expect, it } from "vitest";
import { AppError, isBusyError, toAppError } from "./app-error";

function sqliteError(code: string, message: string): Error {
  return Object.assign(new Error(message), { name: "SqliteError", code });
}

describe("AppError", () => {
  it("[BR-4] takes status and the approved message from the catalogue (@1.5)", () => {
    const error = new AppError("BOOKING_CONFLICT");
    expect(error.status).toBe(409);
    expect(error.message).toBe("Tidsrommet er ikke lenger ledig. Velg et annet tidspunkt.");
    expect(new AppError("FORBIDDEN").status).toBe(403);
    expect(new AppError("NOT_IMPLEMENTED").status).toBe(501);
  });

  it("[BR-4] details are typed per code and count-bearing messages are functions of them (@1.5)", () => {
    const archive = new AppError("RESOURCE_HAS_FUTURE_BOOKINGS", {
      futureBookingCount: 3,
      firstFutureBookingAt: "2026-10-20T08:00:00.000Z",
    });
    expect(archive.message).toBe("Ressursen har 3 fremtidige bookinger og kan ikke arkiveres.");
    expect(archive.toEnvelope().error.details).toEqual({
      futureBookingCount: 3,
      firstFutureBookingAt: "2026-10-20T08:00:00.000Z",
    });
    expect(
      new AppError("BOOKING_STARTED", { currentStatus: "pending", action: "approve" }).message,
    ).toContain("Du kan fortsatt avslå den.");
    expect(new AppError("RATE_LIMITED", { retryAfterSeconds: 10 }).headers).toEqual({
      "Retry-After": "10",
    });
    expect(new AppError("INVALID_CREDENTIALS").details).toBeUndefined();
    expect(new AppError("INVALID_CREDENTIALS", { retryAfterSeconds: 10 }).details).toEqual({
      retryAfterSeconds: 10,
    });
  });

  it("[BR-4] unknown codes and missing details do not compile (@1.5)", () => {
    // @ts-expect-error not a contract code
    const unknownCode = () => new AppError("NOT_A_CODE");
    // @ts-expect-error BOOKING_NOT_PENDING requires details.currentStatus
    const missingDetails = () => new AppError("BOOKING_NOT_PENDING");
    // @ts-expect-error details of another code
    const wrongDetails = () => new AppError("RATE_LIMITED", { currentStatus: "pending" });
    expect(typeof unknownCode).toBe("function");
    expect(typeof missingDetails).toBe("function");
    expect(typeof wrongDetails).toBe("function");
  });

  it("[BR-4] formats the AD-4 envelope with field errors (@1.5)", () => {
    const error = new AppError("VALIDATION_FAILED", undefined, {
      fieldErrors: [{ path: "purpose", code: "REQUIRED", message: "Må fylles ut." }],
    });
    expect(error.toEnvelope()).toEqual({
      error: {
        code: "VALIDATION_FAILED",
        message: "Sjekk feltene og prøv igjen.",
        fieldErrors: [{ path: "purpose", code: "REQUIRED", message: "Må fylles ut." }],
      },
    });
  });

  it("[BR-4] DATABASE_BUSY carries Retry-After: 1 (@1.5)", () => {
    expect(new AppError("DATABASE_BUSY").headers).toEqual({ "Retry-After": "1" });
    expect(new AppError("DATABASE_BUSY").status).toBe(503);
  });
});

describe("toAppError", () => {
  it("[BR-4] SQLITE_BUSY, SQLITE_BUSY_SNAPSHOT and SQLITE_LOCKED map to DATABASE_BUSY (@1.5)", () => {
    for (const code of [
      "SQLITE_BUSY",
      "SQLITE_BUSY_SNAPSHOT",
      "SQLITE_BUSY_RECOVERY",
      "SQLITE_LOCKED",
      "SQLITE_LOCKED_SHAREDCACHE",
    ]) {
      const mapped = toAppError(sqliteError(code, "database is locked"));
      expect(mapped.code, code).toBe("DATABASE_BUSY");
      expect(mapped.status).toBe(503);
      expect(isBusyError(sqliteError(code, "x"))).toBe(true);
    }
  });

  it("[BOK-03] the overlap trigger maps to BOOKING_CONFLICT; every other trigger message is INTERNAL (@1.5)", () => {
    expect(toAppError(sqliteError("SQLITE_CONSTRAINT_TRIGGER", "BOOKING_OVERLAP")).code).toBe(
      "BOOKING_CONFLICT",
    );
    for (const message of ["BOOKING_TERMINAL", "BOOKING_ILLEGAL_TRANSITION", "SOMETHING_NEW"]) {
      expect(toAppError(sqliteError("SQLITE_CONSTRAINT_TRIGGER", message)).code, message).toBe(
        "INTERNAL",
      );
    }
  });

  it("[BR-4] AppErrors pass through and unknown errors become INTERNAL without leaking the cause (@1.5)", () => {
    const original = new AppError("OWN_REQUEST");
    expect(toAppError(original)).toBe(original);
    const mapped = toAppError(new Error("SELECT * FROM users WHERE password = 'x'"));
    expect(mapped.code).toBe("INTERNAL");
    expect(mapped.message).toBe("Noe gikk galt hos oss. Prøv igjen.");
    expect(JSON.stringify(mapped.toEnvelope())).not.toContain("SELECT");
    expect(toAppError("a string").code).toBe("INTERNAL");
  });
});
