import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  ERROR_CODES,
  ERROR_STATUS,
  catalogueErrorMap,
  errorEnvelopeSchema,
  fieldMessageNb,
  isErrorCode,
  messageFor,
  messagesNb,
  type ErrorCode,
} from "../src/index";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const approvedCopy = readFileSync(
  join(
    repoRoot,
    "_bmad-output/planning-artifacts/architecture/architecture-felles-pilot-2026-10-19/approved-copy.md",
  ),
  "utf8",
);

function approvedRows(): Map<string, string> {
  const rows = new Map<string, string>();
  const section = approvedCopy.split("## Error messages")[1] ?? "";
  for (const line of section.split(/\r?\n/)) {
    const match = /^\| `([A-Z_]+)`( \((approve|cancel)\))? \| (.+) \|$/.exec(line);
    if (match === null) continue;
    const key = match[3] === undefined ? match[1]! : `${match[1]}:${match[3]}`;
    rows.set(key, match[4]!.trim());
  }
  return rows;
}

describe("error catalogue", () => {
  it("[BR-4] every approved code has exactly the approved Norwegian message (@1.2)", () => {
    const approved = approvedRows();
    expect(approved.size).toBeGreaterThanOrEqual(19);
    const seen = new Set<string>();
    for (const [key, text] of approved) {
      const [code, variant] = key.split(":") as [ErrorCode, string | undefined];
      expect(isErrorCode(code), `${code} is a known code`).toBe(true);
      seen.add(code);
      if (code === "RESOURCE_HAS_FUTURE_BOOKINGS") {
        expect(
          text.startsWith("Ressursen har {n} fremtidige bookinger og kan ikke arkiveres."),
        ).toBe(true);
        expect(messageFor(code, { futureBookingCount: 3, firstFutureBookingAt: "x" })).toBe(
          "Ressursen har 3 fremtidige bookinger og kan ikke arkiveres.",
        );
        expect(messageFor(code, { futureBookingCount: 1, firstFutureBookingAt: "x" })).toBe(
          "Ressursen har 1 fremtidig booking og kan ikke arkiveres.",
        );
      } else if (code === "RATE_LIMITED") {
        expect(text.startsWith("For mange forsøk. Prøv igjen om {seconds} sekunder.")).toBe(true);
        expect(messageFor(code, { retryAfterSeconds: 10 })).toBe(
          "For mange forsøk. Prøv igjen om 10 sekunder.",
        );
        expect(messageFor(code, { retryAfterSeconds: 1 })).toBe(
          "For mange forsøk. Prøv igjen om 1 sekund.",
        );
      } else if (code === "BOOKING_STARTED") {
        const action = variant === "approve" ? "approve" : "cancel";
        expect(messageFor(code, { currentStatus: "confirmed", action })).toBe(text);
      } else {
        expect(messageFor(code), code).toBe(text);
      }
    }
    for (const code of ERROR_CODES) {
      expect(seen.has(code), `${code} is covered by the approved copy`).toBe(true);
    }
  });

  it("[BR-4] every code has a status from the extended DEC-16 set (@1.2)", () => {
    expect(Object.keys(ERROR_STATUS).sort()).toEqual([...ERROR_CODES].sort());
    expect(Object.keys(messagesNb).sort()).toEqual([...ERROR_CODES].sort());
    expect(ERROR_STATUS.BOOKING_CONFLICT).toBe(409);
    expect(ERROR_STATUS.HOST_REFUSED).toBe(421);
    expect(ERROR_STATUS.RATE_LIMITED).toBe(429);
    expect(ERROR_STATUS.INTERNAL).toBe(500);
    expect(ERROR_STATUS.NOT_IMPLEMENTED).toBe(501);
    expect(ERROR_STATUS.DATABASE_BUSY).toBe(503);
  });

  it("[BR-4] the envelope schema parses an error body and rejects an unknown code (@1.2)", () => {
    const body = { error: { code: "BOOKING_CONFLICT", message: messageFor("BOOKING_CONFLICT") } };
    expect(errorEnvelopeSchema.safeParse(body).success).toBe(true);
    expect(errorEnvelopeSchema.safeParse({ error: { code: "NOPE", message: "x" } }).success).toBe(
      false,
    );
  });

  it("[BR-4] the Zod error map speaks the catalogue (@1.2)", () => {
    const schema = z.string().max(200);
    const result = schema.safeParse("x".repeat(201), {
      error: (issue) => catalogueErrorMap(issue),
    });
    expect(result.success).toBe(false);
    expect(result.success ? "" : result.error.issues[0]?.message).toBe("Maks 200 tegn.");
    expect(fieldMessageNb("TOO_LONG")).toBe("Maks 4 timer.");
    const missing = z
      .object({ purpose: z.string() })
      .safeParse({}, { error: (issue) => catalogueErrorMap(issue) });
    expect(missing.success ? "" : missing.error.issues[0]?.message).toBe("Må fylles ut.");
  });
});

describe("contracts package hygiene", () => {
  it("[RUN-1] contracts imports nothing from the apps and has no I/O or Temporal import (@1.2)", () => {
    const srcDir = join(here, "..", "src");
    for (const file of readdirSync(srcDir)) {
      const text = readFileSync(join(srcDir, file), "utf8");
      expect(text, file).not.toMatch(/from\s+["'][^"']*apps\//);
      expect(text, file).not.toMatch(/from\s+["']@felles\/(api|web)["']/);
      expect(text, file).not.toMatch(/from\s+["']node:/);
      expect(text, file).not.toMatch(/from\s+["']temporal|require\(["']temporal/);
      expect(text, file).not.toMatch(/\bprocess\.env\b/);
    }
  });
});
