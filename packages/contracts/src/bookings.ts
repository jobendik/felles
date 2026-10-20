// Booking contracts (BOK-01…08, APP-01…04, AD-5, AD-9, AD-15, AD-16).
import { z } from "zod";
import { activityItemSchema } from "./activity";
import { fieldMessageNb, type FieldErrorCode } from "./errors";
import { resourceSummarySchema } from "./resources";
import {
  BOOKING_STATUSES,
  TEXT_LIMITS,
  checkBookingTimes,
  civilDateSchema,
  civilTimeSchema,
  emptyBody,
  idSchema,
  isoInstantSchema,
  listLimit,
  optionalText,
  requiredText,
} from "./rules";
import { userRoleSchema } from "./session";

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);

export const bookingIdSchema = idSchema.brand<"BookingId">();
export type BookingId = z.infer<typeof bookingIdSchema>;

const person = z.strictObject({ id: idSchema, name: z.string() });

/** Present on a confirmed or rejected booking: who decided, when, and the reason a rejection requires. */
export const decisionSchema = z.strictObject({
  outcome: z.enum(["approved", "rejected"]),
  by: person,
  at: isoInstantSchema,
  reason: z.string().nullable(),
});
export type DecisionDto = z.infer<typeof decisionSchema>;

export const cancellationSchema = z.strictObject({
  by: person,
  byRole: userRoleSchema,
  at: isoInstantSchema,
  reason: z.string().nullable(),
});
export type CancellationDto = z.infer<typeof cancellationSchema>;

/**
 * A booking as one viewer may see it. `status` carries the four stored values only; `expired` is computed
 * from the Clock (AD-16). `booker` is set for Administrators.
 */
export const bookingSchema = z.strictObject({
  id: idSchema,
  resource: resourceSummarySchema,
  userId: idSchema,
  booker: z.strictObject({ name: z.string() }).nullable(),
  purpose: z.string(),
  start: isoInstantSchema,
  end: isoInstantSchema,
  createdAt: isoInstantSchema,
  status: bookingStatusSchema,
  expired: z.boolean(),
  decision: decisionSchema.nullable(),
  cancellation: cancellationSchema.nullable(),
});
export type BookingDto = z.infer<typeof bookingSchema>;

/** `GET /api/bookings/:id` embeds the booking's events (Historikk) as a plain array. */
export const bookingDetailSchema = bookingSchema.extend({ events: z.array(activityItemSchema) });
export type BookingDetailDto = z.infer<typeof bookingDetailSchema>;

/**
 * `POST /api/bookings`: Oslo civil values. The shape, window, grid, duration and end-after-start rules run
 * on these strings (AD-5); `userId` and `status` are server-owned and appear in no request schema.
 */
export const createBookingInputSchema = z
  .strictObject({
    resourceId: idSchema,
    date: civilDateSchema,
    start: civilTimeSchema,
    end: civilTimeSchema,
    purpose: requiredText(TEXT_LIMITS.purpose),
  })
  .check((ctx) => {
    const { start, end } = ctx.value;
    const verdict = checkBookingTimes({ start, end });
    if (!verdict.ok) {
      const code: FieldErrorCode = verdict.code;
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: [verdict.field],
        message: fieldMessageNb(code),
        params: { fieldCode: code },
      });
    }
  });
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

/** `GET /api/bookings`. Repeated `status` parameters become an array. */
export const listBookingsQuerySchema = z.strictObject({
  scope: z.enum(["mine", "all"]).default("mine"),
  group: z.enum(["upcoming", "past"]).optional(),
  status: z
    .union([bookingStatusSchema, z.array(bookingStatusSchema)])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .optional(),
  expired: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  resourceId: z.coerce.number().int().positive().optional(),
  limit: listLimit,
});
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;

export const listBookingsResponseSchema = z.strictObject({
  items: z.array(bookingSchema),
  truncated: z.boolean(),
});
export type ListBookingsResponse = z.infer<typeof listBookingsResponseSchema>;

/** `POST /api/bookings/:id/cancel`: an Administrator cancelling another's booking must give a reason. */
export const cancelBookingInputSchema = z.strictObject({
  reason: optionalText(TEXT_LIMITS.reason),
});
export type CancelBookingInput = z.infer<typeof cancelBookingInputSchema>;

export const approveBookingInputSchema = emptyBody;

export const rejectBookingInputSchema = z.strictObject({
  reason: requiredText(TEXT_LIMITS.reason),
});
export type RejectBookingInput = z.infer<typeof rejectBookingInputSchema>;
