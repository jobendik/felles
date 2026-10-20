import { describe, expect, it } from "vitest";
import {
  loginInputSchema,
  loginResponseSchema,
  sessionSchema,
  sessionUserSchema,
} from "../src/index";
import { SAMPLE_USER } from "./samples";

describe("session contracts", () => {
  it("[AUT-04] parses a signed-in and a signed-out session (@1.4)", () => {
    const base = { serverNow: "2026-10-19T07:00:00.000Z", demoData: true };
    expect(sessionSchema.safeParse({ ...base, user: SAMPLE_USER }).success).toBe(true);
    expect(sessionSchema.safeParse({ ...base, user: null }).success).toBe(true);
    expect(
      sessionSchema.safeParse({ ...base, user: { ...SAMPLE_USER, role: "owner" } }).success,
    ).toBe(false);
    expect(sessionSchema.safeParse({ ...base, user: SAMPLE_USER, token: "x" }).success).toBe(false);
    expect(
      sessionSchema.safeParse({ user: null, serverNow: "yesterday", demoData: false }).success,
    ).toBe(false);
  });

  it("[AUT-01] the login input is strict, trims the e-mail and never trims the password (@1.4)", () => {
    const parsed = loginInputSchema.parse({
      email: "  sofie@felles.example ",
      password: "  pass word  ",
    });
    expect(parsed).toEqual({ email: "sofie@felles.example", password: "  pass word  " });
    expect(loginInputSchema.safeParse({ email: "a@b.no", password: "" }).success).toBe(false);
    expect(
      loginInputSchema.safeParse({ email: "a@b.no", password: "x", role: "admin" }).success,
    ).toBe(false);
    expect(loginResponseSchema.safeParse({ user: SAMPLE_USER }).success).toBe(true);
    expect(sessionUserSchema.safeParse({ id: 0, name: "x", role: "member" }).success).toBe(false);
  });
});
