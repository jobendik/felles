import { describe, expect, it } from "vitest";
import {
  anonymousBlockSchema,
  detailBlockSchema,
  scheduleBlockSchema,
  scheduleQuerySchema,
  scheduleSchema,
} from "../src/index";
import { SAMPLE_BLOCKS, SAMPLE_SCHEDULE } from "./samples";

describe("schedule contracts (draft, S03)", () => {
  it("[VIS-01] a block is a detail | anonymous union discriminated by kind (@1.4)", () => {
    expect(scheduleSchema.safeParse(SAMPLE_SCHEDULE).success).toBe(true);
    expect(scheduleBlockSchema.safeParse(SAMPLE_BLOCKS[0]).success).toBe(true);
    expect(scheduleBlockSchema.safeParse(SAMPLE_BLOCKS[1]).success).toBe(true);
    expect(scheduleBlockSchema.safeParse({ kind: "other" }).success).toBe(false);
  });

  it("[VIS-01] the anonymous block has exactly status and interval, never an id, user or purpose (@1.4)", () => {
    expect(Object.keys(anonymousBlockSchema.shape).sort()).toEqual([
      "end",
      "kind",
      "start",
      "status",
    ]);
    const leaky = { ...SAMPLE_BLOCKS[1], bookingId: 1, purpose: "Hemmelig", bookerName: "Ingrid" };
    expect(anonymousBlockSchema.safeParse(leaky).success).toBe(false);
    expect(scheduleBlockSchema.safeParse(leaky).success).toBe(false);
    expect(
      anonymousBlockSchema.safeParse({ ...SAMPLE_BLOCKS[1], status: "cancelled" }).success,
    ).toBe(false);
    expect(detailBlockSchema.safeParse({ ...SAMPLE_BLOCKS[0], status: "rejected" }).success).toBe(
      false,
    );
  });

  it("[VIS-01] the query needs an Oslo civil date and 1 to 7 days (default 7) (@1.4)", () => {
    expect(scheduleQuerySchema.parse({ from: "2026-10-19" })).toEqual({
      from: "2026-10-19",
      days: 7,
    });
    expect(scheduleQuerySchema.parse({ from: "2026-10-19", days: "1" }).days).toBe(1);
    for (const bad of [
      { from: "2026-10-19", days: "0" },
      { from: "2026-10-19", days: "8" },
      { from: "19.10.2026" },
      { from: "2026-02-30" },
      {},
    ]) {
      expect(scheduleQuerySchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});
