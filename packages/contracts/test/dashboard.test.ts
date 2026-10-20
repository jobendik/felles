import { describe, expect, it } from "vitest";
import { adminPanelSchema, dashboardSchema } from "../src/index";
import { SAMPLE_BOOKING, SAMPLE_DASHBOARD_ADMIN, SAMPLE_DASHBOARD_MEMBER } from "./samples";

describe("dashboard contracts (draft, S03)", () => {
  it("[VIS-03] a Member dashboard has admin: null and an Administrator has the panel (@1.4)", () => {
    expect(dashboardSchema.safeParse(SAMPLE_DASHBOARD_MEMBER).success).toBe(true);
    expect(dashboardSchema.safeParse(SAMPLE_DASHBOARD_ADMIN).success).toBe(true);
    expect(dashboardSchema.safeParse({ upcoming: [] }).success).toBe(false);
  });

  it("[VIS-06] the chart always has seven entries and the panel at most three top resources (@1.4)", () => {
    const panel = SAMPLE_DASHBOARD_ADMIN.admin;
    expect(adminPanelSchema.safeParse({ ...panel, chart: panel.chart.slice(0, 6) }).success).toBe(
      false,
    );
    expect(
      adminPanelSchema.safeParse({ ...panel, chart: [...panel.chart, panel.chart[0]] }).success,
    ).toBe(false);
    expect(adminPanelSchema.safeParse({ ...panel, top: Array(4).fill(panel.top[0]) }).success).toBe(
      false,
    );
    expect(adminPanelSchema.safeParse({ ...panel, top: [] }).success).toBe(true);
  });

  it("[VIS-03] upcoming holds at most five bookings (@1.4)", () => {
    expect(
      dashboardSchema.safeParse({ upcoming: Array(5).fill(SAMPLE_BOOKING), admin: null }).success,
    ).toBe(true);
    expect(
      dashboardSchema.safeParse({ upcoming: Array(6).fill(SAMPLE_BOOKING), admin: null }).success,
    ).toBe(false);
  });
});
