// Resource contracts (RES-01…05, DEC-14): the fixed symbol and colour lists, the DTOs and the inputs.
import { z } from "zod";
import { TEXT_LIMITS, emptyBody, idSchema, listLimit, optionalText, requiredText } from "./rules";

export const RESOURCE_KINDS = ["room", "equipment"] as const;
export const resourceKindSchema = z.enum(RESOURCE_KINDS);
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export const RESOURCE_STATUSES = ["active", "archived"] as const;
export const resourceStatusSchema = z.enum(RESOURCE_STATUSES);
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

/** Stored symbols and their Norwegian names (DESIGN.md → Resource symbols and colours). */
export const RESOURCE_SYMBOLS = {
  users: "Personer",
  monitor: "Skjerm",
  "door-closed": "Dør",
  presentation: "Presentasjon",
  projector: "Projektor",
  camera: "Kamera",
  mic: "Mikrofon",
  "pen-line": "Penn",
  laptop: "Bærbar",
  headphones: "Hodetelefoner",
} as const;
export type ResourceSymbol = keyof typeof RESOURCE_SYMBOLS;
export const RESOURCE_SYMBOL_IDS = Object.keys(RESOURCE_SYMBOLS) as ResourceSymbol[];
export const resourceSymbolSchema = z.enum(
  RESOURCE_SYMBOL_IDS as [ResourceSymbol, ...ResourceSymbol[]],
);

/** Stored colours and their Norwegian names; each maps to `res-<id>` / `res-<id>-tint` tokens in DESIGN.md. */
export const RESOURCE_COLOURS = {
  bla: "Blå",
  gronn: "Grønn",
  lilla: "Lilla",
  oransje: "Oransje",
  rosa: "Rosa",
  teal: "Blågrønn",
  gul: "Gul",
  gra: "Grå",
} as const;
export type ResourceColour = keyof typeof RESOURCE_COLOURS;
export const RESOURCE_COLOUR_IDS = Object.keys(RESOURCE_COLOURS) as ResourceColour[];
export const resourceColourSchema = z.enum(
  RESOURCE_COLOUR_IDS as [ResourceColour, ...ResourceColour[]],
);

export const resourceIdSchema = idSchema.brand<"ResourceId">();
export type ResourceId = z.infer<typeof resourceIdSchema>;

export const SEATS_MAX = 1000;

export const resourceSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  kind: resourceKindSchema,
  description: z.string().nullable(),
  location: z.string(),
  seats: z.number().int().positive().nullable(),
  symbol: resourceSymbolSchema,
  colour: resourceColourSchema,
  approvalRequired: z.boolean(),
  status: resourceStatusSchema,
});
export type ResourceDto = z.infer<typeof resourceSchema>;

/** The summary embedded in bookings, blocks and the dashboard. */
export const resourceSummarySchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  kind: resourceKindSchema,
  location: z.string(),
  symbol: resourceSymbolSchema,
  colour: resourceColourSchema,
  status: resourceStatusSchema,
});
export type ResourceSummaryDto = z.infer<typeof resourceSummarySchema>;

const seats = z.number().int().min(1).max(SEATS_MAX);

/** `POST /api/resources`. `status` is server-owned and exists in no request schema. */
export const createResourceInputSchema = z.strictObject({
  name: requiredText(TEXT_LIMITS.name),
  kind: resourceKindSchema,
  description: optionalText(TEXT_LIMITS.description),
  location: requiredText(TEXT_LIMITS.location),
  seats: seats.nullable().optional(),
  symbol: resourceSymbolSchema,
  colour: resourceColourSchema,
  approvalRequired: z.boolean(),
});
export type CreateResourceInput = z.infer<typeof createResourceInputSchema>;

/** `PATCH /api/resources/:id`: an omitted key is unchanged and `null` clears an optional value. */
export const updateResourceInputSchema = z.strictObject({
  name: requiredText(TEXT_LIMITS.name).optional(),
  kind: resourceKindSchema.optional(),
  description: optionalText(TEXT_LIMITS.description),
  location: requiredText(TEXT_LIMITS.location).optional(),
  seats: seats.nullable().optional(),
  symbol: resourceSymbolSchema.optional(),
  colour: resourceColourSchema.optional(),
  approvalRequired: z.boolean().optional(),
});
export type UpdateResourceInput = z.infer<typeof updateResourceInputSchema>;

/** `GET /api/resources`: `status` defaults to `active`; a Member sending `archived` or `all` gets 403. */
export const listResourcesQuerySchema = z.strictObject({
  kind: resourceKindSchema.optional(),
  q: optionalText(TEXT_LIMITS.search),
  status: z.enum(["active", "archived", "all"]).default("active"),
  limit: listLimit,
});
export type ListResourcesQuery = z.infer<typeof listResourcesQuerySchema>;

export const listResourcesResponseSchema = z.strictObject({
  items: z.array(resourceSchema),
  truncated: z.boolean(),
});
export type ListResourcesResponse = z.infer<typeof listResourcesResponseSchema>;

export const archiveResourceInputSchema = emptyBody;
