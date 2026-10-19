import { describe, expect, it } from "vitest";
import { ERROR_CODES, ERROR_STATUS, ROUTES, ROUTE_LIST, SLICES, type RouteId } from "../src/index";
import {
  SAMPLE_BOOKING,
  SAMPLE_BOOKING_DETAIL,
  SAMPLE_DASHBOARD_ADMIN,
  SAMPLE_EVENT,
  SAMPLE_RESOURCE,
  SAMPLE_SCHEDULE,
  SAMPLE_USER,
} from "./samples";

/** A canonical success body for every route that has one. */
const RESPONSE_SAMPLES: Record<RouteId, unknown> = {
  health: { status: "ok" },
  sessionGet: { user: SAMPLE_USER, serverNow: "2026-10-19T07:00:00.000Z", demoData: true },
  sessionLogin: { user: SAMPLE_USER },
  sessionLogout: null,
  resourcesList: { items: [SAMPLE_RESOURCE], truncated: false },
  resourcesCreate: SAMPLE_RESOURCE,
  resourcesGet: SAMPLE_RESOURCE,
  resourcesUpdate: SAMPLE_RESOURCE,
  resourcesArchive: { ...SAMPLE_RESOURCE, status: "archived" },
  resourceSchedule: SAMPLE_SCHEDULE,
  bookingsList: { items: [SAMPLE_BOOKING], truncated: false },
  bookingsCreate: SAMPLE_BOOKING,
  bookingsGet: SAMPLE_BOOKING_DETAIL,
  bookingCancel: SAMPLE_BOOKING,
  bookingApprove: SAMPLE_BOOKING,
  bookingReject: SAMPLE_BOOKING,
  dashboardGet: SAMPLE_DASHBOARD_ADMIN,
  activityList: { items: [SAMPLE_EVENT], nextBefore: null },
};

const EXPECTED_OWNERS: Record<RouteId, string> = {
  health: "S00",
  sessionGet: "S00",
  sessionLogin: "S01",
  sessionLogout: "S01",
  resourcesList: "S02",
  resourcesCreate: "S02",
  resourcesGet: "S02",
  resourcesUpdate: "S02",
  resourcesArchive: "S02",
  resourceSchedule: "S03",
  bookingsList: "S03",
  bookingsCreate: "S03",
  bookingsGet: "S03",
  bookingCancel: "S05",
  bookingApprove: "S05",
  bookingReject: "S05",
  dashboardGet: "S06",
  activityList: "S06",
};

