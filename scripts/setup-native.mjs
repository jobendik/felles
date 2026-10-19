// Rebuilds the packages that need an install script. `.npmrc` sets ignore-scripts=true, so
// `npm ci` never runs install scripts; this explicit step runs them for the packages listed here.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NATIVE_PACKAGES = ["better-sqlite3"];

function npmCliEntry() {
  const fromEnv = process.env.npm_execpath;
  if (fromEnv && existsSync(fromEnv) && fromEnv.endsWith(".js")) return fromEnv;
  const bundled = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  if (existsSync(bundled)) return bundled;
  throw new Error("Cannot locate npm-cli.js next to the Node executable.");
}

const result = spawnSync(
  process.execPath,
  [npmCliEntry(), "rebuild", ...NATIVE_PACKAGES, "--ignore-scripts=false"],
  { cwd: root, stdio: "inherit" },
);
if (result.status !== 0) {
  console.error("setup:native failed.");
  process.exit(result.status ?? 1);
}

const check = spawnSync(
  process.execPath,
  [
    "-e",
    "const D=require('better-sqlite3');const d=new D(':memory:');console.log('better-sqlite3 loads, SQLite '+d.prepare('select sqlite_version() v').get().v);d.close()",
  ],
  { cwd: join(root, "apps", "api"), stdio: "inherit" },
);
process.exit(check.status ?? 1);
