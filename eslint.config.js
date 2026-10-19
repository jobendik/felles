// ESLint 9 flat config. Layering (AD-1), time and clock bans (AD-5, AD-6), SQL rules (AD-1, AD-9, AD-16,
// AD-18), unit-of-work (AD-7), test hygiene (AD-26) and the UI literal bans (AD-22) are enforced here.
// Every custom rule has a failing fixture and a compliant twin in eslint-fixtures/cases.mjs (NFR-02).
import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import felles from "./scripts/eslint-plugin-felles.mjs";

const TS = "**/*.{ts,tsx}";
const SRC = ["apps/*/src/**/*.{ts,tsx}", "packages/*/src/**/*.ts"];
const TESTS = ["**/*.test.{ts,tsx,mjs}", "**/test/**", "e2e/**", "eslint-fixtures/**"];
const API = "apps/api/**/*.{ts,tsx}";

const ERR = "error";

// ---- import restrictions (core no-restricted-imports, composed per directory) ----
const TEMPORAL = {
  name: "temporal-polyfill",
  message: "Import temporal-polyfill only from platform/oslo-time.ts (AD-5).",
};
const webOnly = [
  { name: "react" },
  { name: "react-dom" },
  { name: "react-router" },
  { name: "react-aria-components" },
  { name: "@tanstack/react-query" },
].map((p) => ({ ...p, message: "The API and contracts do not use web libraries (AD-1)." }));
const apiOnly = [
  { name: "@felles/api" },
  { name: "better-sqlite3" },
  { name: "fastify" },
  { name: "pino" },
  TEMPORAL,
].map((p) => ({ message: "The web does not import API code or server libraries (AD-1).", ...p }));

function restrict(paths, regexes = []) {
  return [ERR, { paths, patterns: regexes.map(([regex, message]) => ({ regex, message })) }];
}

const R = {
  appsWeb: ["(^|/)(apps/)?web/src(/|$)", "The API never imports the web (AD-1)."],
  appsApi: ["(^|/)(apps/)?api/src(/|$)", "The web never imports the API (AD-1)."],
  apps: ["(^|/)apps/", "contracts imports nothing from the apps (AD-2)."],
  app: [
    "^(\\.\\./)+app(/|$)",
    "Only the composition root app/ imports features; nothing imports app/ (AD-1).",
  ],
  features: ["^(\\.\\./)+features(/|$)", "Features are imported only by app/ (AD-1)."],
  ui: ["^(\\.\\./)+ui(/|$)", "api/ and i18n/ never import ui/ (AD-1)."],
  i18n: ["^(\\.\\./)+i18n(/|$)", "This layer does not import i18n/ (AD-1)."],
  apiLayer: ["^(\\.\\./)+api(/|$)", "This layer does not import api/ (AD-1)."],
  apiExceptLinks: ["^(\\.\\./)+api/(?!links(\\.|/|$))", "ui/ may import only api/links (AD-1)."],
  i18nExceptFormat: [
    "^(\\.\\./)+i18n/(?!format(\\.|/|$))",
    "api/ may import only i18n/format (AD-1).",
  ],
  moduleInternals: [
    "^(\\.\\./)+(auth|resources|bookings|activity|dashboard)/(?!index$).+",
    "Modules call each other only through the other module's index.ts (AD-1).",
  ],
  activityToBookings: [
    "^(\\.\\./)+bookings(/|$)",
    "The dependency is one-way, bookings to activity (AD-1).",
  ],
  platformUp: [
    "^(\\.\\./)+(modules|http)(/|$)",
    "platform/ does not import modules or http (AD-1).",
  ],
};

