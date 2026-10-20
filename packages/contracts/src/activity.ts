// DRAFT owned by S03 until `s03-accepted` (F2 freeze, AD-20): activity events and the activity list.
// The event types and payloads are fixed by AD-17; payloads never contain `purpose`.
import { z } from "zod";
import { BOOKING_STATUSES } from "./rules";
import { idSchema, isoInstantSchema } from "./rules";
import { userRoleSchema } from "./session";

export const ACTIVITY_TYPES = [
  "booking.created",
  "booking.approved",
  "booking.rejected",
  "booking.cancelled",
  "resource.created",
  "resource.updated",
  "resource.archived",
] as const;
export const activityTypeSchema = z.enum(ACTIVITY_TYPES);
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

const fieldChange = z.strictObject({
  field: z.string(),
  from: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  to: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

/** Payload per type, as written by `recordEvent(tx, …)`. */
export const activityPayloadSchemas = {
  "booking.created": z.strictObject({ status: z.enum(BOOKING_STATUSES) }),
  "booking.approved": z.strictObject({}),
  "booking.rejected": z.strictObject({ reason: z.string() }),
  "booking.cancelled": z.strictObject({ reason: z.string().nullable(), byRole: userRoleSchema }),
  "resource.created": z.strictObject({ name: z.string() }),
  "resource.updated": z.strictObject({ changes: z.array(fieldChange).min(1) }),
  "resource.archived": z.strictObject({}),
} as const;

/** The stored event as the activity writer receives it (S00 writer, Story 1.11). */
export const activityEventInputSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("booking.created"),
    payload: activityPayloadSchemas["booking.created"],
  }),
  z.strictObject({
    type: z.literal("booking.approved"),
    payload: activityPayloadSchemas["booking.approved"],
  }),
  z.strictObject({
    type: z.literal("booking.rejected"),
    payload: activityPayloadSchemas["booking.rejected"],
  }),
  z.strictObject({
    type: z.literal("booking.cancelled"),
    payload: activityPayloadSchemas["booking.cancelled"],
  }),
  z.strictObject({
    type: z.literal("resource.created"),
    payload: activityPayloadSchemas["resource.created"],
  }),
  z.strictObject({
    type: z.literal("resource.updated"),
    payload: activityPayloadSchemas["resource.updated"],
  }),
  z.strictObject({
    type: z.literal("resource.archived"),
    payload: activityPayloadSchemas["resource.archived"],
  }),
]);
export type ActivityEventInput = z.infer<typeof activityEventInputSchema>;

const actor = z.strictObject({ id: idSchema, name: z.string() });
const itemResource = z.strictObject({ id: idSchema, name: z.string() });

function item<T extends ActivityType>(type: T) {
  return z.strictObject({
    id: idSchema,
    type: z.literal(type),
    at: isoInstantSchema,
    actor,
    bookingId: idSchema.nullable(),
    resource: itemResource.nullable(),
    payload: activityPayloadSchemas[type],
  });
}

/** A structured activity item: the web renders the text from these fields (AD-17). */
export const activityItemSchema = z.discriminatedUnion("type", [
  item("booking.created"),
  item("booking.approved"),
  item("booking.rejected"),
  item("booking.cancelled"),
  item("resource.created"),
  item("resource.updated"),
  item("resource.archived"),
]);
export type ActivityItemDto = z.infer<typeof activityItemSchema>;

/** `GET /api/activity`: `before` is an event id; newest first; default limit 20, maximum 100. */
export const listActivityQuerySchema = z.strictObject({
  before: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  bookingId: z.coerce.number().int().positive().optional(),
});
export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;

export const listActivityResponseSchema = z.strictObject({
  items: z.array(activityItemSchema),
  nextBefore: idSchema.nullable(),
});
export type ListActivityResponse = z.infer<typeof listActivityResponseSchema>;
