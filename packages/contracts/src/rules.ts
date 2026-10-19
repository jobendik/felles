// Pure shared rules (AD-2, AD-5, AD-16): booking time rules on civil strings, derived booking state,
// the 30- and 7-day arithmetic and the text normalisers. No I/O, no Temporal, no app imports.
import { BOOKING_HORIZON_MS, DASHBOARD_WINDOW_MS, osloDate } from "./time";

// ---- booking time rules on civil strings (BOK-02, AD-5) ----

export const BOOKING_WINDOW_START = "08:00";
export const BOOKING_WINDOW_END = "22:00";
export const GRID_MINUTES = 30;
export const MIN_BOOKING_MINUTES = 30;
export const MAX_BOOKING_MINUTES = 240;
export const SLOTS_PER_DAY = 28;

/** Strict civil shapes, checked before any date library sees the value (AD-5). */
export const CIVIL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const CIVIL_TIME_PATTERN = /^([01]\d|2[0-3]):(00|30)$/;

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number) as [number, number];
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export const BOOKING_TIME_VIOLATIONS = [
  "INVALID_TIME",
  "OFF_GRID",
  "OUTSIDE_WINDOW",
  "END_NOT_AFTER_START",
  "TOO_SHORT",
  "TOO_LONG",
] as const;
export type BookingTimeViolation = (typeof BOOKING_TIME_VIOLATIONS)[number];

export type BookingTimeCheck =
  { ok: true; minutes: number } | { ok: false; field: "start" | "end"; code: BookingTimeViolation };

function checkTimeShape(value: string): BookingTimeViolation | null {
  if (CIVIL_TIME_PATTERN.test(value)) return null;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? "OFF_GRID" : "INVALID_TIME";
}

/**
 * The window (08:00–22:00), the :00/:30 grid, the 30 minutes to 4 hours duration and end-after-start,
 * evaluated on the civil strings alone. The first violated rule is returned.
 */
export function checkBookingTimes(input: { start: string; end: string }): BookingTimeCheck {
  const startShape = checkTimeShape(input.start);
  if (startShape !== null) return { ok: false, field: "start", code: startShape };
  const endShape = checkTimeShape(input.end);
  if (endShape !== null) return { ok: false, field: "end", code: endShape };

  const start = timeToMinutes(input.start);
  const end = timeToMinutes(input.end);
  if (start < timeToMinutes(BOOKING_WINDOW_START) || start >= timeToMinutes(BOOKING_WINDOW_END)) {
    return { ok: false, field: "start", code: "OUTSIDE_WINDOW" };
  }
  if (end > timeToMinutes(BOOKING_WINDOW_END) || end < timeToMinutes(BOOKING_WINDOW_START)) {
    return { ok: false, field: "end", code: "OUTSIDE_WINDOW" };
  }
  if (end <= start) return { ok: false, field: "end", code: "END_NOT_AFTER_START" };
  const minutes = end - start;
  if (minutes < MIN_BOOKING_MINUTES) return { ok: false, field: "end", code: "TOO_SHORT" };
  if (minutes > MAX_BOOKING_MINUTES) return { ok: false, field: "end", code: "TOO_LONG" };
  return { ok: true, minutes };
}

// ---- derived booking state (AD-16) ----

export const BOOKING_STATUSES = ["pending", "confirmed", "rejected", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
/** The one list of statuses that block a slot. */
export const BLOCKING_STATUSES = [
  "pending",
  "confirmed",
] as const satisfies readonly BookingStatus[];

export function isBlocking(status: BookingStatus): boolean {
  return status === "pending" || status === "confirmed";
}

/** A pending request whose start has passed (CR-3). */
export function isExpired(status: BookingStatus, startMs: number, nowMs: number): boolean {
  return status === "pending" && startMs <= nowMs;
}

/** Kommende: pending or confirmed and not yet started. */
export function isUpcoming(status: BookingStatus, startMs: number, nowMs: number): boolean {
  return isBlocking(status) && startMs > nowMs;
}

/** Half-open interval overlap: 10:00–11:00 and 11:00–12:00 do not overlap. */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function canCancel(status: BookingStatus, startMs: number, nowMs: number): boolean {
  return isBlocking(status) && startMs > nowMs;
}

export function canApprove(status: BookingStatus, startMs: number, nowMs: number): boolean {
  return status === "pending" && startMs > nowMs;
}

// ---- 30-day horizon and 7-day window (AD-5, DEC-04, DEC-09) ----

/** Create, cancel and approve need `start > now`. */
export function isInFuture(startMs: number, nowMs: number): boolean {
  return startMs > nowMs;
}

/** A booking may start up to and including `now + 30 × 24 h`. */
export function isWithinHorizon(startMs: number, nowMs: number): boolean {
  return startMs <= nowMs + BOOKING_HORIZON_MS;
}

/** The latest Oslo date on which a booking can still start; the date picker's `max` (AD-22). */
export function lastBookableDate(nowMs: number): string {
  return osloDate(nowMs + BOOKING_HORIZON_MS);
}

/** The Oslo date of `now`; the date picker's `min`. */
export function firstBookableDate(nowMs: number): string {
  return osloDate(nowMs);
}

/** The dashboard window: `end > now AND start < now + 7 × 24 h`, both boundaries excluded. */
export function isInDashboardWindow(startMs: number, endMs: number, nowMs: number): boolean {
  return endMs > nowMs && startMs < nowMs + DASHBOARD_WINDOW_MS;
}

// ---- text normalisers (AD-2, AD-11, AD-16) ----

/** Trim, NFKC, lower-case: the only e-mail normaliser (login, throttle key, seed). */
export function normaliseEmail(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase();
}

/**
 * Search folding for nb-NO: NFKC, lower-case, whitespace collapsed, and diacritics removed except
 * the letters æ, ø and å, which are distinct letters in Norwegian.
 */
export function normaliseSearch(value: string): string {
  const decomposed = value.normalize("NFKC").trim().toLowerCase().normalize("NFD");
  let folded = "";
  let previous = "";
  for (const char of decomposed) {
    const code = char.codePointAt(0) ?? 0;
    const isMark = code >= 0x0300 && code <= 0x036f;
    if (!isMark) {
      folded += char;
    } else if (code === 0x030a && previous === "a") {
      folded += char; // keep a + ring above (å)
    }
    previous = char;
  }
  return folded.normalize("NFC").replace(/\s+/g, " ");
}

const nbCollator = new Intl.Collator("nb-NO");

/**
 * The one text order of FELLES: nb-NO collation (Æ < Ø < Å) with `id` as the final tie-break so the
 * order is total even when names repeat (AD-16).
 */
export function compareNb(a: string, b: string, aId = 0, bId = 0): number {
  const byText = nbCollator.compare(a, b);
  return byText !== 0 ? byText : aId - bId;
}
