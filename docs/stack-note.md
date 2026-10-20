# FELLES stack note (Story 1.1)

Recorded on 2026-10-19 at the start of S00 on Windows 11, per AD-27 ("recording the exact Node minor").

## Verified toolchain

| Item                    | Value                                               |
| ----------------------- | --------------------------------------------------- |
| Node.js                 | 24.22.0 LTS (Krypton), installed from nodejs.org MSI |
| npm                     | 11.21.1 (the user-level global npm; Node 24.22.0 bundles 11.19.1) |
| Engines (root)          | node `^24.15.0 \|\| >=26.0.0`, npm `>=11.12`, `engine-strict=true` |
| TypeScript              | 6.0.3 (`types` is explicit per workspace; no `baseUrl`)  |
| `@types/node`           | 24.19.2 (exact)                                     |
| better-sqlite3          | 13.0.3, SQLite 3.53.4, prebuilt binary; loaded after `npm run setup:native` |
| Everything else         | exact versions of the architecture Stack table, recorded in `package.json` and the lockfile |

`.npmrc` sets `ignore-scripts=true`, so `npm ci` runs no install scripts. `npm run setup:native` rebuilds `better-sqlite3` with `--ignore-scripts=false` and loads it as a check. `npm install-scripts ls` reports two packages with install scripts; only `better-sqlite3` needs one at runtime.

## Verified idioms

- **ESLint 9.39.5 (flat config):** `eslint.config.js` uses `typescript-eslint` `tseslint.config(...)`. Later config blocks replace a rule's options for the files they match, so layer restrictions for `no-restricted-imports` are composed per directory (each block lists its complete restriction set). Custom rules live in `scripts/eslint-plugin-felles.mjs`, referenced as `felles/<rule>`. Each rule has a failing fixture and a compliant twin in `eslint-fixtures/cases.mjs`, run by `scripts/lint-gate.test.mjs` (`[NFR-02] verify gate rejects a violation`).
- **Vitest 5.0.5:** one root `vitest.config.ts` with `test.projects` (`contracts`, `api`, `web` with jsdom, and `tooling` for the lint-gate fixtures). `npm run test` is `vitest run`; filter a story with `-t "\(@N\.M\)"`.
- **Vite 8.3.4:** uses Rolldown; `@vitejs/plugin-react` 6.1.2. `build.assetsInlineLimit: 0` keeps fonts as files (AD-22). The dev server binds 127.0.0.1 with `strictPort` and proxies `/api`.
- **React Router 8.4.0:** `react-router` exports `createBrowserRouter`, `createMemoryRouter`, `RouterProvider`, `Link`, `NavLink`, `Outlet`, `useNavigate`, `useLocation` and `useSearchParams` (single package, no `react-router-dom`). Behaviour is exercised in Story 1.27.
- **esbuild 0.28.2:** `scripts/build-api.mjs` bundles `apps/api/src/server.ts` to `apps/api/dist/server.mjs`, inlining `@felles/*` and keeping npm dependencies external.

## Layer reading recorded for lint

The diagram arrows are enforced as follows (documented decision of Story 1.1): in `apps/web/src`, `ui` may import `i18n/*` and `api/links` only; `api` may import `i18n/format` only and never `ui`; `i18n` imports no other web layer; `features` import neither `app` nor another feature; `app` may import everything. In `apps/api/src`, `modules/*` call each other only through `index.ts`, `activity` never imports `bookings`, `domain` imports neither `fastify` nor `better-sqlite3`, `platform` imports neither `modules` nor `http`, and `temporal-polyfill` is importable only from `platform/oslo-time.ts`.

## Environment notes

- Windows: `core.autocrlf=true` is set on the pilot machine; `.gitattributes` (`* text=auto eol=lf`) and Prettier `endOfLine: lf` make checkouts LF, so migration checksums and the schema snapshot do not depend on it.
- Node 25 is refused at install time by `engine-strict` with the message "Unsupported engine" naming `^24.15.0 || >=26.0.0`.
