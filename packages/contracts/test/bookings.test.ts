import { describe, expect, it } from "vitest";
import {
  approveBookingInputSchema,
  bookingDetailSchema,
  bookingSchema,
  cancelBookingInputSchema,
  createBookingInputSchema,
  listBookingsQuerySchema,
  rejectBookingInputSchema,
  toFieldErrors,
} from "../src/index";
import {
  SAMPLE_BOOKING,
  SAMPLE_BOOKING_CANCELLED,
  SAMPLE_BOOKING_CONFIRMED,
  SAMPLE_BOOKING_DETAIL,
  SAMPLE_BOOKING_REJECTED,
  SAMPLE_CREATE_BOOKING,
} from "./samples";

describe("booking contracts", () => {
  it("[BOK-05] BookingDto carries the four stored statuses, expired, decision and cancellation (@1.4)", () => {
    for (const sample of [
      SAMPLE_BOOKING,
      SAMPLE_BOOKING_CONFIRMED,
      SAMPLE_BOOKING_CANCELLED,
      SAMPLE_BOOKING_REJECTED,
    ]) {
      expect(bookingSchema.safeParse(sample).success, sample.status).toBe(true);
    }
    expect(bookingSchema.safeParse({ ...SAMPLE_BOOKING, status: "expired" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...SAMPLE_BOOKING, expired: undefined }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...SAMPLE_BOOKING, reason: "generic" }).success).toBe(false);
    expect(Object.keys(bookingSchema.shape).sort()).toEqual(
      [
        "booker",
        "cancellation",
        "createdAt",
        "decision",
        "end",
        "expired",
        "id",
        "purpose",
        "resource",
        "start",
        "status",
        "userId",
      ].sort(),
    );
  });

  it("[VIS-02] the detail embeds the events as a plain array (@1.4)", () => {
    expect(bookingDetailSchema.safeParse(SAMPLE_BOOKING_DETAIL).success).toBe(true);
    expect(bookingDetailSchema.safeParse({ ...SAMPLE_BOOKING, events: "none" }).success).toBe(
      false,
    );
  });

  it("[BOK-02] the create input runs the time rules on the civil strings with field-named paths (@1.4)", () => {
    expect(createBookingInputSchema.safeParse(SAMPLE_CREATE_BOOKING).success).toBe(true);
    const cases: [Record<string, string | number>, string, string][] = [
      [{ start: "07:30" }, "start", "OUTSIDE_WINDOW"],
      [{ start: "08:15" }, "start", "OFF_GRID"],
      [{ end: "10:00" }, "end", "END_NOT_AFTER_START"],
      [{ start: "09:00", end: "13:30" }, "end", "TOO_LONG"],
      [{ end: "22:30" }, "end", "OUTSIDE_WINDOW"],
      [{ date: "2026-02-30" }, "date", "INVALID"],
      [{ date: "2026-10-19T10:00" }, "date", "INVALID"],
      [{ purpose: "" }, "purpose", "REQUIRED"],
      [{ purpose: "x".repeat(201) }, "purpose", "TOO_LONG_TEXT"],
    ];
    for (const [patch, path, code] of cases) {
      const result = createBookingInputSchema.safeParse({ ...SAMPLE_CREATE_BOOKING, ...patch });
      expect(result.success, JSON.stringify(patch)).toBe(false);
      if (!result.success) {
        const errors = toFieldErrors(result.error.issues as never);
        expect(
          errors.map((e) => `${e.path}:${e.code}`),
          JSON.stringify(patch),
        ).toContain(`${path}:${code}`);
      }
    }
    for (const owned of ["userId", "status", "createdAt"]) {
      expect(
        createBookingInputSchema.safeParse({ ...SAMPLE_CREATE_BOOKING, [owned]: 1 }).success,
        owned,
      ).toBe(false);
    }
  });

  it("[BOK-02] time rule messages come from the catalogue (@1.4)", () => {
    const result = createBookingInputSchema.safeParse({
      ...SAMPLE_CREATE_BOOKING,
      start: "09:00",
      end: "13:30",
    });
    expect(result.success ? [] : toFieldErrors(result.error.issues as never)).toEqual([
      { path: "end", code: "TOO_LONG", message: "Maks 4 timer." },
    ]);
  });

  it("[BOK-06] cancel takes an optional reason, reject requires one, approve takes nothing (@1.4)", () => {
    expect(cancelBookingInputSchema.parse({})).toEqual({});
    expect(cancelBookingInputSchema.parse({ reason: "" })).toEqual({ reason: null });
    expect(cancelBookingInputSchema.safeParse({ reason: "x".repeat(201) }).success).toBe(false);
    expect(rejectBookingInputSchema.safeParse({}).success).toBe(false);
    expect(rejectBookingInputSchema.safeParse({ reason: "   " }).success).toBe(false);
    expect(rejectBookingInputSchema.parse({ reason: " Utstyret er på service " })).toEqual({
      reason: "Utstyret er på service",
    });
    expect(approveBookingInputSchema.safeParse({}).success).toBe(true);
    expect(approveBookingInputSchema.safeParse({ reason: "x" }).success).toBe(false);
  });

  it("[BOK-08] the list query: scope defaults to mine, repeated status, expired, no user filter (@1.4)", () => {
    expect(listBookingsQuerySchema.parse({})).toEqual({ scope: "mine", limit: 100 });
    expect(
      listBookingsQuerySchema.parse({
        scope: "all",
        group: "past",
        status: ["pending", "confirmed"],
        expired: "true",
        resourceId: "3",
      }),
    ).toEqual({
      scope: "all",
      group: "past",
      status: ["pending", "confirmed"],
      expired: true,
      resourceId: 3,
      limit: 100,
    });
    expect(listBookingsQuerySchema.parse({ status: "pending" }).status).toEqual(["pending"]);
    expect(listBookingsQuerySchema.safeParse({ userId: "3" }).success).toBe(false);
    expect(listBookingsQuerySchema.safeParse({ status: "expired" }).success).toBe(false);
  });
});
