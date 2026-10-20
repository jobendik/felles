import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { advancingClock, fixedClock, steppableClock, systemClock, type Clock } from "./clock";

const START = Date.UTC(2026, 9, 19, 7, 0, 0);

describe("one clock", () => {
  it("[BR-1] FELLES_NOW sets the start instant and the clock keeps advancing (@1.3)", async () => {
    const clock = advancingClock(START);
    const first = clock.now();
    expect(first).toBeGreaterThanOrEqual(START);
    expect(first - START).toBeLessThan(1000);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(clock.now()).toBeGreaterThan(first);
  });

  it("[BR-1] fixed and steppable clocks can be injected through the Clock type (@1.3)", () => {
    const takesClock = (clock: Clock) => clock.now() + 1;
    expect(takesClock(fixedClock(START))).toBe(START + 1);
    const stepped = steppableClock(START);
    expect(takesClock(stepped)).toBe(START + 1);
    stepped.advance(60_000);
    expect(stepped.now()).toBe(START + 60_000);
    stepped.set(START - 5);
    expect(stepped.now()).toBe(START - 5);
    expect(Math.abs(systemClock().now() - new Date().getTime())).toBeLessThan(1000);
  });

  it("[BR-1] Date.now() and argument-less new Date() appear only in the clock modules (@1.3)", () => {
    const apiSrc = join(dirname(fileURLToPath(import.meta.url)), "..");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) {
          const text = readFileSync(full, "utf8");
          if (/\bDate\.now\(\)|new Date\(\)|performance\.now\(\)/.test(text)) {
            offenders.push(relative(apiSrc, full).replaceAll("\\", "/"));
          }
        }
      }
    };
    walk(apiSrc);
    expect(offenders).toEqual(["platform/clock.ts"]);
  });
});
