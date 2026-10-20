import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";
import { cases } from "../eslint-fixtures/cases.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let eslint;

async function lint(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath: join(root, filePath) });
  return result.messages;
}

beforeAll(() => {
  eslint = new ESLint({ cwd: root, overrideConfigFile: join(root, "eslint.config.js") });
}, 60_000);

describe("[NFR-02] verify gate rejects a violation (@1.1)", () => {
  for (const c of cases) {
    it(`[NFR-02] verify gate rejects a violation: ${c.name} (@1.1)`, async () => {
      const bad = await lint(c.bad, c.file);
      expect(bad.map((m) => m.ruleId)).toContain(c.rule);
      expect(bad.find((m) => m.ruleId === c.rule)?.severity).toBe(2);

      const good = await lint(c.good, c.file);
      expect(good.map((m) => `${m.ruleId}: ${m.message}`)).toEqual([]);

      if (c.twin !== undefined) {
        const twin = await lint(c.twin, c.twinFile ?? c.file);
        expect(twin.map((m) => `${m.ruleId}: ${m.message}`)).toEqual([]);
      }
    }, 30_000);
  }

  it("[NFR-02] verify gate enforces --max-warnings 0 (@1.1)", () => {
    const verify = readFileSync(join(root, "scripts", "verify.mjs"), "utf8");
    expect(verify).toMatch(/"--max-warnings",\s*"0"/);
  });
});
