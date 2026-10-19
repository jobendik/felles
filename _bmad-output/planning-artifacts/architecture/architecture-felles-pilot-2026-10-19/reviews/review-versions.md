# Review: version and fit verification (2026-10-19)

Method: `npm view <pkg>@<ver> version peerDependencies engines` for every Stack row; real `npm install` / `--dry-run` of the whole stack in scratch dirs (npm 11.3.0 local, npm 11.12.1 = bundled with Node 24.15, npm 11.19.1 = bundled with Node 24.22, npm 11.21.1 = latest 11.x); runtime spikes with better-sqlite3 13.0.3 and @fastify/helmet 13.2.0; web fetches. Local machine is Node v25.9.0 (EOL). The spine was not edited.

## Verdict: PASS WITH FIXES. All 34 pinned versions exist and are the registry `latest` today (except TypeScript, deliberately held at 6.0.x). The pins are real, not training-data guesses. But the stack does not install cleanly as written, one specified header config breaks Safari, and the Node LTS framing is stale within a day.

Counts: critical 0, high 4, medium 5, low 5. Confirmed items: 40+.

## Findings

### HIGH

**H1. `@hookform/resolvers@6.0.0` fails `npm install` with ERESOLVE on the npm that ships with Node 24**
- Claim: Stack pins @hookform/resolvers 6.0.0 (zod ^3.25 || ^4 peer, "verified via npm registry").
- Evidence: 6.0.0 was published 2026-10-19T05:35Z (hours old, a new major). Peer metadata is fine, but `npm install @hookform/resolvers@6.0.0 react-hook-form@7.90.0 zod@4.6.7 react@19.3.1` gives `ERESOLVE ... Found: effect@3.22.3 / peerOptional effect@"^4.0.0" from @hookform/resolvers@6.0.0` on npm 11.3.0, 11.12.1 (Node 24.15) and 11.19.1 (Node 24.22). It succeeds only on npm 11.21.1. `npm ci` from a lockfile generated on 11.21 would work, but `engine-strict` plus "npm 11" does not guarantee 11.21.
- Verdict: wrong as a safe pin (the memlog only read registry metadata; nobody ran an install).
- Fix: pin `@hookform/resolvers` 5.9.2 (installs cleanly on all tested npm versions, zod ^3.25||^4 peer, published 2026-10-17), or keep 6.0.0 and state a minimum npm (`engines.npm >=11.21`) and `overrides`. Prefer 5.9.2 for a day-old major.

**H2. `@fastify/helmet` default CSP/HSTS breaks Safari on `http://localhost` (and the AD-13 string is not what is sent)**
- Claim: AD-13 "helmet sets CSP `default-src 'self'; script-src 'self'; ... frame-ancestors 'none'`".
- Evidence: Running @fastify/helmet 13.2.0 with exactly those directives (dashed keys accepted) emits: `default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'none';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' 'unsafe-inline';upgrade-insecure-requests;connect-src 'self'`, plus `strict-transport-security`, COOP, CORP, `origin-agent-cluster`. `useDefaults: true` merges defaults, including `upgrade-insecure-requests`. Safari honours that on localhost (WebKit bug 250776, open; Chrome and Firefox treat localhost as secure), so every subresource is upgraded to https and the SPA does not load. macOS is mandatory (NFR-01) and Safari is the likely Mac browser.
- Verdict: wrong as specified (silent default).
- Fix: AD-13 must say `useDefaults: false` with the full directive list, or set `'upgrade-insecure-requests': null`, and `strictTransportSecurity: false` (no TLS in scope). Add `base-uri 'self'; form-action 'self'; object-src 'none'` explicitly. Add a test that asserts the exact CSP header and absence of `upgrade-insecure-requests`/HSTS. Manual Safari check in S07.

**H3. `eslint-plugin-jsx-a11y@6.10.2` is a hard ERESOLVE under ESLint 10, not just "unconfirmed"; the plugin is unmaintained**
- Claim: Deferred "S00 confirms the pair runs, else pins ESLint 9.x".
- Evidence: `npm install eslint@10.13.0 eslint-plugin-jsx-a11y@6.10.2` => `ERESOLVE ... peer eslint "^3 || ... || ^9" from eslint-plugin-jsx-a11y@6.10.2`. Latest and only 6.x tip is 6.10.2, last modified 2024-10-26 (two years stale). `npm ci` therefore fails without `--legacy-peer-deps` or `overrides`. All other ESLint plugins named are fine: typescript-eslint 8.71.2 peers eslint ^8.57||^9||^10; eslint-plugin-react-hooks 7.1.1 peers up to ^10.
- Verdict: the deferral is honest, but the failure mode is install-time and certain; the "run" question is separate.
- Fix: decide now, do not defer. Options: (a) ESLint 9.x for the whole repo (typescript-eslint and react-hooks both support it), or (b) ESLint 10 with an `overrides` entry for jsx-a11y plus a stack note. Since axe-core covers a11y at runtime and React Aria handles semantics, (a) is the lower-risk default. Also note a fresh install on ESLint 10 warns about `jiti` peer (optional).

