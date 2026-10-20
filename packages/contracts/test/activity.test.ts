import { describe, expect, it } from "vitest";
import {
  ACTIVITY_TYPES,
  activityEventInputSchema,
  activityItemSchema,
  listActivityQuerySchema,
  listActivityResponseSchema,
} from "../src/index";
import { SAMPLE_EVENT } from "./samples";

const PAYLOADS: Record<string, unknown> = {
  "booking.created": { status: "pending" },
  "booking.approved": {},
  "booking.rejected": { reason: "Utstyret er på service" },
  "booking.cancelled": { reason: null, byRole: "member" },
  "resource.created": { name: "Fjellet" },
  "resource.updated": { changes: [{ field: "name", from: "Fjell", to: "Fjellet" }] },
  "resource.archived": {},
};

describe("activity contracts (draft, S03)", () => {
  it("[VIS-05] every event type has a typed payload and parses as an item and as writer input (@1.4)", () => {
    expect(Object.keys(PAYLOADS).sort()).toEqual([...ACTIVITY_TYPES].sort());
    for (const type of ACTIVITY_TYPES) {
      const item = { ...SAMPLE_EVENT, type, payload: PAYLOADS[type] };
      expect(activityItemSchema.safeParse(item).success, type).toBe(true);
      expect(
        activityEventInputSchema.safeParse({ type, payload: PAYLOADS[type] }).success,
        type,
      ).toBe(true);
    }
  });

  it("[BR-5] payloads never contain purpose and reject unknown keys (@1.4)", () => {
    expect(
      activityItemSchema.safeParse({
        ...SAMPLE_EVENT,
        payload: { status: "pending", purpose: "Hemmelig" },
      }).success,
    ).toBe(false);
    expect(
      activityEventInputSchema.safeParse({
        type: "booking.rejected",
        payload: { reason: "x", purpose: "y" },
      }).success,
    ).toBe(false);
    expect(
      activityEventInputSchema.safeParse({ type: "booking.rejected", payload: {} }).success,
    ).toBe(false);
    expect(
      activityEventInputSchema.safeParse({ type: "booking.exploded", payload: {} }).success,
    ).toBe(false);
    expect(
      activityEventInputSchema.safeParse({ type: "resource.updated", payload: { changes: [] } })
        .success,
    ).toBe(false);
  });

  it("[VIS-05] the list uses an event-id cursor, default 20, max 100, and answers { items, nextBefore } (@1.4)", () => {
    expect(listActivityQuerySchema.parse({})).toEqual({ limit: 20 });
    expect(listActivityQuerySchema.parse({ before: "40", limit: "100", bookingId: "7" })).toEqual({
      before: 40,
      limit: 100,
      bookingId: 7,
    });
    expect(listActivityQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(listActivityQuerySchema.safeParse({ before: "yesterday" }).success).toBe(false);
    expect(
      listActivityResponseSchema.safeParse({ items: [SAMPLE_EVENT], nextBefore: 41 }).success,
    ).toBe(true);
    expect(listActivityResponseSchema.safeParse({ items: [], nextBefore: null }).success).toBe(
      true,
    );
  });
});
