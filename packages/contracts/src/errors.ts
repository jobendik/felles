// Error codes, HTTP status mapping, typed details and the approved Norwegian message catalogue
// (AD-4, DEC-16 as extended; texts from architecture approved-copy.md, approved by Jo 2026-10-19).
import { z } from "zod";
import type { BookingStatus, BookingTimeViolation } from "./rules";

export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "INVALID_CREDENTIALS",
  "FORBIDDEN",
  "OWN_REQUEST",
  "ORIGIN_REFUSED",
  "HOST_REFUSED",
  "NOT_FOUND",
  "BOOKING_CONFLICT",
  "BOOKING_NOT_PENDING",
  "BOOKING_NOT_CANCELLABLE",
  "BOOKING_STARTED",
  "RESOURCE_ARCHIVED",
  "RESOURCE_HAS_FUTURE_BOOKINGS",
  "RATE_LIMITED",
  "DATABASE_BUSY",
  "INTERNAL",
  "NOT_IMPLEMENTED",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_STATUS: Record<
  ErrorCode,
  400 | 401 | 403 | 404 | 409 | 421 | 429 | 500 | 501 | 503
> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  OWN_REQUEST: 403,
  ORIGIN_REFUSED: 403,
  HOST_REFUSED: 421,
  NOT_FOUND: 404,
  BOOKING_CONFLICT: 409,
  BOOKING_NOT_PENDING: 409,
  BOOKING_NOT_CANCELLABLE: 409,
  BOOKING_STARTED: 409,
  RESOURCE_ARCHIVED: 409,
  RESOURCE_HAS_FUTURE_BOOKINGS: 409,
  RATE_LIMITED: 429,
  DATABASE_BUSY: 503,
  INTERNAL: 500,
  NOT_IMPLEMENTED: 501,
};

/** Typed `details` per code; `undefined` means the code carries none. */
export interface ErrorDetailsMap {
  VALIDATION_FAILED: undefined;
  UNAUTHENTICATED: undefined;
  /** The 5th consecutive failure adds `retryAfterSeconds` (AD-12). */
  INVALID_CREDENTIALS: { retryAfterSeconds: number } | undefined;
  FORBIDDEN: undefined;
  OWN_REQUEST: undefined;
  ORIGIN_REFUSED: undefined;
  HOST_REFUSED: undefined;
  NOT_FOUND: undefined;
  BOOKING_CONFLICT: undefined;
  BOOKING_NOT_PENDING: { currentStatus: BookingStatus };
  BOOKING_NOT_CANCELLABLE: { currentStatus: BookingStatus };
  /** `action` selects the approved wording (approve or cancel). */
  BOOKING_STARTED: { currentStatus: BookingStatus; action: "approve" | "cancel" };
  RESOURCE_ARCHIVED: undefined;
  RESOURCE_HAS_FUTURE_BOOKINGS: { futureBookingCount: number; firstFutureBookingAt: string };
  RATE_LIMITED: { retryAfterSeconds: number };
  DATABASE_BUSY: undefined;
  INTERNAL: undefined;
  NOT_IMPLEMENTED: undefined;
}

type MessageEntry<C extends ErrorCode> = string | ((details: ErrorDetailsMap[C]) => string);

/** The approved Norwegian bokmål message per code (count-bearing ones are functions of `details`). */
export const messagesNb: { [C in ErrorCode]: MessageEntry<C> } = {
  VALIDATION_FAILED: "Sjekk feltene og prøv igjen.",
  UNAUTHENTICATED: "Økten er utløpt. Logg inn på nytt.",
  INVALID_CREDENTIALS: "Feil e-post eller passord.",
  FORBIDDEN: "Ingen tilgang.",
  OWN_REQUEST: "Du kan ikke behandle din egen forespørsel.",
  ORIGIN_REFUSED: "Forespørselen ble avvist av sikkerhetshensyn. Last inn siden på nytt.",
  HOST_REFUSED: "Adressen er ikke tillatt. Åpne FELLES via localhost.",
  NOT_FOUND: "Fant ikke det du lette etter.",
  BOOKING_CONFLICT: "Tidsrommet er ikke lenger ledig. Velg et annet tidspunkt.",
  BOOKING_NOT_PENDING: "Forespørselen er allerede behandlet.",
  BOOKING_NOT_CANCELLABLE: "Bookingen er allerede avbestilt eller avslått og kan ikke avbestilles.",
  BOOKING_STARTED: (details) =>
    details.action === "approve"
      ? "Forespørselen har allerede startet og kan ikke godkjennes. Du kan fortsatt avslå den."
      : "Bookingen har allerede startet og kan ikke avbestilles.",
  RESOURCE_ARCHIVED: "Ressursen er ikke lenger tilgjengelig.",
  RESOURCE_HAS_FUTURE_BOOKINGS: (details) =>
    details.futureBookingCount === 1
      ? "Ressursen har 1 fremtidig booking og kan ikke arkiveres."
      : `Ressursen har ${details.futureBookingCount} fremtidige bookinger og kan ikke arkiveres.`,
  RATE_LIMITED: (details) =>
    details.retryAfterSeconds === 1
      ? "For mange forsøk. Prøv igjen om 1 sekund."
      : `For mange forsøk. Prøv igjen om ${details.retryAfterSeconds} sekunder.`,
  DATABASE_BUSY: "Databasen er opptatt. Prøv igjen om et øyeblikk.",
  INTERNAL: "Noe gikk galt hos oss. Prøv igjen.",
  NOT_IMPLEMENTED: "Funksjonen er ikke ferdig ennå.",
};

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

export function messageFor<C extends ErrorCode>(code: C, details?: ErrorDetailsMap[C]): string {
  const entry = messagesNb[code] as MessageEntry<C>;
  return typeof entry === "string" ? entry : entry(details as ErrorDetailsMap[C]);
}

