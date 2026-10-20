// Pure shared rules (AD-2, AD-5, AD-16): booking time rules on civil strings, derived booking state,
// the 30- and 7-day arithmetic and the text normalisers. No I/O, no Temporal, no app imports.
import { z } from "zod";
import { BOOKING_HORIZON_MS, DASHBOARD_WINDOW_MS, isCivilDate, osloDate } from "./time";

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

/**
 * Create, cancel and approve need `start > now`. Jo approved this strict reading at Gate S00-CP (2026-10-19) as an
 * intentional deviation from PRD DEC-08, whose default is `start >= now`; `isExpired` (`start <= now`) is its complement.
 */
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

// ---- request text hygiene (AD-2, BR-4) ----

/** C0 and C1 control characters, including tab and newline: every FELLES text field is single-line. */
// eslint-disable-next-line no-control-regex -- matching control characters is the point of this rule
export const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/;
/** Bidirectional override and isolate characters. */
export const BIDI_CHARACTERS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/;

export const TEXT_LIMITS = {
  email: 254,
  name: 80,
  description: 500,
  purpose: 200,
  reason: 200,
  location: 80,
  search: 80,
} as const;

/**
 * Free text: control and bidi characters are rejected, then the value is NFC-normalised and trimmed, then
 * the maximum is enforced on the cleaned value. An empty result fails `required`.
 */
export function requiredText(max: number) {
  return z
    .string()
    .refine((value) => !CONTROL_CHARACTERS.test(value), { error: "Ugyldige tegn." })
    .refine((value) => !BIDI_CHARACTERS.test(value), { error: "Ugyldige tegn." })
    .normalize("NFC")
    .trim()
    .min(1)
    .max(max);
}

/** Optional text: an empty or whitespace-only value becomes `null`; omission means no value (or unchanged on PATCH). */
export function optionalText(max: number) {
  return z
    .string()
    .refine((value) => !CONTROL_CHARACTERS.test(value), { error: "Ugyldige tegn." })
    .refine((value) => !BIDI_CHARACTERS.test(value), { error: "Ugyldige tegn." })
    .normalize("NFC")
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();
}

/** A bodyless mutation declares this body; the client sends `{}` and any key is `VALIDATION_FAILED` (AD-13). */
export const emptyBody = z.strictObject({});

/** `limit`: default 100, maximum 200, for every list except activity (AD-16). */
export const listLimit = z.coerce.number().int().min(1).max(200).default(100);

export const idSchema = z.number().int().positive();
export const idParam = z.strictObject({ id: z.coerce.number().int().positive() });

export const isoInstantSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
export const civilDateSchema = z
  .string()
  .regex(CIVIL_DATE_PATTERN)
  .refine((value) => isCivilDate(value), { error: "Ugyldig dato." });
/** An `HH:mm` on the :00/:30 grid; a refusal carries the field code OFF_GRID or INVALID_TIME. */
export const civilTimeSchema = z.string().check((ctx) => {
  const code = checkTimeShape(ctx.value);
  if (code !== null) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "Ugyldig klokkeslett.",
      params: { fieldCode: code },
    });
  }
});
