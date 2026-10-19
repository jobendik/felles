import { describe, expect, it } from "vitest";
import {
  addCivilDays,
  civilWeekday,
  isCivilDate,
  mondayOf,
  osloCivil,
  osloDate,
  osloParts,
  parseIsoUtc,
  toIsoUtc,
} from "../src/index";

describe("Oslo parts and civil dates", () => {
  it("[BR-1] reads instants as Oslo wall-clock time on both sides of the 2026-10-25 switch (@1.2)", () => {
    expect(osloParts(Date.UTC(2026, 9, 19, 7, 0)).time).toBe("09:00"); // CEST, UTC+2
    expect(osloParts(Date.UTC(2026, 9, 25, 0, 30)).time).toBe("02:30"); // CEST
    expect(osloParts(Date.UTC(2026, 9, 25, 1, 30)).time).toBe("02:30"); // CET, the repeated hour
    expect(osloParts(Date.UTC(2026, 9, 26, 9, 0)).time).toBe("10:00"); // CET, UTC+1
  });

  it("[BR-1] reads instants as Oslo wall-clock time on both sides of the 2027-03-28 switch (@1.2)", () => {
    expect(osloParts(Date.UTC(2027, 2, 28, 0, 30)).time).toBe("01:30"); // CET
    expect(osloParts(Date.UTC(2027, 2, 28, 1, 30)).time).toBe("03:30"); // CEST, 02:xx does not exist
    expect(osloDate(Date.UTC(2027, 2, 27, 23, 30))).toBe("2027-03-28");
  });

  it("[BR-1] osloCivil is fixed-width and orders like time (@1.2)", () => {
    const a = osloCivil(Date.UTC(2026, 9, 19, 7, 0, 0, 5));
    expect(a).toBe("2026-10-19T09:00:00.005");
    expect(osloCivil(Date.UTC(2026, 9, 19, 7, 0, 0, 6)) > a).toBe(true);
    expect(osloCivil(Date.UTC(2026, 9, 19, 8, 0, 0, 0)) > a).toBe(true);
  });

  it("[BR-1] converts the wire format both ways (@1.2)", () => {
    const ms = Date.UTC(2026, 9, 19, 7, 0, 0, 123);
    expect(toIsoUtc(ms)).toBe("2026-10-19T07:00:00.123Z");
    expect(parseIsoUtc("2026-10-19T07:00:00.123Z")).toBe(ms);
    expect(() => parseIsoUtc("not a date")).toThrow(RangeError);
  });

  it("[BOK-07] validates civil dates and does calendar arithmetic without a time zone (@1.2)", () => {
    expect(isCivilDate("2026-10-19")).toBe(true);
    expect(isCivilDate("2026-02-30")).toBe(false);
    expect(isCivilDate("2026-13-01")).toBe(false);
    expect(isCivilDate("20261019")).toBe(false);
    expect(isCivilDate("2026-10-19T10:00")).toBe(false);
    expect(addCivilDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(addCivilDays("2027-03-28", -1)).toBe("2027-03-27");
    expect(addCivilDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(civilWeekday("2026-10-19")).toBe(0); // Monday
    expect(mondayOf("2026-10-25")).toBe("2026-10-19"); // Sunday
    expect(mondayOf("2026-10-19")).toBe("2026-10-19");
  });
});