**H4. Node 24 LTS framing is about to be stale; Node 26 becomes LTS in 9 days**
- Claim: "Node 24 LTS (Active LTS, EOL 2028-04-30). Node 26 enters LTS late October."
- Evidence: nodejs/Release schedule.json: v24 maintenance starts 2026-10-20 (tomorrow), end 2028-04-30; v26 LTS 2026-10-28, maintenance 2027-10-20, end 2029-04-30; v25 EOL 2026-06-01. nodejs.org previous-releases page today: 24 = Active LTS (v24.22.0), 26 = Current (v26.12.0), 25 = EOL. Engines `^24.15.0 || >=26.0.0` is consistent with vitest 5 (`^22.12||^24||>=26`), jsdom 30 (`^22.22.2||^24.15||>=26`), react-router 8.4 (`>=22.22`), better-sqlite3 13 (`>=22`), @axe-core/playwright 4.14 (`>=22.12`), vite 8 and eslint 10. So 24 is valid, but pinning a project that will be built for months to a line that enters Maintenance on the day after the spine is written is a judgement call that should be explicit. Also the engines floor 24.15 comes from jsdom only; react-router needs >=22.22 (satisfied).
- Verdict: dates confirmed; "Active LTS" is true today only.
- Fix: state "Node 24 (Maintenance LTS from 2026-10-20, supported to 2028-04-30); Node 26 is the successor (LTS 2026-10-28)" and justify the pin (tested spikes, Temporal polyfill decision). Consider pinning CI to 26 once LTS, or add a CI row for 26 (better-sqlite3 prebuilds are N-API, see L1). Jo's Node 25.9.0 is outside engines (already noted, OQ-B).

### MEDIUM

**M1. `npm` "11" is not a version pin; Node 24.15 bundles 11.12.1 and tools behave differently**
- Evidence: nodejs.org dist index: v24.15.0 -> npm 11.12.1, v24.22.0 -> npm 11.19.1, v26.12.0 -> npm 11.20.0. npm latest is 12.2.0 (requires Node ^22.22.2||^24.15||>=26). npm 11.21.1 prints `install-scripts ... esbuild@0.28.2 (postinstall) not yet covered by allowScripts` (new gate; may become blocking in npm 12). npm 11.3.0 (older) crashed outright (`Cannot read properties of null (reading 'edgesOut')`) installing vite 8.3.4 alone.
- Verdict: unverifiable as "npm 11" works; the spec should name a floor.
- Fix: add `engines.npm` floor (>=11.19) and CI `npm i -g npm@11` or rely on bundled; record the esbuild postinstall/allowScripts stance (esbuild needs its platform binary; it ships as optional-dependency binaries so postinstall is an integrity check only).

**M2. Full-stack install was never executed by the author**
- Evidence: memlog lists "Verified via npm registry" (metadata reads). My real install of every Stack package on npm 11.21.1 succeeded (343 packages, no peer conflicts except H1/H3). On bundled npm 11.12.1/11.19.1 the install fails because of H1.
- Fix: S00 first task is a clean-room `npm ci` on Windows, Linux, macOS; commit the lockfile generated by the Node 24 bundled npm.

**M3. `@types/better-sqlite3` is 9.6.0 against better-sqlite3 13**
- Evidence: better-sqlite3 13.0.3 ships no `.d.ts` (files: lib/, prebuilds/, src/, deps/). `@types/better-sqlite3@9.6.0` exists (modified 2026-10-04), peers none, depends `@types/node: *`; it declares `Transaction.immediate()`. Whether it matches 13's surface was not checked by the author (Deferred item stands); typings are the risk for AD-7 (`.immediate`).
- Verdict: deferral acceptable; `.immediate()` confirmed present at runtime (below).
- Fix: add `@types/better-sqlite3 ^9.6` to the Stack table or state "local types". Do not leave it unmentioned: it is a devDependency every agent will import.

**M4. `@types/node ^24` mismatch with TypeScript 6 and npm `latest` tags**
- Evidence: `@types/node` latest is 26.6.5, dist-tag `ts6.0 -> 26.6.5`; `^24` resolves to 24.19.2, consistent with the Node 24 pin and satisfies vite 8 (`^20.19||>=22.12`) and vitest 5 (`^22||>=24`). Correct, but moves with the Node 26 decision in H4.
- Verdict: confirmed.
- Fix: none; keep in step with the runtime pin.

