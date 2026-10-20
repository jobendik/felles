import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

describe("[NFR-02] unsupported Node is refused at install (@1.1)", () => {
  it("[NFR-02] the engines range excludes Node 25 and admits Node 24.15+ and 26 (@1.1)", () => {
    const range = pkg.engines.node;
    expect(semver.satisfies("25.9.0", range)).toBe(false);
    expect(semver.satisfies("24.14.0", range)).toBe(false);
    expect(semver.satisfies("24.22.0", range)).toBe(true);
    expect(semver.satisfies("26.0.0", range)).toBe(true);
  });

  it("[NFR-02] engine-strict makes npm refuse an unsupported engine and name the range (@1.1)", () => {
    expect(readFileSync(join(root, ".npmrc"), "utf8")).toMatch(/^engine-strict=true$/m);
    const dir = mkdtempSync(join(tmpdir(), "felles-engines-"));
    try {
      writeFileSync(
        join(dir, "package.json"),
        JSON.stringify({ name: "engine-probe", version: "0.0.0", engines: { node: "^99.0.0" } }),
      );
      writeFileSync(join(dir, ".npmrc"), "engine-strict=true\nignore-scripts=true\n");
      const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
      const result = spawnSync(process.execPath, [npmCli, "install", "--no-audit", "--no-fund"], {
        cwd: dir,
        encoding: "utf8",
      });
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/Unsupported engine/);
      expect(`${result.stdout}${result.stderr}`).toContain("^99.0.0");
    } finally {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    }
  }, 60_000);
});
