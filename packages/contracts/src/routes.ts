// The route table (AD-3): every route is an entry here with method, path, access, owner slice, schemas and
// error codes. Handlers are registered only through registerRoute(contract, handler) (Story 1.8).
import { z } from "zod";
import { listActivityQuerySchema, listActivityResponseSchema } from "./activity";
import {
  approveBookingInputSchema,
  bookingDetailSchema,
  bookingSchema,
  cancelBookingInputSchema,
  createBookingInputSchema,
  listBookingsQuerySchema,
  listBookingsResponseSchema,
  rejectBookingInputSchema,
} from "./bookings";
import { dashboardSchema } from "./dashboard";
import type { ErrorCode } from "./errors";
import {
  archiveResourceInputSchema,
  createResourceInputSchema,
  listResourcesQuerySchema,
  listResourcesResponseSchema,
  resourceSchema,
  updateResourceInputSchema,
} from "./resources";
import { scheduleQuerySchema, scheduleSchema } from "./schedule";
import { emptyBody, idParam } from "./rules";
import { loginInputSchema, loginResponseSchema, sessionSchema } from "./session";

export const ROUTE_ACCESS = ["public", "authenticated", "admin"] as const;
export type RouteAccess = (typeof ROUTE_ACCESS)[number];

export const SLICES = ["S00", "S01", "S02", "S03", "S04", "S05", "S06", "S07"] as const;
export type SliceId = (typeof SLICES)[number];

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface RouteContract {
  readonly id: string;
  readonly method: HttpMethod;
  /** Fastify-style path with `:param` segments. */
  readonly path: string;
  readonly access: RouteAccess;
  /** The slice that implements the handler; S00 registers a 501 stub for the others (AD-3). */
  readonly owner: SliceId;
  readonly params: z.ZodType | null;
  readonly query: z.ZodType | null;
  /** Mutations always declare a body; bodyless ones declare the empty strict object (AD-13). */
  readonly body: z.ZodType | null;
  /** The success response body, or null for 204. */
  readonly response: z.ZodType | null;
  readonly successStatus: 200 | 201 | 204;
  /** Every error code this route can answer, including the common ones. */
  readonly errors: readonly ErrorCode[];
  readonly summary: string;
}

const COMMON: ErrorCode[] = ["HOST_REFUSED", "INTERNAL", "NOT_IMPLEMENTED"];
const GUARDED: ErrorCode[] = [...COMMON, "UNAUTHENTICATED"];

function errorsFor(options: {
  access: RouteAccess;
  method: HttpMethod;
  input: boolean;
  extra?: ErrorCode[];
}): ErrorCode[] {
  const codes = new Set<ErrorCode>(options.access === "public" ? COMMON : GUARDED);
  if (options.access === "admin") codes.add("FORBIDDEN");
  if (options.method !== "GET") {
    codes.add("ORIGIN_REFUSED");
    codes.add("DATABASE_BUSY");
  }
  if (options.input) codes.add("VALIDATION_FAILED");
  for (const code of options.extra ?? []) codes.add(code);
  return [...codes];
}

function route(definition: Omit<RouteContract, "errors"> & { extra?: ErrorCode[] }): RouteContract {
  const { extra, ...rest } = definition;
  return {
    ...rest,
    errors: errorsFor({
      access: rest.access,
      method: rest.method,
      input: rest.params !== null || rest.query !== null || rest.body !== null,
      extra,
    }),
  };
}

