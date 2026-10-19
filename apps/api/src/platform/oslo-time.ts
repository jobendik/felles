// The only module that imports temporal-polyfill (AD-5). It converts Oslo civil values to instants once,
// with `overflow: "reject"` and `disambiguation: "reject"`, and builds the only day and week ranges.
import { CIVIL_DATE_PATTERN, OSLO_TIME_ZONE, isCivilDate } from "@felles/contracts";
import { Temporal } from "temporal-polyfill";

export type OsloTimeErrorCode = "INVALID_CIVIL" | "UNREACHABLE_WALL_TIME";

/** Raised for civil values that are not a reachable Oslo wall-clock time; use cases map it to 400. */
export class OsloTimeError extends Error {
  readonly code: OsloTimeErrorCode;
  constructor(code: OsloTimeErrorCode, message: string) {
    super(message);
    this.name = "OsloTimeError";
    this.code = code;
  }
}

/**
 * Parses an ISO instant. A designator (`Z` or an offset) is required, so the result never depends on the
 * machine's time zone (`FELLES_NOW`).
 */
export function parseInstant(text: string): number {
  try {
    return Temporal.Instant.from(text).epochMilliseconds;
  } catch {
    throw new OsloTimeError("INVALID_CIVIL", `Not an ISO instant with Z or an offset: ${text}`);
  }
}

function assertCivilShapes(date: string, time: string): void {
  if (!CIVIL_DATE_PATTERN.test(date) || !isCivilDate(date)) {
    throw new OsloTimeError("INVALID_CIVIL", `Not a civil date (YYYY-MM-DD): ${date}`);
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new OsloTimeError("INVALID_CIVIL", `Not a civil time (HH:mm): ${time}`);
  }
}

/**
 * Oslo civil date and time to an instant in epoch milliseconds. Wall times that do not exist or are
 * ambiguous around the daylight saving switches are refused, and the date must round-trip.
 */
export function osloInstant(date: string, time: string): number {
  assertCivilShapes(date, time);
  let zoned: Temporal.ZonedDateTime;
  try {
    zoned = Temporal.PlainDateTime.from(`${date}T${time}`, { overflow: "reject" }).toZonedDateTime(
      OSLO_TIME_ZONE,
      {
        disambiguation: "reject",
      },
    );
  } catch {
    throw new OsloTimeError(
      "UNREACHABLE_WALL_TIME",
      `Not a reachable Oslo wall-clock time: ${date} ${time}`,
    );
  }
  if (zoned.toPlainDate().toString() !== date) {
    throw new OsloTimeError("INVALID_CIVIL", `Civil date did not round-trip: ${date}`);
  }
  return zoned.epochMilliseconds;
}

export interface InstantRange {
  /** Inclusive, epoch milliseconds. */
  from: number;
  /** Exclusive, epoch milliseconds. */
  to: number;
}

function startOfOsloDay(date: Temporal.PlainDate): number {
  return date.toZonedDateTime({ timeZone: OSLO_TIME_ZONE }).epochMilliseconds;
}

function plainDate(date: string): Temporal.PlainDate {
  if (!CIVIL_DATE_PATTERN.test(date)) {
    throw new OsloTimeError("INVALID_CIVIL", `Not a civil date (YYYY-MM-DD): ${date}`);
  }
  try {
    return Temporal.PlainDate.from(date, { overflow: "reject" });
  } catch {
    throw new OsloTimeError("INVALID_CIVIL", `Not a real calendar date: ${date}`);
  }
}

/** The half-open range of one Oslo day: start of day to the start of the next day (never `+ 24 h`). */
export function osloDayRange(date: string): InstantRange {
  return osloWeekRange(date, 1);
}

/** The half-open range of `days` whole Oslo days starting at the start of `date`. */
export function osloWeekRange(date: string, days: number): InstantRange {
  if (!Number.isInteger(days) || days < 1 || days > 14) {
    throw new OsloTimeError("INVALID_CIVIL", `days must be an integer from 1 to 14: ${days}`);
  }
  const first = plainDate(date);
  return { from: startOfOsloDay(first), to: startOfOsloDay(first.add({ days })) };
}