**M5. Playwright CI install flags unverified; docs page does not show `chromium` form**
- Evidence: playwright.dev/docs/ci recommends `npx playwright install --with-deps` after `npm ci`; no OS notes beyond Linux deps. The spine says only "Playwright runs on Chromium" and the memlog "Playwright chromium install". `--with-deps` is Linux-only apt; on Windows and macOS it is a no-op for deps. The docs also advise against caching browser binaries and recommend `workers: 1` on CI (conflicts with "each worker boots its own server on a free port" only mildly; per-worker servers are fine, but throughput is not).
- Verdict: unverifiable in the spine (no command is stated).
- Fix: write the exact command in AD-25: `npx playwright install --with-deps chromium` (Linux) / `npx playwright install chromium` (Win, macOS). Verify at S00 as the Deferred list says.

### LOW

**L1. better-sqlite3 prebuilt binaries: confirmed, N-API, all three OSes**
- Evidence: tarball contains `prebuilds/{darwin-arm64,darwin-x64,linux-arm64,linux-x64,linuxmusl-arm64,linuxmusl-x64,win32-arm64,win32-x64}.node`, loaded by `lib/binding.js` with no ABI suffix and no install script (`gypfile: false`), `engines.node >=22`. Install on Node 25.9 took 1 s and ran. N-API implies Node 24 and 26 load the same binary (Node 24/26 themselves not executed here; only Node 25.9 was available).
- Verdict: confirmed (Node 24/26 runtime load inferred, high confidence). Fix: none; the smoke test on macOS CI is the proof.

**L2. SQLite 3.53.4, STRICT, triggers, `.immediate()`: confirmed**
- Evidence: `select sqlite_version()` = 3.53.4; STRICT table rejects TEXT into INTEGER (`SQLITE_CONSTRAINT_DATATYPE`); `BEFORE INSERT` trigger with `RAISE(ABORT,'NEG')` surfaces as `code SQLITE_CONSTRAINT_TRIGGER`, message equals the raise text; `db.transaction(fn).immediate()` exists and returns the result. Fix: none. (Note: mapping by `e.message === 'BOOKING_OVERLAP'` is the repository contract; keep it in a test.)

**L3. scrypt parameters: confirmed**
- Evidence: OWASP Password Storage Cheat Sheet lists N=2^17,r=8,p=1 as first choice and explicitly N=2^16,r=8,p=2 as an equivalent alternative. AD-11 uses the latter. Argon2id (19 MiB, t=2, p=1) is the first recommendation overall; the "no native dependency" rationale for scrypt is valid. Fix: add one clause "scrypt chosen over Argon2id to avoid a native dependency; params are the OWASP-listed equivalent".  Note default `node:crypto` scrypt `maxmem` is 32 MiB; N=2^16,r=8 needs 64 MiB, so `maxmem` must be set (128*N*r = 64 MiB; use at least 72 MiB) or the call throws `ERR_CRYPTO_INVALID_SCRYPT_PARAMS`. This is easy to miss; add to AD-11 and the test config.

**L4. GitHub runner labels: confirmed**
- Evidence (actions/runner-images README, today): `windows-latest` -> Windows Server 2025, `ubuntu-latest` -> Ubuntu 24.04, `macos-latest` -> macOS 26 arm64. macOS 14 images deprecated. `-latest` labels move over 1-2 months. Fix: consider pinning `macos-26` (NFR-01 evidence) and `ubuntu-24.04`/`windows-2025` so the evidence does not change under the pilot; the Deferred item ("verified when the workflow file is written") can be closed with this note. Action majors (checkout, setup-node, upload-artifact) remain unverified.

**L5. Cookie / Origin / Sec-Fetch behaviour: confirmed with one caveat**
- Evidence: MDN/secondary sources: Chrome 89+ and Firefox 75+ accept `Secure` cookies from http://localhost; Safari does not. AD-11 sets `Secure` only on https (`FELLES_COOKIE_SECURE=auto`), so Safari on http://localhost works; `SameSite=Lax` and `HttpOnly` have no localhost restriction. Caveat: `FELLES_COOKIE_SECURE=true` on http breaks Safari; document it as unsupported on localhost. `Sec-Fetch-Site`: Baseline since Mar 2023 (Chrome 76, Firefox 90, Safari 16.4); the vite proxy keeps the browser-side value `same-origin` for 5173, and `127.0.0.1` vs `localhost` is cross-origin and so refused (intended). I did not find a source on trustworthy-origin handling of the header; treat as unverified for http://127.0.0.1 in Safari and include in the S07 manual check. `@fastify/cookie` 11.1.3 and the others depend on `fastify-plugin ^6`; helmet's own README maps `>=12.x` to Fastify ^5, and 13.2.0 loaded and ran on fastify 5.12.7 here.