export const ROUTES = {
  health: route({
    id: "health",
    method: "GET",
    path: "/api/health",
    access: "public",
    owner: "S00",
    params: null,
    query: null,
    body: null,
    response: z.strictObject({ status: z.literal("ok") }),
    successStatus: 200,
    summary: "Liveness probe",
  }),
  sessionGet: route({
    id: "sessionGet",
    method: "GET",
    path: "/api/session",
    access: "public",
    owner: "S00",
    params: null,
    query: null,
    body: null,
    response: sessionSchema,
    successStatus: 200,
    summary: "The signed-in user or null, the server time and whether the data is synthetic",
  }),
  sessionLogin: route({
    id: "sessionLogin",
    method: "POST",
    path: "/api/session",
    access: "public",
    owner: "S01",
    params: null,
    query: null,
    body: loginInputSchema,
    response: loginResponseSchema,
    successStatus: 200,
    extra: ["INVALID_CREDENTIALS", "RATE_LIMITED"],
    summary: "Sign in with e-mail and password; sets the session cookie",
  }),
  sessionLogout: route({
    id: "sessionLogout",
    method: "DELETE",
    path: "/api/session",
    access: "authenticated",
    owner: "S01",
    params: null,
    query: null,
    body: emptyBody,
    response: null,
    successStatus: 204,
    summary: "Sign out",
  }),
  resourcesList: route({
    id: "resourcesList",
    method: "GET",
    path: "/api/resources",
    access: "authenticated",
    owner: "S02",
    params: null,
    query: listResourcesQuerySchema,
    body: null,
    response: listResourcesResponseSchema,
    successStatus: 200,
    extra: ["FORBIDDEN"],
    summary: "List resources; a Member may not ask for archived or all",
  }),
  resourcesCreate: route({
    id: "resourcesCreate",
    method: "POST",
    path: "/api/resources",
    access: "admin",
    owner: "S02",
    params: null,
    query: null,
    body: createResourceInputSchema,
    response: resourceSchema,
    successStatus: 201,
    summary: "Create a resource",
  }),
  resourcesGet: route({
    id: "resourcesGet",
    method: "GET",
    path: "/api/resources/:id",
    access: "authenticated",
    owner: "S02",
    params: idParam,
    query: null,
    body: null,
    response: resourceSchema,
    successStatus: 200,
    extra: ["NOT_FOUND"],
    summary: "One resource; archived resources stay readable",
  }),
  resourcesUpdate: route({
    id: "resourcesUpdate",
    method: "PATCH",
    path: "/api/resources/:id",
    access: "admin",
    owner: "S02",
    params: idParam,
    query: null,
    body: updateResourceInputSchema,
    response: resourceSchema,
    successStatus: 200,
    extra: ["NOT_FOUND", "RESOURCE_ARCHIVED"],
    summary: "Edit a resource; an archived resource cannot be edited and status cannot be changed",
  }),
  resourcesArchive: route({
    id: "resourcesArchive",
    method: "POST",
    path: "/api/resources/:id/archive",
    access: "admin",
    owner: "S02",
    params: idParam,
    query: null,
    body: archiveResourceInputSchema,
    response: resourceSchema,
    successStatus: 200,
    extra: ["NOT_FOUND", "RESOURCE_ARCHIVED", "RESOURCE_HAS_FUTURE_BOOKINGS"],
    summary: "Archive a resource that has no future pending or confirmed booking",
  }),
  resourceSchedule: route({
    id: "resourceSchedule",
    method: "GET",
    path: "/api/resources/:id/schedule",
    access: "authenticated",
    owner: "S03",
    params: idParam,
    query: scheduleQuerySchema,
    body: null,
    response: scheduleSchema,
    successStatus: 200,
    extra: ["NOT_FOUND"],
    summary: "Blocks of one resource for 1 to 7 Oslo days, shaped per viewer",
  }),
  bookingsList: route({
    id: "bookingsList",
    method: "GET",
    path: "/api/bookings",
    access: "authenticated",
    owner: "S03",
    params: null,
    query: listBookingsQuerySchema,
    body: null,
    response: listBookingsResponseSchema,
    successStatus: 200,
    extra: ["FORBIDDEN"],
    summary: "List bookings; scope=all is for Administrators",
  }),
  bookingsCreate: route({
    id: "bookingsCreate",
    method: "POST",
    path: "/api/bookings",
    access: "authenticated",
    owner: "S03",
    params: null,
    query: null,
    body: createBookingInputSchema,
    response: bookingSchema,
    successStatus: 201,
    extra: ["NOT_FOUND", "BOOKING_CONFLICT", "RESOURCE_ARCHIVED"],
    summary: "Create a booking (confirmed at once, or pending when the resource needs approval)",
  }),
  bookingsGet: route({
    id: "bookingsGet",
    method: "GET",
    path: "/api/bookings/:id",
    access: "authenticated",
    owner: "S03",
    params: idParam,
    query: null,
    body: null,
    response: bookingDetailSchema,
    successStatus: 200,
    extra: ["FORBIDDEN", "NOT_FOUND"],
    summary: "One booking with its events; the owner or an Administrator only",
  }),
  bookingCancel: route({
    id: "bookingCancel",
    method: "POST",
    path: "/api/bookings/:id/cancel",
    access: "authenticated",
    owner: "S05",
    params: idParam,
    query: null,
    body: cancelBookingInputSchema,
    response: bookingSchema,
    successStatus: 200,
    extra: ["FORBIDDEN", "NOT_FOUND", "BOOKING_NOT_CANCELLABLE", "BOOKING_STARTED"],
    summary: "Cancel a pending or confirmed booking before its start",
  }),
  bookingApprove: route({
    id: "bookingApprove",
    method: "POST",
    path: "/api/bookings/:id/approve",
    access: "admin",
    owner: "S05",
    params: idParam,
    query: null,
    body: approveBookingInputSchema,
    response: bookingSchema,
    successStatus: 200,
    extra: [
      "NOT_FOUND",
      "OWN_REQUEST",
      "BOOKING_NOT_PENDING",
      "BOOKING_STARTED",
      "RESOURCE_ARCHIVED",
    ],
    summary: "Approve a pending request that has not started",
  }),
  bookingReject: route({
    id: "bookingReject",
    method: "POST",
    path: "/api/bookings/:id/reject",
    access: "admin",
    owner: "S05",
    params: idParam,
    query: null,
    body: rejectBookingInputSchema,
    response: bookingSchema,
    successStatus: 200,
    extra: ["NOT_FOUND", "OWN_REQUEST", "BOOKING_NOT_PENDING"],
    summary: "Reject a pending request with a reason; also works on an Expired request",
  }),
  dashboardGet: route({
    id: "dashboardGet",
    method: "GET",
    path: "/api/dashboard",
    access: "authenticated",
    owner: "S06",
    params: null,
    query: null,
    body: null,
    response: dashboardSchema,
    successStatus: 200,
    summary: "Upcoming own bookings; Administrators also get the 7-day panel",
  }),
  activityList: route({
    id: "activityList",
    method: "GET",
    path: "/api/activity",
    access: "authenticated",
    owner: "S06",
    params: null,
    query: listActivityQuerySchema,
    body: null,
    response: listActivityResponseSchema,
    successStatus: 200,
    extra: ["FORBIDDEN"],
    summary: "Activity events newest first, scoped by role",
  }),
} as const satisfies Record<string, RouteContract>;

export type RouteId = keyof typeof ROUTES;
export const ROUTE_LIST: readonly RouteContract[] = Object.values(ROUTES);
