// Bundles apps/api with esbuild: workspace packages are inlined, dependencies stay external (AD-27).
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiPackage = JSON.parse(readFileSync(join(root, "apps", "api", "package.json"), "utf8"));
const external = Object.keys(apiPackage.dependencies ?? {}).filter(
  (name) => !name.startsWith("@felles/"),
);

await build({
  entryPoints: [join(root, "apps", "api", "src", "server.ts")],
  outfile: join(root, "apps", "api", "dist", "server.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: false,
  external,
  logLevel: "info",
});
