// DRAFT owned by S03 until `s03-accepted` (F2 freeze, AD-20): the schedule read model for the slot picker,
// the availability strip and the week grid. Blocks are a union discriminated by `kind` (AD-15).
import { z } from "zod";
import { resourceSummarySchema } from "./resources";
import { civilDateSchema, idSchema, isoInstantSchema } from "./rules";

/** Owner or Administrator: the booking, its booker and purpose. */
export const detailBlockSchema = z.strictObject({
  kind: z.literal("detail"),
  bookingId: idSchema,
  bookerName: z.string(),
  purpose: z.string(),
  status: z.enum(["pending", "confirmed"]),
  expired: z.boolean(),
  start: isoInstantSchema,
  end: isoInstantSchema,
});

/** Any other viewer: status and interval only. No id, no user, no purpose; only `pending`/`confirmed`. */
export const anonymousBlockSchema = z.strictObject({
  kind: z.literal("anonymous"),
  status: z.enum(["pending", "confirmed"]),
  start: isoInstantSchema,
  end: isoInstantSchema,
});

export const scheduleBlockSchema = z.discriminatedUnion("kind", [
  detailBlockSchema,
  anonymousBlockSchema,
]);
export type ScheduleBlockDto = z.infer<typeof scheduleBlockSchema>;

/** `GET /api/resources/:id/schedule?from&days`: `from` is an Oslo civil date, `days` is 1…7 (default 7). */
export const scheduleQuerySchema = z.strictObject({
  from: civilDateSchema,
  days: z.coerce.number().int().min(1).max(7).default(7),
});
export type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;

export const scheduleSchema = z.strictObject({
  resource: resourceSummarySchema,
  from: civilDateSchema,
  days: z.number().int().min(1).max(7),
  blocks: z.array(scheduleBlockSchema),
});
export type ScheduleDto = z.infer<typeof scheduleSchema>;
