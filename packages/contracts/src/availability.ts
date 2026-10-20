// The slot model (BOK-07, AD-5): 28 half-hour slots from 08:00 to 22:00 for one resource and one civil
// date. The slot picker, the availability strip and the "Ledige tider" list use only these functions.
// Slot states compare Oslo civil timestamps as strings; local time is never converted to UTC here.
import {
  BOOKING_WINDOW_START,
  GRID_MINUTES,
  MAX_BOOKING_MINUTES,
  SLOTS_PER_DAY,
  minutesToTime,
  timeToMinutes,
} from "./rules";
import { BOOKING_HORIZON_MS, osloCivil, parseIsoUtc } from "./time";

export const SLOT_STATES = ["free", "taken", "past", "beyond-horizon"] as const;
export type SlotState = (typeof SLOT_STATES)[number];

export interface Slot {
  /** `HH:mm` of the slot start. */
  start: string;
  /** `HH:mm` of the slot end. */
  end: string;
  state: SlotState;
}

/** The Oslo civil clock of `now` and of the last bookable instant, as fixed-width strings. */
export interface OsloNow {
  civil: string;
  horizon: string;
}

export function osloNow(nowMs: number): OsloNow {
  return { civil: osloCivil(nowMs), horizon: osloCivil(nowMs + BOOKING_HORIZON_MS) };
}

/** A schedule block as it arrives on the wire: ISO instants. */
export interface BlockLike {
  start: string;
  end: string;
}

function civilOf(date: string, time: string): string {
  return `${date}T${time}:00.000`;
}

/** The 28 slots of a civil date, each marked free, taken, past or beyond the 30-day horizon. */
export function buildSlots(blocks: readonly BlockLike[], date: string, now: OsloNow): Slot[] {
  const intervals = blocks.map((block) => ({
    start: osloCivil(parseIsoUtc(block.start)),
    end: osloCivil(parseIsoUtc(block.end)),
  }));
  const first = timeToMinutes(BOOKING_WINDOW_START);
  const slots: Slot[] = [];
  for (let index = 0; index < SLOTS_PER_DAY; index += 1) {
    const start = minutesToTime(first + index * GRID_MINUTES);
    const end = minutesToTime(first + (index + 1) * GRID_MINUTES);
    const slotStart = civilOf(date, start);
    const slotEnd = civilOf(date, end);
    let state: SlotState;
    // A booked slot reads "taken" even after it has started (EXPERIENCE.md, Flow 1: 09:00 is opptatt).
    if (intervals.some((block) => block.start < slotEnd && slotStart < block.end)) state = "taken";
    else if (slotStart <= now.civil) state = "past";
    else if (slotStart > now.horizon) state = "beyond-horizon";
    else state = "free";
    slots.push({ start, end, state });
  }
  return slots;
}

export interface FreeRange {
  start: string;
  end: string;
  slots: number;
}

/** Consecutive free slots merged into ranges, for "Ledige tider". Adjacent blocks leave their neighbours free. */
export function freeRanges(slots: readonly Slot[]): FreeRange[] {
  const ranges: FreeRange[] = [];
  for (const slot of slots) {
    if (slot.state !== "free") continue;
    const last = ranges[ranges.length - 1];
    if (last !== undefined && last.end === slot.start) {
      last.end = slot.end;
      last.slots += 1;
    } else {
      ranges.push({ start: slot.start, end: slot.end, slots: 1 });
    }
  }
  return ranges;
}

export const SELECTION_REFUSALS = [
  "END_BEFORE_START",
  "START_UNAVAILABLE",
  "CROSSES_UNAVAILABLE",
  "TOO_LONG",
] as const;
export type SelectionRefusal = (typeof SELECTION_REFUSALS)[number];

/** A selection names the start slot and the end slot; the end slot's 30 minutes are included. */
export interface Selection {
  startSlot: string;
  endSlot: string;
}

export type SelectionResult =
  { ok: true; start: string; end: string; minutes: number } | { ok: false; code: SelectionRefusal };

/** Refuses an end before the start, a start that is not free, a range over a taken slot, and more than 4 hours. */
export function validateSelection(slots: readonly Slot[], selection: Selection): SelectionResult {
  const startIndex = slots.findIndex((slot) => slot.start === selection.startSlot);
  const endIndex = slots.findIndex((slot) => slot.start === selection.endSlot);
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex)
    return { ok: false, code: "END_BEFORE_START" };
  if (slots[startIndex]?.state !== "free") return { ok: false, code: "START_UNAVAILABLE" };
  for (let index = startIndex; index <= endIndex; index += 1) {
    if (slots[index]?.state !== "free") return { ok: false, code: "CROSSES_UNAVAILABLE" };
  }
  const minutes = (endIndex - startIndex + 1) * GRID_MINUTES;
  if (minutes > MAX_BOOKING_MINUTES) return { ok: false, code: "TOO_LONG" };
  const start = slots[startIndex]?.start ?? selection.startSlot;
  const end = slots[endIndex]?.end ?? selection.endSlot;
  return { ok: true, start, end, minutes };
}

/**
 * What activating a slot does (EXPERIENCE.md, Slot picker): the first activation selects 30 minutes;
 * a later free slot moves the end; the start slot again clears everything.
 */
export function nextSelection(current: Selection | null, activated: string): Selection | null {
  if (current === null) return { startSlot: activated, endSlot: activated };
  if (activated === current.startSlot) return null;
  if (activated < current.startSlot) return { startSlot: activated, endSlot: activated };
  return { startSlot: current.startSlot, endSlot: activated };
}
