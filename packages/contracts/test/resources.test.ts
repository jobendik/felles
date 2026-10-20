import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  RESOURCE_COLOURS,
  RESOURCE_SYMBOLS,
  createResourceInputSchema,
  listResourcesQuerySchema,
  listResourcesResponseSchema,
  resourceSchema,
  resourceSummarySchema,
  updateResourceInputSchema,
} from "../src/index";
import { SAMPLE_RESOURCE, SAMPLE_RESOURCE_SUMMARY } from "./samples";

const designPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../_bmad-output/planning-artifacts/ux-designs/ux-felles-pilot-2026-10-19/DESIGN.md",
);

describe("resource contracts", () => {
  it("[RES-02] the symbol and colour lists equal DESIGN.md (@1.4)", () => {
    const design = readFileSync(designPath, "utf8");
    const section = design
      .split("### Resource symbols and colours")[1]!
      .split("## Do's and Don'ts")[0]!;
    const symbols: Record<string, string> = {};
    const colours: Record<string, string> = {};
    for (const line of section.split(/\r?\n/)) {
      const cells = line.split("|").map((cell) => cell.trim());
      if (cells.length < 7) continue;
      const symbol = /^`([a-z-]+)`$/.exec(cells[1] ?? "");
      if (symbol !== null) symbols[symbol[1]!] = cells[2]!;
      const colour = /^`([a-z]+)`$/.exec(cells[4] ?? "");
      if (colour !== null) colours[colour[1]!] = cells[5]!;
    }
    expect(RESOURCE_SYMBOLS).toEqual(symbols);
    expect(RESOURCE_COLOURS).toEqual(colours);
    expect(Object.keys(symbols)).toHaveLength(10);
    expect(Object.keys(colours)).toHaveLength(8);
    for (const id of Object.keys(colours)) {
      expect(design).toContain(`res-${id}:`);
      expect(design).toContain(`res-${id}-tint:`);
    }
  });

  it("[RES-02] parses the DTOs, with seats and description optional (@1.4)", () => {
    expect(resourceSchema.safeParse(SAMPLE_RESOURCE).success).toBe(true);
    expect(
      resourceSchema.safeParse({ ...SAMPLE_RESOURCE, seats: null, description: null }).success,
    ).toBe(true);
    expect(resourceSchema.safeParse({ ...SAMPLE_RESOURCE, symbol: "sparkles" }).success).toBe(
      false,
    );
    expect(resourceSchema.safeParse({ ...SAMPLE_RESOURCE, colour: "magenta" }).success).toBe(false);
    expect(resourceSummarySchema.safeParse(SAMPLE_RESOURCE_SUMMARY).success).toBe(true);
    expect(
      listResourcesResponseSchema.safeParse({ items: [SAMPLE_RESOURCE], truncated: false }).success,
    ).toBe(true);
  });

  it("[RES-03] the create input is strict and has no status; PATCH cannot carry status (@1.4)", () => {
    const create = {
      name: "Podkaststudio",
      kind: "room",
      location: "Kjeller",
      symbol: "mic",
      colour: "lilla",
      approvalRequired: true,
    };
    expect(createResourceInputSchema.safeParse(create).success).toBe(true);
    expect(createResourceInputSchema.safeParse({ ...create, status: "archived" }).success).toBe(
      false,
    );
    expect(createResourceInputSchema.safeParse({ ...create, id: 9 }).success).toBe(false);
    expect(createResourceInputSchema.safeParse({ ...create, seats: 0 }).success).toBe(false);
    expect(createResourceInputSchema.safeParse({ ...create, seats: 1001 }).success).toBe(false);
    expect(updateResourceInputSchema.safeParse({ status: "active" }).success).toBe(false);
    expect(updateResourceInputSchema.parse({})).toEqual({});
    expect(updateResourceInputSchema.parse({ seats: null, description: "" })).toEqual({
      seats: null,
      description: null,
    });
    expect(updateResourceInputSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("[RES-01] the list query defaults status to active and bounds q and limit (@1.4)", () => {
    expect(listResourcesQuerySchema.parse({})).toEqual({ status: "active", limit: 100 });
    expect(
      listResourcesQuerySchema.parse({ status: "all", kind: "room", q: " Møte ", limit: "50" }),
    ).toEqual({ status: "all", kind: "room", q: "Møte", limit: 50 });
    expect(listResourcesQuerySchema.safeParse({ status: "deleted" }).success).toBe(false);
    expect(listResourcesQuerySchema.safeParse({ q: "x".repeat(81) }).success).toBe(false);
  });
});