describe("route table", () => {
  it("[BR-4] contains exactly the 18 routes of the Contract Minimums with the documented owners (@1.4)", () => {
    expect(ROUTE_LIST).toHaveLength(18);
    for (const [id, owner] of Object.entries(EXPECTED_OWNERS)) {
      expect(ROUTES[id as RouteId].owner, id).toBe(owner);
      expect(SLICES).toContain(owner);
    }
    const keys = ROUTE_LIST.map((r) => `${r.method} ${r.path}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(ROUTE_LIST.map((r) => r.id)).size).toBe(ROUTE_LIST.length);
    for (const [key, route] of Object.entries(ROUTES)) expect(route.id).toBe(key);
  });

  it("[AUT-03] access: only health, GET session and login are public; admin routes are the approved set (@1.4)", () => {
    const publicIds = ROUTE_LIST.filter((r) => r.access === "public").map((r) => r.id);
    expect(publicIds.sort()).toEqual(["health", "sessionGet", "sessionLogin"]);
    const adminIds = ROUTE_LIST.filter((r) => r.access === "admin").map((r) => r.id);
    expect(adminIds.sort()).toEqual(
      [
        "bookingApprove",
        "bookingReject",
        "resourcesArchive",
        "resourcesCreate",
        "resourcesUpdate",
      ].sort(),
    );
  });

  it("[BR-4] every route lists error codes that match its access, method and input (@1.4)", () => {
    for (const route of ROUTE_LIST) {
      for (const code of route.errors) expect(ERROR_CODES, `${route.id} ${code}`).toContain(code);
      expect(route.errors, route.id).toContain("HOST_REFUSED");
      expect(route.errors, route.id).toContain("INTERNAL");
      if (route.access !== "public") expect(route.errors, route.id).toContain("UNAUTHENTICATED");
      if (route.access === "admin") expect(route.errors, route.id).toContain("FORBIDDEN");
      if (route.method !== "GET") {
        expect(route.errors, route.id).toContain("ORIGIN_REFUSED");
        expect(route.errors, route.id).toContain("DATABASE_BUSY");
      }
      if (route.body !== null || route.query !== null || route.params !== null) {
        expect(route.errors, route.id).toContain("VALIDATION_FAILED");
      }
    }
    expect(ROUTES.bookingsCreate.errors).toContain("BOOKING_CONFLICT");
    expect(ROUTES.bookingApprove.errors).toEqual(
      expect.arrayContaining([
        "OWN_REQUEST",
        "BOOKING_NOT_PENDING",
        "BOOKING_STARTED",
        "RESOURCE_ARCHIVED",
      ]),
    );
    expect(ROUTES.bookingCancel.errors).toEqual(
      expect.arrayContaining(["BOOKING_NOT_CANCELLABLE", "BOOKING_STARTED"]),
    );
    expect(ROUTES.resourcesArchive.errors).toContain("RESOURCE_HAS_FUTURE_BOOKINGS");
    expect(ROUTES.sessionLogin.errors).toEqual(
      expect.arrayContaining(["INVALID_CREDENTIALS", "RATE_LIMITED"]),
    );
    for (const code of ROUTES.bookingApprove.errors)
      expect(ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
  });

  it("[BR-4] every mutation declares a body; bodyless ones declare the empty strict object (@1.4)", () => {
    for (const route of ROUTE_LIST.filter((r) => r.method !== "GET")) {
      expect(route.body, route.id).not.toBeNull();
    }
    for (const id of ["sessionLogout", "resourcesArchive", "bookingApprove"] as const) {
      const body = ROUTES[id].body!;
      expect(body.safeParse({}).success, id).toBe(true);
      expect(body.safeParse({ extra: 1 }).success, id).toBe(false);
    }
    for (const route of ROUTE_LIST.filter((r) => r.method === "GET"))
      expect(route.body, route.id).toBeNull();
  });

  it("[BR-4] path parameters are declared by a params schema (@1.4)", () => {
    for (const route of ROUTE_LIST) {
      const hasParam = route.path.includes(":");
      expect(route.params !== null, route.id).toBe(hasParam);
      if (hasParam) {
        expect(route.params!.safeParse({ id: "12" }).success).toBe(true);
        expect(route.params!.safeParse({ id: "0" }).success).toBe(false);
        expect(route.params!.safeParse({ id: "x" }).success).toBe(false);
        expect(route.params!.safeParse({ id: "1", other: "2" }).success).toBe(false);
      }
    }
  });

  it("[BR-4] list routes follow the limit rules: default 100 and max 200, activity 20 and 100 (@1.4)", () => {
    expect((ROUTES.resourcesList.query!.parse({}) as { limit: number }).limit).toBe(100);
    expect((ROUTES.bookingsList.query!.parse({}) as { limit: number }).limit).toBe(100);
    expect(ROUTES.resourcesList.query!.safeParse({ limit: "200" }).success).toBe(true);
    expect(ROUTES.resourcesList.query!.safeParse({ limit: "201" }).success).toBe(false);
    expect(ROUTES.bookingsList.query!.safeParse({ limit: "0" }).success).toBe(false);
    expect((ROUTES.activityList.query!.parse({}) as { limit: number }).limit).toBe(20);
    expect(ROUTES.activityList.query!.safeParse({ limit: "100" }).success).toBe(true);
    expect(ROUTES.activityList.query!.safeParse({ limit: "101" }).success).toBe(false);
    expect(ROUTES.activityList.query!.parse({ before: "55" })).toMatchObject({ before: 55 });
    expect(ROUTES.activityList.query!.safeParse({ before: "-1" }).success).toBe(false);
    for (const unknownKey of [{ userId: "3" }, { scope: "all", userId: "3" }]) {
      expect(ROUTES.bookingsList.query!.safeParse(unknownKey).success).toBe(false);
    }
  });

  it("[BR-4] list responses are { items, truncated } and activity is { items, nextBefore } (@1.4)", () => {
    for (const id of ["resourcesList", "bookingsList"] as const) {
      const response = ROUTES[id].response!;
      expect(response.safeParse(RESPONSE_SAMPLES[id]).success).toBe(true);
      expect(response.safeParse({ items: [] }).success, `${id} needs truncated`).toBe(false);
      expect(response.safeParse({ items: [], truncated: false }).success).toBe(true);
    }
    expect(ROUTES.activityList.response!.safeParse({ items: [], nextBefore: 5 }).success).toBe(
      true,
    );
    expect(ROUTES.activityList.response!.safeParse({ items: [], truncated: false }).success).toBe(
      false,
    );
  });

  it("[BR-4] a canonical response parses for every route and rejects a stray key (@1.4)", () => {
    for (const route of ROUTE_LIST) {
      const sample = RESPONSE_SAMPLES[route.id as RouteId];
      if (route.response === null) {
        expect(route.successStatus).toBe(204);
        continue;
      }
      expect(route.response.safeParse(sample).success, route.id).toBe(true);
      expect(
        route.response.safeParse({ ...(sample as object), leak: 1 }).success,
        `${route.id} strict`,
      ).toBe(false);
    }
    expect([ROUTES.resourcesCreate.successStatus, ROUTES.bookingsCreate.successStatus]).toEqual([
      201, 201,
    ]);
    expect(ROUTES.sessionLogout.successStatus).toBe(204);
    expect(ROUTES.sessionLogin.successStatus).toBe(200);
  });
});