## Confirmed table (claim | evidence | verdict)

| Item | Evidence | Verdict |
| --- | --- | --- |
| typescript 6.0.3 pin; 7.0.2 is latest | `npm view typescript dist-tags.latest` = 7.0.2; typescript-eslint 8.71.2 peer `typescript >=4.8.4 <6.1.0` | confirmed (best reason in the spine) |
| react, react-dom 19.3.1 | latest; react-dom peer react ^19.3.1 | confirmed |
| vite 8.3.4 | latest; node ^20.19\|\|>=22.12; peer esbuild ^0.27\|\|^0.28 matches esbuild 0.28.2 | confirmed |
| @vitejs/plugin-react 6.1.2 | latest; peer vite ^8 | confirmed |
| vitest 5.0.5 | latest; peer vite ^6.4\|\|^7\|\|^8; node ^22.12\|\|^24\|\|>=26; peer @types/node ^22\|\|>=24 | confirmed |
| react-router 8.4.0 | latest; node >=22.22; react >=19.2.7 (19.3.1 ok); deps cookie-es, @remix-run/route-pattern | confirmed (engines floor 22.22 is stricter than the memlog's remark; fine under 24.15) |
| @tanstack/react-query 5.104.4 | latest; react ^18\|\|^19 | confirmed |
| react-hook-form 7.90.0 | latest; react 16.8..19 | confirmed |
| zod 4.6.7 | latest; satisfies resolvers peer | confirmed |
| react-aria-components 1.22.1 | latest (2026-10-09); peers react ^19.0.0-rc.1 so 19.3.1 satisfied; nothing in Vite 8 constraints it. (react-aria.adobe.com/releases returned 404; project alive per registry cadence.) | confirmed (React 19.3 by peer range only) |
| lucide-react 1.59.0 | latest; peer react up to ^19 | confirmed |
| @fontsource-variable/inter 5.3.0 | latest | confirmed |
| fastify 5.12.7 | latest; helmet 13 maps to Fastify ^5 | confirmed |
| @fastify/cookie 11.1.3, @fastify/static 10.1.6, @fastify/helmet 13.2.0 | all latest, modified 2026-10-18; deps fastify-plugin ^6 | confirmed |
| better-sqlite3 13.0.3 / SQLite 3.53.4 | latest; runtime query returned 3.53.4 | confirmed |
| temporal-polyfill 1.0.6 | latest; ESM exports `Intl`, `Temporal`, `toTemporalInstant` | confirmed |
| pino 10.4.0, pino-pretty 13.2.0 | latest | confirmed |
| @testing-library/react 16.3.3 | latest; peers need @testing-library/dom ^10 and @types/react(-dom) installed explicitly | confirmed; add `@testing-library/dom`, `@types/react`, `@types/react-dom` to the Stack (not listed) |
| jsdom 30.1.3 | latest; node ^22.22.2\|\|^24.15\|\|>=26 | confirmed (sets the 24.15 floor) |
| @playwright/test 1.64.1, @axe-core/playwright 4.14.0 | latest; axe needs node >=22.12, peer playwright-core any | confirmed |
| eslint 10.13.0, typescript-eslint 8.71.2, react-hooks 7.1.1 | latest; peers include eslint 10; TS 6.0.3 inside range | confirmed; see H3 for jsx-a11y |
| prettier 3.9.10, tsx 4.23.15, esbuild 0.28.2, yaml 2.9.1 | all latest | confirmed |
| Type stripping / native TS not needed | not claimed in the spine; tsx covers dev, esbuild bundle covers prod | n/a (no claim to verify) |
| Playwright on Windows/macOS needs no extra setup | playwright.dev/docs/ci | confirmed |

## Suggested spine edits (for the author)
1. Stack: `@hookform/resolvers` 5.9.2 (H1); add `@types/better-sqlite3 ^9.6`, `@types/react`, `@types/react-dom`, `@testing-library/dom ^10` (M3, table).
2. AD-13: full helmet option block with `useDefaults: false`, no `upgrade-insecure-requests`, `strictTransportSecurity: false` plus header test (H2).
3. Deferred ESLint item becomes a decision (H3).
4. AD-22/Stack: restate Node status (Maintenance LTS from 2026-10-20; Node 26 LTS 2026-10-28), `engines.npm` floor (H4, M1).
5. AD-11: `maxmem` for scrypt, rationale vs Argon2id (L3).
6. AD-25: exact Playwright install commands; pin runner labels (M5, L4).
