import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "contracts",
          include: ["packages/contracts/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "api",
          include: ["apps/api/**/*.test.ts"],
          environment: "node",
          fileParallelism: true,
        },
      },
      {
        test: {
          name: "web",
          include: ["apps/web/**/*.test.{ts,tsx}"],
          environment: "jsdom",
        },
      },
      {
        test: {
          name: "tooling",
          include: ["scripts/**/*.test.mjs", "eslint-fixtures/**/*.test.mjs"],
          environment: "node",
        },
      },
    ],
  },
});
