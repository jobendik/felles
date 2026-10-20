import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { OsloTimeError, osloDayRange, osloInstant, osloWeekRange, parseInstant } from "./oslo-time";

const HOUR = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();

describe("Oslo civil values to instants", () => {
  it("[BR-1] 2026-10-19 10:00 is 08:00Z and 2026-10-26 10:00 is 09:00Z, 2027-03-28 10:00 is 08:00Z (@1.3)", () => {
    expect(iso(osloInstant("2026-10-19", "10:00"))).toBe("2026-10-19T08:00:00.000Z");
    expect(iso(osloInstant("2026-10-26", "10:00"))).toBe("2026-10-26T09:00:00.000Z");
    expect(iso(osloInstant("2027-03-28", "10:00"))).toBe("2027-03-28T08:00:00.000Z");
    expect(iso(osloInstant("2026-10-25", "08:00"))).toBe("2026-10-25T07:00:00.000Z");
    expect(iso(osloInstant("2027-03-28", "08:00"))).toBe("2027-03-28T06:00:00.000Z");
  });

  it("[BR-1] unreachable and ambiguous DST wall times are refused as validation errors (@1.3)", () => {
    for (const [date, time] of [
      ["2027-03-28", "02:30"], // does not exist (spring forward)
      ["2026-10-25", "02:30"], // happens twice (fall back)
    ] as const) {
      expect(() => osloInstant(date, time)).toThrow(OsloTimeError);
      try {
        osloInstant(date, time);
      } catch (error) {
        expect((error as OsloTimeError).code).toBe("UNREACHABLE_WALL_TIME");
      }
    }
  });

  it("[BR-4] strict shapes: datetime strings, basic format, seconds and impossible dates are refused (@1.3)", () => {
    for (const [date, time] of [
      ["2026-10-19T10:00", "10:00"],
      ["20261019", "10:00"],
      ["+002026-10-19", "10:00"],
      ["2026-02-30", "10:00"],
      ["2026-10-19", "10:00:30"],
      ["2026-10-19", "24:00"],
      ["2026-10-19", "7:00"],
    ] as const) {
      expect(() => osloInstant(date, time), `${date} ${time}`).toThrow(OsloTimeError);
    }
  });

  it("[BR-1] osloDayRange and osloWeekRange are half-open and give 25 h and 23 h days on the switch days (@1.3)", () => {
    const fall = osloDayRange("2026-10-25");
    expect((fall.to - fall.from) / HOUR).toBe(25);
    expect(iso(fall.from)).toBe("2026-10-24T22:00:00.000Z");
    expect(iso(fall.to)).toBe("2026-10-25T23:00:00.000Z");
    const spring = osloDayRange("2027-03-28");
    expect((spring.to - spring.from) / HOUR).toBe(23);
    expect(iso(spring.from)).toBe("2027-03-27T23:00:00.000Z");
    expect(iso(spring.to)).toBe("2027-03-28T22:00:00.000Z");
    const week = osloWeekRange("2026-10-19", 7);
    expect((week.to - week.from) / HOUR).toBe(169);
    expect((osloWeekRange("2027-03-22", 7).to - osloWeekRange("2027-03-22", 7).from) / HOUR).toBe(
      167,
    );
    expect(osloDayRange("2026-10-19").to).toBe(osloDayRange("2026-10-20").from);
  });

  it("[BR-4] ranges refuse bad dates and day counts (@1.3)", () => {
    expect(() => osloDayRange("2026-13-01")).toThrow(OsloTimeError);
    expect(() => osloWeekRange("2026-10-19", 0)).toThrow(OsloTimeError);
    expect(() => osloWeekRange("2026-10-19", 15)).toThrow(OsloTimeError);
  });
});

describe("parseInstant", () => {
  it("[BR-1] needs Z or an offset and returns the same instant for both spellings (@1.3)", () => {
    expect(parseInstant("2026-10-19T07:00:00Z")).toBe(parseInstant("2026-10-19T09:00:00+02:00"));
    expect(() => parseInstant("2026-10-19T07:00:00")).toThrow(OsloTimeError);
    expect(() => parseInstant("tomorrow")).toThrow(OsloTimeError);
  });
});

describe("machine time zone independence", () => {
  const original = process.env.TZ;
  afterEach(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });

  it("[BR-1] conversions and ranges are identical under UTC, America/New_York and Asia/Tokyo (@1.3)", () => {
    const results: string[] = [];
    for (const tz of ["UTC", "America/New_York", "Asia/Tokyo", "Europe/Oslo"]) {
      process.env.TZ = tz;
      const day = osloDayRange("2026-10-25");
      results.push(
        JSON.stringify([
          osloInstant("2026-10-19", "10:00"),
          osloInstant("2027-03-28", "10:00"),
          day.from,
          day.to,
          parseInstant("2026-10-19T07:00:00Z"),
        ]),
      );
    }
    expect(new Set(results).size).toBe(1);
  });
});

describe("temporal-polyfill is imported in one module only", () => {
  it("[BR-1] no other source file imports temporal-polyfill (@1.3)", () => {
    const apiSrc = join(dirname(fileURLToPath(import.meta.url)), "..");
    const importers: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(name) && !name.endsWith(".test.ts")) {
          if (/from\s+["']temporal-polyfill["']/.test(readFileSync(full, "utf8")))
            importers.push(relative(apiSrc, full));
        }
      }
    };
    walk(apiSrc);
    expect(importers.map((p) => p.replaceAll("\\", "/"))).toEqual(["platform/oslo-time.ts"]);
  });
});
