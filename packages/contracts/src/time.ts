// Oslo time helpers that use `Intl` only (AD-5), so the web bundle never contains Temporal.
// Converting local Oslo wall-clock time to an instant is the server's job (platform/oslo-time.ts);
// this module only reads instants as Oslo parts and does calendar arithmetic on civil dates.

export const OSLO_TIME_ZONE = "Europe/Oslo";

export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;
/** "30 døgn" is 30 × 24 h, boundary inclusive (AD-5, DEC-09). */
export const BOOKING_HORIZON_MS = 30 * DAY_MS;
/** The dashboard window is 7 × 24 h, both boundaries excluded (DEC-04). */
export const DASHBOARD_WINDOW_MS = 7 * DAY_MS;

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: OSLO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export interface OsloParts {
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:mm` */
  time: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** Milliseconds within the second, 0..999. */
  millisecond: number;
}

/** Reads an instant (epoch milliseconds) as Oslo civil parts. */
export function osloParts(ms: number): OsloParts {
  if (!Number.isFinite(ms)) throw new RangeError("osloParts needs a finite instant");
  const values: Record<string, number> = {};
  for (const part of partsFormat.formatToParts(ms)) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  const year = values.year ?? 0;
  const month = values.month ?? 0;
  const day = values.day ?? 0;
  const hour = values.hour ?? 0;
  const minute = values.minute ?? 0;
  const second = values.second ?? 0;
  const millisecond = ((Math.floor(ms) % 1000) + 1000) % 1000;
  return {
    date: `${pad(year, 4)}-${pad(month)}-${pad(day)}`,
    time: `${pad(hour)}:${pad(minute)}`,
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
  };
}

/** The Oslo civil date (`YYYY-MM-DD`) of an instant. */
export function osloDate(ms: number): string {
  return osloParts(ms).date;
}

/**
 * A fixed-width Oslo civil timestamp `YYYY-MM-DDTHH:mm:ss.SSS`. Two of them compare correctly as
 * strings, which is how the browser compares slot starts with `now` without converting local time
 * to UTC (AD-5).
 */
export function osloCivil(ms: number): string {
  const p = osloParts(ms);
  return `${p.date}T${p.time}:${pad(p.second)}.${pad(p.millisecond, 3)}`;
}

/** Instants as ISO 8601 UTC with milliseconds and `Z`, the wire format. */
export function toIsoUtc(ms: number): string {
  return new Date(ms).toISOString();
}

export function parseIsoUtc(iso: string): number {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) throw new RangeError(`Not an instant: ${iso}`);
  return ms;
}

const CIVIL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True when the string is a real calendar date written as `YYYY-MM-DD`. */
export function isCivilDate(value: string): boolean {
  const match = CIVIL_DATE.exec(value);
  if (match === null) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year, month);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Pure calendar arithmetic on civil dates; no time zone is involved. */
export function addCivilDays(date: string, days: number): string {
  if (!isCivilDate(date)) throw new RangeError(`Not a civil date: ${date}`);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${pad(shifted.getUTCFullYear(), 4)}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** 0 = Monday … 6 = Sunday. */
export function civilWeekday(date: string): number {
  if (!isCivilDate(date)) throw new RangeError(`Not a civil date: ${date}`);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (jsDay + 6) % 7;
}

/** The Monday of the week that contains the civil date (`uke=` in the URL, AD-21). */
export function mondayOf(date: string): string {
  return addCivilDays(date, -civilWeekday(date));
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}
