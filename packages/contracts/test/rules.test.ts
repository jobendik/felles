import { describe, expect, it } from "vitest";
import {
  BOOKING_HORIZON_MS,
  DASHBOARD_WINDOW_MS,
  canApprove,
  canCancel,
  checkBookingTimes,
  compareNb,
  isExpired,
  isInDashboardWindow,
  isUpcoming,
  isWithinHorizon,
  lastBookableDate,
  normaliseEmail,
  normaliseSearch,
  overlaps,
  type BookingStatus,
} from "../src/index";

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 9, 19, 7, 0, 0);

describe("booking time rules on civil strings", () => {
  it("[BOK-02] accepts the whole window on the grid, 30 minutes to 4 hours (@1.2)", () => {
    expect(checkBookingTimes({ start: "08:00", end: "08:30" })).toEqual({ ok: true, minutes: 30 });
    expect(checkBookingTimes({ start: "10:00", end: "14:00" })).toEqual({ ok: true, minutes: 240 });
    expect(checkBookingTimes({ start: "21:30", end: "22:00" })).toEqual({ ok: true, minutes: 30 });
  });

  it("[BOK-02] refuses 07:30 and 22:30 as outside the 08:00–22:00 window (@1.2)", () => {
    expect(checkBookingTimes({ start: "07:30", end: "09:00" })).toMatchObject({
      ok: false,
      field: "start",
      code: "OUTSIDE_WINDOW",
    });
    expect(checkBookingTimes({ start: "22:30", end: "23:00" })).toMatchObject({
      ok: false,
      code: "OUTSIDE_WINDOW",
    });
    expect(checkBookingTimes({ start: "21:00", end: "22:30" })).toMatchObject({
      ok: false,
      field: "end",
      code: "OUTSIDE_WINDOW",
    });
    expect(checkBookingTimes({ start: "22:00", end: "22:30" })).toMatchObject({
      ok: false,
      code: "OUTSIDE_WINDOW",
    });
  });

  it("[BOK-02] refuses 08:15 as off the :00/:30 grid and malformed times (@1.2)", () => {
    expect(checkBookingTimes({ start: "08:15", end: "09:00" })).toMatchObject({
      ok: false,
      field: "start",
      code: "OFF_GRID",
    });
    expect(checkBookingTimes({ start: "09:00", end: "10:10" })).toMatchObject({
      ok: false,
      field: "end",
      code: "OFF_GRID",
    });
    expect(checkBookingTimes({ start: "9:00", end: "10:00" })).toMatchObject({
      ok: false,
      code: "INVALID_TIME",
    });
    expect(checkBookingTimes({ start: "09:00:30", end: "10:00" })).toMatchObject({
      ok: false,
      code: "INVALID_TIME",
    });
    expect(checkBookingTimes({ start: "24:00", end: "10:00" })).toMatchObject({
      ok: false,
      code: "INVALID_TIME",
    });
  });

  it("[BOK-02] refuses 4 h 30 min as too long and 30 min less one slot as too short (@1.2)", () => {
    expect(checkBookingTimes({ start: "09:00", end: "13:30" })).toMatchObject({
      ok: false,
      field: "end",
      code: "TOO_LONG",
    });
    expect(checkBookingTimes({ start: "09:00", end: "13:00" })).toEqual({ ok: true, minutes: 240 });
  });

  it("[BOK-02] refuses equal start and end and an end before the start (@1.2)", () => {
    expect(checkBookingTimes({ start: "10:00", end: "10:00" })).toMatchObject({
      ok: false,
      code: "END_NOT_AFTER_START",
    });
    expect(checkBookingTimes({ start: "11:00", end: "10:00" })).toMatchObject({
      ok: false,
      code: "END_NOT_AFTER_START",
    });
    expect(checkBookingTimes({ start: "08:00", end: "08:00" })).toMatchObject({
      ok: false,
      code: "END_NOT_AFTER_START",
    });
  });
});

