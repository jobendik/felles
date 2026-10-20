import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("contracts summary (Gate S00-CP review package)", () => {
  it("[RUN-1] docs/contracts-summary.md is current and lists every route and the contracts hash (@1.4)", () => {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/contracts-summary.mjs", "--check"],
      {
        cwd: root,
        encoding: "utf8",
      },
    );
    expect(`${result.stdout}${result.stderr}`).toContain("is current");
    expect(result.status).toBe(0);

    const text = readFileSync(join(root, "docs", "contracts-summary.md"), "utf8");
    expect(text).toMatch(/Contracts content hash.*`[0-9a-f]{64}`/);
    for (const route of [
      "/api/health",
      "/api/session",
      "/api/resources/:id/archive",
      "/api/resources/:id/schedule",
      "/api/bookings/:id/approve",
      "/api/dashboard",
      "/api/activity",
    ]) {
      expect(text, route).toContain(`\`${route}\``);
    }
    expect(text).toContain("**bookingSchema**");
    expect(text).toContain("**createBookingInputSchema**");
    expect(text).toContain("## Open design questions");
  }, 60_000);
});
