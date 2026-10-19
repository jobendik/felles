// Session and sign-in contracts (AUT-01…04, AD-11). Sign-in itself is S01; the read is S00.
import { z } from "zod";
import { TEXT_LIMITS, idSchema, isoInstantSchema, requiredText } from "./rules";

export const USER_ROLES = ["member", "admin"] as const;
export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = (typeof USER_ROLES)[number];

export const userIdSchema = idSchema.brand<"UserId">();
export type UserId = z.infer<typeof userIdSchema>;

export const sessionUserSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  role: userRoleSchema,
});
export type SessionUserDto = z.infer<typeof sessionUserSchema>;

/** `GET /api/session`: the signed-in user or null, the server's `now` and whether the data is synthetic. */
export const sessionSchema = z.strictObject({
  user: sessionUserSchema.nullable(),
  serverNow: isoInstantSchema,
  demoData: z.boolean(),
});
export type SessionDto = z.infer<typeof sessionSchema>;

/**
 * `POST /api/session`. The e-mail is trimmed and NFC-normalised like every text field and then passed
 * through `normaliseEmail`. The password is never trimmed or normalised; it only has a length bound.
 */
export const loginInputSchema = z.strictObject({
  email: requiredText(TEXT_LIMITS.email),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const loginResponseSchema = z.strictObject({ user: sessionUserSchema });
export type LoginResponse = z.infer<typeof loginResponseSchema>;
