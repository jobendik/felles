import { describe, expect, it } from "vitest";
import {
  buildSlots,
  freeRanges,
  nextSelection,
  osloNow,
  validateSelection,
  type BlockLike,
} from "../src/index";

// 2026-10-19 07:00Z is Monday 09:00 in Oslo (CEST), the clock of the seeded E2E runs.
const NOW = Date.UTC(2026, 9, 19, 7, 0, 0);
const DATE = "2026-10-19";

function block(startHour: number, startMin: number, endHour: number, endMin: number): BlockLike {
  // Oslo 2026-10-19 is UTC+2.
  return {
    start: new Date(Date.UTC(2026, 9, 19, startHour - 2, startMin)).toISOString(),
    end: new Date(Date.UTC(2026, 9, 19, endHour - 2, endMin)).toISOString(),
  };
}

const states = (slots: ReturnType<typeof buildSlots>) =>
  Object.fromEntries(slots.map((s) => [s.start, s.state]));

describe("slot model", () => {
  it("[BOK-07] builds 28 slots from 08:00 to 22:00 and marks free, taken and past (@1.2)", () => {
    const now = osloNow(NOW + 5 * 60_000); // 09:05
    const slots = buildSlots([block(9, 0, 9, 30)], DATE, now);
    expect(slots).toHaveLength(28);
    expect(slots[0]).toEqual({ start: "08:00", end: "08:30", state: "past" });
    expect(slots[27]).toEqual({ start: "21:30", end: "22:00", state: "free" });
    const s = states(slots);
    expect(s["08:00"]).toBe("past");
    expect(s["08:30"]).toBe("past");
    expect(s["09:00"]).toBe("taken");
    expect(s["09:30"]).toBe("free");
    expect(s["10:00"]).toBe("free");
  });

  it("[BOK-07] a slot that starts exactly at now is past (start must be after now) (@1.2)", () => {
    const slots = buildSlots([], DATE, osloNow(NOW));
    const s = states(slots);
    expect(s["08:30"]).toBe("past");
    expect(s["09:00"]).toBe("past");
    expect(s["09:30"]).toBe("free");
  });

  it("[BOK-07] adjacent blocks leave their neighbouring slots free (@1.2)", () => {
    const now = osloNow(NOW);
    const slots = buildSlots([block(10, 0, 11, 0), block(12, 0, 13, 0)], DATE, now);
    const s = states(slots);
    expect(s["09:30"]).toBe("free");
    expect(s["10:00"]).toBe("taken");
    expect(s["10:30"]).toBe("taken");
    expect(s["11:00"]).toBe("free");
    expect(s["11:30"]).toBe("free");
    expect(s["12:00"]).toBe("taken");
    expect(s["13:00"]).toBe("free");
  });

  it("[BOK-02] slots after now + 30 × 24 h are beyond the horizon (@1.2)", () => {
    // Horizon from the frozen clock: 2026-11-18 08:00 Oslo (30 × 24 h is one hour short of 30 calendar days).
    const now = osloNow(NOW);
    const slots = buildSlots([], "2026-11-18", now);
    const s = states(slots);
    expect(s["08:00"]).toBe("free");
    expect(s["08:30"]).toBe("beyond-horizon");
    expect(s["21:30"]).toBe("beyond-horizon");
    expect(states(buildSlots([], "2026-11-19", now))["08:00"]).toBe("beyond-horizon");
  });

  it("[BOK-07] merges consecutive free slots into ranges (@1.2)", () => {
    const now = osloNow(NOW);
    const slots = buildSlots([block(10, 0, 11, 0)], DATE, now);
    const ranges = freeRanges(slots);
    expect(ranges[0]).toEqual({ start: "09:30", end: "10:00", slots: 1 });
    expect(ranges[1]).toEqual({ start: "11:00", end: "22:00", slots: 22 });
    expect(ranges).toHaveLength(2);
  });
});

describe("slot selection", () => {
  const now = osloNow(NOW);
  const slots = buildSlots([block(12, 0, 13, 0)], DATE, now);

  it("[BOK-07] activating 10:00 alone selects 10:00–10:30; 10:30 next extends it to 11:00 (@1.2)", () => {
    const first = nextSelection(null, "10:00");
    expect(first).toEqual({ startSlot: "10:00", endSlot: "10:00" });
    expect(validateSelection(slots, first!)).toEqual({
      ok: true,
      start: "10:00",
      end: "10:30",
      minutes: 30,
    });
    const second = nextSelection(first, "10:30");
    expect(validateSelection(slots, second!)).toEqual({
      ok: true,
      start: "10:00",
      end: "11:00",
      minutes: 60,
    });
    expect(nextSelection(second, "11:30")).toEqual({ startSlot: "10:00", endSlot: "11:30" });
    expect(nextSelection(second, "10:00")).toBeNull();
  });

  it("[BOK-02] refuses a range that crosses a taken slot (@1.2)", () => {
    expect(validateSelection(slots, { startSlot: "11:30", endSlot: "13:00" })).toEqual({
      ok: false,
      code: "CROSSES_UNAVAILABLE",
    });
    expect(validateSelection(slots, { startSlot: "11:30", endSlot: "11:30" })).toMatchObject({
      ok: true,
    });
  });

  it("[BOK-02] refuses more than 4 hours and an end before the start (@1.2)", () => {
    expect(validateSelection(slots, { startSlot: "10:00", endSlot: "14:00" })).toMatchObject({
      ok: false,
    });
    const longFree = buildSlots([], DATE, now);
    expect(validateSelection(longFree, { startSlot: "10:00", endSlot: "13:30" })).toEqual({
      ok: true,
      start: "10:00",
      end: "14:00",
      minutes: 240,
    });
    expect(validateSelection(longFree, { startSlot: "10:00", endSlot: "14:00" })).toEqual({
      ok: false,
      code: "TOO_LONG",
    });
    expect(validateSelection(longFree, { startSlot: "10:30", endSlot: "10:00" })).toEqual({
      ok: false,
      code: "END_BEFORE_START",
    });
  });

  it("[BOK-07] refuses a start that is past or taken (@1.2)", () => {
    expect(validateSelection(slots, { startSlot: "08:00", endSlot: "08:00" })).toEqual({
      ok: false,
      code: "START_UNAVAILABLE",
    });
    expect(validateSelection(slots, { startSlot: "12:00", endSlot: "12:00" })).toEqual({
      ok: false,
      code: "START_UNAVAILABLE",
    });
  });
});