// ---- field errors ----

/** Field-level codes: the shared booking time rules plus the generic validation outcomes. */
export const FIELD_ERROR_CODES = [
  "REQUIRED",
  "TOO_LONG_TEXT",
  "INVALID",
  "INVALID_TIME",
  "OFF_GRID",
  "OUTSIDE_WINDOW",
  "END_NOT_AFTER_START",
  "TOO_SHORT",
  "TOO_LONG",
  "IN_PAST",
  "BEYOND_HORIZON",
] as const;
export type FieldErrorCode = (typeof FIELD_ERROR_CODES)[number];

/**
 * Field messages. "Maks 200 tegn." and "Maks 4 timer." are fixed by EXPERIENCE.md (DEC-14); the
 * other texts are proposals recorded as open questions for Gate S00-CP (docs/s00-open-design-questions.md).
 */
export function fieldMessageNb(code: FieldErrorCode, limit?: number): string {
  switch (code) {
    case "REQUIRED":
      return "Må fylles ut.";
    case "TOO_LONG_TEXT":
      return `Maks ${limit ?? 0} tegn.`;
    case "INVALID":
      return "Ugyldig verdi.";
    case "INVALID_TIME":
      return "Velg et gyldig klokkeslett.";
    case "OFF_GRID":
      return "Velg hele eller halve timer.";
    case "OUTSIDE_WINDOW":
      return "Velg et tidspunkt mellom 08:00 og 22:00.";
    case "END_NOT_AFTER_START":
      return "Sluttid må være etter starttid.";
    case "TOO_SHORT":
      return "Minst 30 minutter.";
    case "TOO_LONG":
      return "Maks 4 timer.";
    case "IN_PAST":
      return "Tidspunktet har passert.";
    case "BEYOND_HORIZON":
      return "Du kan booke inntil 30 døgn frem i tid.";
  }
}

export function bookingTimeViolationMessage(code: BookingTimeViolation): string {
  return fieldMessageNb(code);
}

export interface FieldError {
  /** Equals the form field name: `resourceId`, `date`, `start`, `end`, `purpose`, `reason`. */
  path: string;
  code: FieldErrorCode;
  message: string;
}

export const fieldErrorSchema = z.object({
  path: z.string(),
  code: z.enum(FIELD_ERROR_CODES),
  message: z.string(),
});

/** Every non-2xx response has this shape (AD-4). */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    fieldErrors: z.array(fieldErrorSchema).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

// ---- database trigger messages ----

/** The only trigger message that has a mapped response; any other trigger abort is an internal error. */
export const OVERLAP_TRIGGER_MESSAGE = "BOOKING_OVERLAP";

/** Every stable trigger message written by the S00 migration (docs/schema in the migration files). */
export const TRIGGER_MESSAGES = [
  "BOOKING_OVERLAP",
  "BOOKING_TERMINAL",
  "BOOKING_DECISION_WRITE_ONCE",
  "BOOKING_APPROVER_REQUIRED",
  "BOOKING_ILLEGAL_TRANSITION",
  "BOOKING_IMMUTABLE",
  "BOOKING_NO_DELETE",
  "EVENT_IMMUTABLE",
  "EVENT_NO_DELETE",
  "EVENT_SUBJECT_MISMATCH",
  "RESOURCE_ARCHIVE_FINAL",
  "RESOURCE_NO_DELETE",
] as const;

// ---- Zod error map built from the catalogue ----

type IssueLike = {
  code: string;
  input?: unknown;
  origin?: string;
  maximum?: number | bigint;
  minimum?: number | bigint;
};

/** Installed on both sides with `installErrorMap()` so client and server validation texts cannot diverge. */
export function catalogueErrorMap(issue: IssueLike): string | undefined {
  if (issue.code === "too_big" && issue.origin === "string") {
    return fieldMessageNb("TOO_LONG_TEXT", Number(issue.maximum));
  }
  if (issue.code === "too_small" && issue.origin === "string") {
    return fieldMessageNb("REQUIRED");
  }
  if (issue.code === "invalid_type" && issue.input === undefined) {
    return fieldMessageNb("REQUIRED");
  }
  if (issue.code === "unrecognized_keys") {
    return messageFor("VALIDATION_FAILED");
  }
  return fieldMessageNb("INVALID");
}

export function installErrorMap(): void {
  z.config({ customError: (issue) => catalogueErrorMap(issue as IssueLike) });
}

// ---- Zod issues to field errors ----

type ZodIssueLike = {
  code: string;
  path: ReadonlyArray<PropertyKey>;
  message: string;
  origin?: string;
  maximum?: number | bigint;
  input?: unknown;
  params?: { fieldCode?: FieldErrorCode };
};

/** Maps validation issues to `fieldErrors`; `path` equals the form field name. */
export function toFieldErrors(issues: readonly ZodIssueLike[]): FieldError[] {
  return issues.map((issue) => {
    let code: FieldErrorCode = "INVALID";
    let message = issue.message;
    if (issue.params?.fieldCode !== undefined) {
      code = issue.params.fieldCode;
    } else if (issue.code === "too_big" && issue.origin === "string") {
      code = "TOO_LONG_TEXT";
      message = fieldMessageNb(code, Number(issue.maximum));
    } else if (issue.code === "too_small" && issue.origin === "string") {
      code = "REQUIRED";
      message = fieldMessageNb(code);
    } else if (issue.code === "invalid_type") {
      code = "REQUIRED";
      message = fieldMessageNb(code);
    } else {
      message = fieldMessageNb("INVALID");
    }
    return { path: issue.path.map(String).join("."), code, message };
  });
}
