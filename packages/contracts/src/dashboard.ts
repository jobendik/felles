// DRAFT owned by S03 until `s03-accepted` (F2 freeze, AD-20): the dashboard (VIS-03, VIS-04, VIS-06).
import { z } from "zod";
import { bookingSchema } from "./bookings";
import { resourceColourSchema, resourceKindSchema, resourceSymbolSchema } from "./resources";
import { civilDateSchema, idSchema } from "./rules";

export const DASHBOARD_UPCOMING_MAX = 5;
export const DASHBOARD_TOP_MAX = 3;
export const DASHBOARD_CHART_DAYS = 7;

export const topResourceSchema = z.strictObject({
  resource: z.strictObject({
    id: idSchema,
    name: z.string(),
    kind: resourceKindSchema,
    symbol: resourceSymbolSchema,
    colour: resourceColourSchema,
  }),
  count: z.number().int().positive(),
});

/** One bar group per Oslo start day; pending bars exclude Expired requests. */
export const chartDaySchema = z.strictObject({
  date: civilDateSchema,
  confirmed: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
});

export const adminPanelSchema = z.strictObject({
  pending: z.strictObject({
    count: z.number().int().nonnegative(),
    expiredCount: z.number().int().nonnegative(),
  }),
  confirmedNext7d: z.number().int().nonnegative(),
  top: z.array(topResourceSchema).max(DASHBOARD_TOP_MAX),
  chart: z.array(chartDaySchema).length(DASHBOARD_CHART_DAYS),
});
export type AdminPanelDto = z.infer<typeof adminPanelSchema>;

/** `admin` is null for a Member; the web shows the Administrator panel iff `admin !== null` (AD-15). */
export const dashboardSchema = z.strictObject({
  upcoming: z.array(bookingSchema).max(DASHBOARD_UPCOMING_MAX),
  admin: adminPanelSchema.nullable(),
});
export type DashboardDto = z.infer<typeof dashboardSchema>;