const webBasePaths = apiOnly;
const featureDepthBlocks = [1, 2, 3, 4, 5].map((depth) => ({
  files: [`apps/web/src/features/*/${"*/".repeat(depth - 1)}*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": restrict(webBasePaths, [
      R.appsApi,
      R.app,
      [
        `^(\\.\\./){${depth}}(?!\\.\\.)`,
        "A feature never imports another feature (AD-1); share through api/, ui/ or i18n/.",
      ],
    ]),
  },
}));

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "playwright-report/**",
      "test-results/**",
      "data/**",
      "_bmad/**",
      "_bmad-output/**",
      ".claude/**",
      "docs/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: { ...globals.node }, sourceType: "module" },
  },
  {
    files: [TS],
    extends: [tseslint.configs.recommended],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        ERR,
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ERR,
    },
  },
  { plugins: { felles } },

  // ---- layering ----
  {
    files: ["packages/contracts/**/*.ts"],
    rules: {
      "no-restricted-imports": restrict(
        [
          { name: "@felles/api" },
          { name: "@felles/web" },
          { name: "better-sqlite3" },
          { name: "fastify" },
          { name: "pino" },
          TEMPORAL,
          ...webOnly,
        ].map((p) => ({
          message: "contracts has no I/O, no environment access and no app imports (AD-2).",
          ...p,
        })),
        [R.apps],
      ),
    },
  },
  {
    files: ["apps/api/src/**/*.ts"],
    rules: {
      "no-restricted-imports": restrict(
        [
          { name: "@felles/web", message: "The API never imports the web (AD-1)." },
          ...webOnly,
          TEMPORAL,
        ],
        [R.appsWeb],
      ),
    },
  },
  {
    files: ["apps/api/src/platform/**/*.ts"],
    ignores: ["apps/api/src/platform/oslo-time.ts"],
    rules: {
      "no-restricted-imports": restrict(
        [{ name: "@felles/web" }, ...webOnly, TEMPORAL],
        [R.appsWeb, R.platformUp],
      ),
    },
  },
  {
    files: ["apps/api/src/platform/oslo-time.ts"],
    rules: {
      "no-restricted-imports": restrict(
        [{ name: "@felles/web" }, ...webOnly],
        [R.appsWeb, R.platformUp],
      ),
    },
  },
  {
    files: ["apps/api/src/modules/**/*.ts"],
    rules: {
      "no-restricted-imports": restrict(
        [{ name: "@felles/web" }, ...webOnly, TEMPORAL],
        [R.appsWeb, R.moduleInternals],
      ),
    },
  },
  {
    files: ["apps/api/src/modules/activity/**/*.ts"],
    rules: {
      "no-restricted-imports": restrict(
        [{ name: "@felles/web" }, ...webOnly, TEMPORAL],
        [R.appsWeb, R.moduleInternals, R.activityToBookings],
      ),
    },
  },
  {
    files: ["apps/api/src/modules/*/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": restrict(
        [
          { name: "@felles/web" },
          { name: "fastify" },
          { name: "better-sqlite3" },
          ...webOnly,
          TEMPORAL,
        ],
        [R.appsWeb, R.moduleInternals],
      ),
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": restrict(webBasePaths, [R.appsApi]) },
  },
  {
    files: ["apps/web/src/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(webBasePaths, [
        R.appsApi,
        R.app,
        R.features,
        R.apiExceptLinks,
      ]),
    },
  },
  {
    files: ["apps/web/src/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(webBasePaths, [
        R.appsApi,
        R.app,
        R.features,
        R.ui,
        R.i18nExceptFormat,
      ]),
    },
  },
  {
    files: ["apps/web/src/i18n/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(webBasePaths, [
        R.appsApi,
        R.app,
        R.features,
        R.ui,
        R.apiLayer,
      ]),
    },
  },
  ...featureDepthBlocks,

  // ---- time and clock (AD-5, AD-6): source files only, tests exempt ----
  {
    files: SRC,
    ignores: TESTS,
    rules: { "felles/no-clock-reads": ERR, "felles/no-date-arithmetic": ERR },
  },
  {
    files: ["apps/api/src/platform/clock.ts", "apps/web/src/api/clock.ts"],
    rules: { "felles/no-clock-reads": "off" },
  },
  {
    files: [
      "apps/web/src/i18n/format.ts",
      "packages/contracts/src/time.ts",
      "apps/api/src/platform/oslo-time.ts",
    ],
    rules: { "felles/no-date-arithmetic": "off" },
  },

  // ---- SQL and persistence (AD-1, AD-7, AD-9, AD-16, AD-18) ----
  {
    files: [API, "scripts/**/*.mjs"],
    ignores: ["scripts/eslint-plugin-felles.mjs", "scripts/*.test.mjs"],
    rules: {
      "felles/no-sql-interpolation": ERR,
      "felles/no-or-replace": ERR,
      "felles/no-name-order-like": ERR,
    },
  },
  {
    files: [API],
    rules: { "felles/no-async-unit-of-work": ERR },
  },
  {
    files: ["apps/api/src/**/*.ts"],
    ignores: [
      "**/*.repository.ts",
      "**/*.sql.ts",
      "apps/api/src/platform/db.ts",
      "apps/api/src/platform/migrate.ts",
      ...TESTS,
    ],
    rules: { "felles/no-sql-outside-repositories": ERR },
  },
  {
    files: ["apps/api/src/modules/{auth,resources,dashboard}/**/*.ts"],
    rules: { "felles/no-foreign-table": [ERR, { tables: ["bookings", "activity_events"] }] },
  },
  {
    files: ["apps/api/src/modules/activity/**/*.ts"],
    rules: { "felles/no-foreign-table": [ERR, { tables: ["bookings"] }] },
  },
  {
    files: ["apps/api/src/modules/bookings/**/*.ts"],
    rules: { "felles/no-foreign-table": [ERR, { tables: ["activity_events"] }] },
  },

  // ---- tests (AD-26) ----
  {
    files: ["**/*.test.{ts,tsx,mjs}", "apps/api/test/**", "e2e/**"],
    rules: { "felles/no-test-modifiers": ERR },
  },
  {
    files: ["**/*.test.{ts,tsx}", "apps/api/test/**/*.ts", "e2e/**/*.ts"],
    ignores: ["apps/api/test/clients.ts", "e2e/support/**"],
    rules: { "felles/no-session-insert": ERR },
  },

  // ---- web UI rules (AD-22) ----
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    languageOptions: { globals: { ...globals.browser } },
    settings: { react: { version: "19.3" } },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      "react/no-danger": ERR,
      "react-hooks/rules-of-hooks": ERR,
      "react-hooks/exhaustive-deps": ERR,
    },
  },
  {
    files: ["apps/web/src/features/**/*.tsx", "apps/web/src/ui/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
    rules: { "react/jsx-no-literals": [ERR, { noStrings: true }] },
  },
  {
    files: ["apps/web/vite.config.ts", "vitest.config.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
);