describe("derived booking state", () => {
  const statuses: BookingStatus[] = ["pending", "confirmed", "rejected", "cancelled"];

  it("[BR-3] isExpired is pending and start <= now, at start == now and now ± 1 ms (@1.2)", () => {
    expect(isExpired("pending", NOW, NOW)).toBe(true);
    expect(isExpired("pending", NOW - 1, NOW)).toBe(true);
    expect(isExpired("pending", NOW + 1, NOW)).toBe(false);
    for (const status of statuses.filter((s) => s !== "pending")) {
      expect(isExpired(status, NOW - HOUR, NOW)).toBe(false);
    }
  });

  it("[BR-3] isUpcoming needs pending or confirmed and start > now (@1.2)", () => {
    expect(isUpcoming("pending", NOW + 1, NOW)).toBe(true);
    expect(isUpcoming("confirmed", NOW + 1, NOW)).toBe(true);
    expect(isUpcoming("confirmed", NOW, NOW)).toBe(false);
    expect(isUpcoming("rejected", NOW + HOUR, NOW)).toBe(false);
    expect(isUpcoming("cancelled", NOW + HOUR, NOW)).toBe(false);
  });

  it("[BR-3] canCancel and canApprove follow the status and start > now (@1.2)", () => {
    expect(canCancel("pending", NOW + 1, NOW)).toBe(true);
    expect(canCancel("confirmed", NOW + 1, NOW)).toBe(true);
    expect(canCancel("confirmed", NOW, NOW)).toBe(false);
    expect(canCancel("cancelled", NOW + HOUR, NOW)).toBe(false);
    expect(canApprove("pending", NOW + 1, NOW)).toBe(true);
    expect(canApprove("pending", NOW, NOW)).toBe(false);
    expect(canApprove("confirmed", NOW + HOUR, NOW)).toBe(false);
  });

  it("[BOK-03] overlaps is half-open so 10:00–11:00 and 11:00–12:00 do not overlap (@1.2)", () => {
    const ten = 10 * HOUR;
    expect(overlaps(ten, 11 * HOUR, 11 * HOUR, 12 * HOUR)).toBe(false);
    expect(overlaps(11 * HOUR, 12 * HOUR, ten, 11 * HOUR)).toBe(false);
    expect(overlaps(ten, 11 * HOUR, 10.5 * HOUR, 11.5 * HOUR)).toBe(true);
    expect(overlaps(ten, 12 * HOUR, 10.5 * HOUR, 11 * HOUR)).toBe(true);
  });
});

describe("30 × 24 h horizon and 7 × 24 h window", () => {
  it("[BOK-02] accepts a start at exactly now + 30 × 24 h and refuses one millisecond later (@1.2)", () => {
    expect(BOOKING_HORIZON_MS).toBe(30 * 24 * HOUR);
    expect(isWithinHorizon(NOW + BOOKING_HORIZON_MS, NOW)).toBe(true);
    expect(isWithinHorizon(NOW + BOOKING_HORIZON_MS + 1, NOW)).toBe(false);
  });

  it("[BR-1] the last bookable date for the frozen test clock is 2026-11-18 (@1.2)", () => {
    // The last bookable start is 2026-11-18 08:00 Oslo, one hour short of 30 calendar days (DST switch).
    expect(lastBookableDate(NOW)).toBe("2026-11-18");
  });

  it("[VIS-04] the 7 × 24 h window excludes both boundaries (@1.2)", () => {
    expect(DASHBOARD_WINDOW_MS).toBe(7 * 24 * HOUR);
    expect(isInDashboardWindow(NOW + 1000, NOW + 2000, NOW)).toBe(true);
    expect(isInDashboardWindow(NOW - HOUR, NOW, NOW)).toBe(false); // end == now
    expect(isInDashboardWindow(NOW - HOUR, NOW + 1, NOW)).toBe(true);
    expect(
      isInDashboardWindow(NOW + DASHBOARD_WINDOW_MS, NOW + DASHBOARD_WINDOW_MS + HOUR, NOW),
    ).toBe(false);
    expect(
      isInDashboardWindow(NOW + DASHBOARD_WINDOW_MS - 1, NOW + DASHBOARD_WINDOW_MS + HOUR, NOW),
    ).toBe(true);
  });
});

describe("normalisers and ordering", () => {
  it("[AUT-01] normaliseEmail trims, applies NFKC and lower-cases (@1.2)", () => {
    expect(normaliseEmail("  Sofie.Lund@Felles.Example ")).toBe("sofie.lund@felles.example");
    expect(normaliseEmail("ＡＢＣ@Felles.example")).toBe("abc@felles.example");
    expect(normaliseEmail("　x@y.no　")).toBe("x@y.no");
  });

  it("[RES-01] normaliseSearch folds case and diacritics but keeps æ, ø and å (@1.2)", () => {
    expect(normaliseSearch("  MØTEROM   Fjellet ")).toBe("møterom fjellet");
    expect(normaliseSearch("Åpent rom")).toBe("åpent rom");
    expect(normaliseSearch("Ærlig")).toBe("ærlig");
    expect(normaliseSearch("Café Zürich")).toBe("cafe zurich");
    expect(normaliseSearch("ＡＢＣ")).toBe("abc");
  });

  it("[VIS-04] compareNb orders Æ < Ø < Å, treats Aa as Å, and breaks ties by id (@1.2)", () => {
    const names = ["Åpent rom", "Zebra", "Øst", "Ærlig", "Aa-rom", "aula", "Aula"];
    const sorted = [...names].sort((a, b) => compareNb(a, b));
    expect(sorted).toEqual(["aula", "Aula", "Zebra", "Ærlig", "Øst", "Aa-rom", "Åpent rom"]);
    expect(compareNb("Æ", "Ø")).toBeLessThan(0);
    expect(compareNb("Ø", "Å")).toBeLessThan(0);
    expect(compareNb("Møterom", "Møterom", 1, 2)).toBeLessThan(0);
    expect(compareNb("Møterom", "Møterom", 2, 1)).toBeGreaterThan(0);
    expect(compareNb("Møterom", "Møterom", 3, 3)).toBe(0);
  });
});
