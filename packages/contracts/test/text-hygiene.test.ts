import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  ROUTE_LIST,
  TEXT_LIMITS,
  cancelBookingInputSchema,
  createBookingInputSchema,
  createResourceInputSchema,
  fieldMessageNb,
  listResourcesQuerySchema,
  loginInputSchema,
  rejectBookingInputSchema,
  toFieldErrors,
  updateResourceInputSchema,
} from "../src/index";
import { SAMPLE_CREATE_BOOKING } from "./samples";

interface TextField {
  path: string;
  max: number;
  optional: boolean;
}

interface RequestCase {
  name: string;
  schema: z.ZodType;
  sample: Record<string, unknown>;
  text: TextField[];
}

const resourceSample = {
  name: "Fjellet",
  kind: "room",
  location: "2. etasje",
  symbol: "users",
  colour: "bla",
  approvalRequired: false,
};

const CASES: RequestCase[] = [
  {
    name: "login",
    schema: loginInputSchema,
    sample: { email: "ingrid@felles.example", password: "secret" },
    text: [{ path: "email", max: TEXT_LIMITS.email, optional: false }],
  },
  {
    name: "create resource",
    schema: createResourceInputSchema,
    sample: resourceSample,
    text: [
      { path: "name", max: TEXT_LIMITS.name, optional: false },
      { path: "description", max: TEXT_LIMITS.description, optional: true },
      { path: "location", max: TEXT_LIMITS.location, optional: false },
    ],
  },
  {
    name: "update resource",
    schema: updateResourceInputSchema,
    sample: {},
    text: [
      { path: "name", max: TEXT_LIMITS.name, optional: false },
      { path: "description", max: TEXT_LIMITS.description, optional: true },
      { path: "location", max: TEXT_LIMITS.location, optional: false },
    ],
  },
  {
    name: "list resources",
    schema: listResourcesQuerySchema,
    sample: {},
    text: [{ path: "q", max: TEXT_LIMITS.search, optional: true }],
  },
  {
    name: "create booking",
    schema: createBookingInputSchema,
    sample: { ...SAMPLE_CREATE_BOOKING },
    text: [{ path: "purpose", max: TEXT_LIMITS.purpose, optional: false }],
  },
  {
    name: "cancel booking",
    schema: cancelBookingInputSchema,
    sample: {},
    text: [{ path: "reason", max: TEXT_LIMITS.reason, optional: true }],
  },
  {
    name: "reject booking",
    schema: rejectBookingInputSchema,
    sample: { reason: "Utstyret er på service" },
    text: [{ path: "reason", max: TEXT_LIMITS.reason, optional: false }],
  },
];

const code = (n: number) => String.fromCharCode(n);
const NFD_E_ACUTE = `e${code(0x301)}`;

function parse(c: RequestCase, patch: Record<string, unknown>) {
  return c.schema.safeParse({ ...c.sample, ...patch });
}

