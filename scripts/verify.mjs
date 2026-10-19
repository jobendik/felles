// `npm run verify` = typecheck + lint + tests + production build (AD-27). Steps run through
// process.execPath on JS entries, never through npm.cmd or a shell (AD-24).
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function bin(pkg, file) {
  return join(dirname(require.resolve(`${pkg}/package.json`)), file);
}

function run(label, args, cwd = root) {
  console.log(`\n> ${label}`);
  const started = Date.now();
  const result = spawnSync(process.execPath, args, { cwd, stdio: "inherit", env: process.env });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (result.status !== 0) {
    console.error(`\nFAILED: ${label} (${seconds}s)`);
    process.exit(result.status ?? 1);
  }
  console.log(`ok: ${label} (${seconds}s)`);
}

const WORKSPACES = ["packages/contracts", "apps/api", "apps/web"];

const steps = {
  typecheck() {
    for (const ws of WORKSPACES) {
      run(`typecheck ${ws}`, [
        bin("typescript", "bin/tsc"),
        "--noEmit",
        "-p",
        join(ws, "tsconfig.json"),
      ]);
    }
  },
  lint() {
    run("eslint", [bin("eslint", "bin/eslint.js"), ".", "--max-warnings", "0"]);
    run("prettier", [bin("prettier", "bin/prettier.cjs"), "--check", "."]);
  },
  test() {
    run("vitest", [bin("vitest", "vitest.mjs"), "run"]);
  },
  build() {
    run("build web", [bin("vite", "bin/vite.js"), "build"], join(root, "apps", "web"));
    run("build api", [join(root, "scripts", "build-api.mjs")]);
  },
};

const requested = process.argv[2];
if (requested !== undefined) {
  if (!(requested in steps)) {
    console.error(`Unknown step "${requested}". Use one of: ${Object.keys(steps).join(", ")}.`);
    process.exit(2);
  }
  steps[requested]();
} else {
  for (const name of ["typecheck", "lint", "test", "build"]) steps[name]();
  console.log("\nverify: all steps passed");
}
