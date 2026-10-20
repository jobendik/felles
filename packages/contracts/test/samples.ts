// Canonical samples shared by the contract tests. Instants are in the 2026-10-19 week used by the seeded runs.

export const SAMPLE_USER = { id: 2, name: "Ingrid Moe", role: "member" } as const;

export const SAMPLE_RESOURCE = {
  id: 3,
  name: "Fjellet",
  kind: "room",
  description: "Møterom for åtte",
  location: "2. etasje",
  seats: 8,
  symbol: "users",
  colour: "bla",
  approvalRequired: false,
  status: "active",
} as const;

export const SAMPLE_RESOURCE_SUMMARY = {
  id: 3,
  name: "Fjellet",
  kind: "room",
  location: "2. etasje",
  symbol: "users",
  colour: "bla",
  status: "active",
} as const;

export const SAMPLE_EVENT = {
  id: 41,
  type: "booking.created",
  at: "2026-10-19T07:00:00.000Z",
  actor: { id: 2, name: "Ingrid Moe" },
  bookingId: 1047,
  resource: { id: 3, name: "Fjellet" },
  payload: { status: "confirmed" },
} as const;

export const SAMPLE_BOOKING = {
  id: 1047,
  resource: SAMPLE_RESOURCE_SUMMARY,
  userId: 2,
  booker: null,
  purpose: "Sprintplanlegging",
  start: "2026-10-20T08:00:00.000Z",
  end: "2026-10-20T09:00:00.000Z",
  createdAt: "2026-10-19T07:00:00.000Z",
  status: "pending",
  expired: false,
  decision: null,
  cancellation: null,
} as const;

export const SAMPLE_BOOKING_CONFIRMED = {
  ...SAMPLE_BOOKING,
  booker: { name: "Ingrid Moe" },
  status: "confirmed",
  decision: {
    outcome: "approved",
    by: { id: 1, name: "Magnus Berg" },
    at: "2026-10-19T08:00:00.000Z",
    reason: null,
  },
} as const;

export const SAMPLE_BOOKING_CANCELLED = {
  ...SAMPLE_BOOKING,
  status: "cancelled",
  cancellation: {
    by: { id: 1, name: "Magnus Berg" },
    byRole: "admin",
    at: "2026-10-19T09:00:00.000Z",
    reason: "Rommet er stengt",
  },
} as const;

export const SAMPLE_BOOKING_REJECTED = {
  ...SAMPLE_BOOKING,
  status: "rejected",
  decision: {
    outcome: "rejected",
    by: { id: 1, name: "Magnus Berg" },
    at: "2026-10-19T08:00:00.000Z",
    reason: "Utstyret er på service",
  },
} as const;

export const SAMPLE_BOOKING_DETAIL = { ...SAMPLE_BOOKING, events: [SAMPLE_EVENT] } as const;

export const SAMPLE_BLOCKS = [
  {
    kind: "detail",
    bookingId: 1047,
    bookerName: "Ingrid Moe",
    purpose: "Sprintplanlegging",
    status: "confirmed",
    expired: false,
    start: "2026-10-20T08:00:00.000Z",
    end: "2026-10-20T09:00:00.000Z",
  },
  {
    kind: "anonymous",
    status: "pending",
    start: "2026-10-20T10:00:00.000Z",
    end: "2026-10-20T11:00:00.000Z",
  },
] as const;

export const SAMPLE_SCHEDULE = {
  resource: SAMPLE_RESOURCE_SUMMARY,
  from: "2026-10-19",
  days: 7,
  blocks: SAMPLE_BLOCKS,
} as const;

export const SAMPLE_CHART = [0, 1, 2, 3, 4, 5, 6].map((offset) => ({
  date: `2026-10-${String(19 + offset).padStart(2, "0")}`,
  confirmed: offset,
  pending: offset % 2,
}));

export const SAMPLE_DASHBOARD_ADMIN = {
  upcoming: [SAMPLE_BOOKING],
  admin: {
    pending: { count: 3, expiredCount: 1 },
    confirmedNext7d: 9,
    top: [
      {
        resource: { id: 3, name: "Fjellet", kind: "room", symbol: "users", colour: "bla" },
        count: 4,
      },
    ],
    chart: SAMPLE_CHART,
  },
} as const;

export const SAMPLE_DASHBOARD_MEMBER = { upcoming: [SAMPLE_BOOKING], admin: null } as const;

export const SAMPLE_CREATE_BOOKING = {
  resourceId: 3,
  date: "2026-10-20",
  start: "10:00",
  end: "11:00",
  purpose: "Sprintplanlegging",
} as const;