function failedPaths(result: ReturnType<typeof parse>): string[] {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("every string field of every request schema", () => {
  for (const c of CASES) {
    for (const field of c.text) {
      const label = `${c.name}.${field.path}`;

      it(`[BR-4] ${label}: values are trimmed and NFC-normalised (@1.4)`, () => {
        const result = parse(c, { [field.path]: `  ${NFD_E_ACUTE}  ` });
        expect(result.success, label).toBe(true);
        expect((result.data as Record<string, unknown>)[field.path]).toBe("é");
      });

      it(`[BR-4] ${label}: control and bidi characters are rejected (@1.4)`, () => {
        const hostile = [0x07, 0x09, 0x0a, 0x0d, 0x7f, 0x85, 0x202e, 0x2066, 0x200e, 0x061c];
        for (const point of hostile) {
          const result = parse(c, { [field.path]: `ab${code(point)}cd` });
          expect(result.success, `${label} U+${point.toString(16)}`).toBe(false);
          expect(failedPaths(result), label).toContain(field.path);
        }
      });

      it(`[BR-4] ${label}: an empty value ${field.optional ? "becomes null" : "is required"} (@1.4)`, () => {
        for (const empty of ["", "   "]) {
          const result = parse(c, { [field.path]: empty });
          if (field.optional) {
            expect(result.success, label).toBe(true);
            expect((result.data as Record<string, unknown>)[field.path]).toBeNull();
          } else {
            expect(result.success, label).toBe(false);
            const errors = toFieldErrors((result.error?.issues ?? []) as never);
            expect(errors.map((e) => `${e.path}:${e.code}`)).toContain(`${field.path}:REQUIRED`);
          }
        }
      });

      it(`[BR-4] ${label}: the maximum of ${field.max} is enforced on the cleaned value (@1.4)`, () => {
        expect(parse(c, { [field.path]: "x".repeat(field.max) }).success, `${label} at max`).toBe(
          true,
        );
        expect(
          parse(c, { [field.path]: ` ${"x".repeat(field.max)} ` }).success,
          `${label} padded`,
        ).toBe(true);
        const over = parse(c, { [field.path]: "x".repeat(field.max + 1) });
        expect(over.success, `${label} over`).toBe(false);
        const errors = toFieldErrors((over.error?.issues ?? []) as never);
        expect(errors).toContainEqual({
          path: field.path,
          code: "TOO_LONG_TEXT",
          message: fieldMessageNb("TOO_LONG_TEXT", field.max),
        });
      });
    }

    it(`[BR-4] ${c.name}: unknown keys are rejected (@1.4)`, () => {
      expect(parse(c, { unexpected: 1 }).success).toBe(false);
    });
  }

  it("[BR-4] the maxima are email 254, name 80, description 500, purpose 200, reason 200 (@1.4)", () => {
    expect(TEXT_LIMITS).toMatchObject({
      email: 254,
      name: 80,
      description: 500,
      purpose: 200,
      reason: 200,
    });
    expect("Maks 200 tegn.").toBe(fieldMessageNb("TOO_LONG_TEXT", 200));
  });

  it("[BR-4] no request schema accepts a server-owned field (@1.4)", () => {
    const serverOwned = [
      "userId",
      "status",
      "role",
      "createdAt",
      "decidedBy",
      "decidedAt",
      "cancelledBy",
      "expired",
    ];
    for (const route of ROUTE_LIST) {
      for (const schema of [route.body, route.query, route.params]) {
        if (schema === null) continue;
        for (const key of serverOwned) {
          const probe = schema.safeParse({ [key]: 1 });
          expect(probe.success, `${route.id} accepts ${key}`).toBe(false);
        }
      }
    }
  });

  it('[RES-03] an empty resource name reads "Navn er påkrevd." and other required fields "Må fylles ut." (@1.4)', () => {
    const empty = createResourceInputSchema.safeParse({ ...resourceSample, name: "  " });
    const errors = toFieldErrors((empty.error?.issues ?? []) as never);
    expect(errors).toContainEqual({ path: "name", code: "REQUIRED", message: "Navn er påkrevd." });
    const missing = createResourceInputSchema.safeParse({ kind: "room" });
    const missingErrors = toFieldErrors((missing.error?.issues ?? []) as never);
    expect(missingErrors).toContainEqual({
      path: "name",
      code: "REQUIRED",
      message: "Navn er påkrevd.",
    });
    expect(missingErrors).toContainEqual({
      path: "location",
      code: "REQUIRED",
      message: "Må fylles ut.",
    });
    const purpose = toFieldErrors(
      (createBookingInputSchema.safeParse({ ...SAMPLE_CREATE_BOOKING, purpose: "" }).error
        ?.issues ?? []) as never,
    );
    expect(purpose).toContainEqual({ path: "purpose", code: "REQUIRED", message: "Må fylles ut." });
  });
});
