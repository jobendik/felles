// Writes docs/contracts-summary.md: every route, every DTO and request schema with its fields, the
// SHA-256 content hash of packages/contracts/src and (once the schema exists) the schema hash. This file is
// the review package for Gate S00-CP. The output is deterministic, so `--check` can prove it is current.
//
//   npm run contracts:summary            write the file
//   npm run contracts:summary -- --check exit 1 when the committed file is out of date
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractsSrc = join(root, "packages", "contracts", "src");
const outFile = join(root, "docs", "contracts-summary.md");
const contracts = await import(pathToFileURL(join(contractsSrc, "index.ts")).href);

function normalised(file) {
  return readFileSync(file, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");
}

export function contractsHash() {
  const hash = createHash("sha256");
  for (const name of readdirSync(contractsSrc).sort()) {
    hash.update(`${name}\n${normalised(join(contractsSrc, name))}\n`);
  }
  return hash.digest("hex");
}

function describeNode(node, depth = 0) {
  if (node === undefined || node === true) return "any";
  if (node.const !== undefined) return JSON.stringify(node.const);
  if (node.enum !== undefined) return node.enum.map((v) => JSON.stringify(v)).join(" | ");
  if (node.anyOf !== undefined) return node.anyOf.map((n) => describeNode(n, depth)).join(" | ");
  if (node.oneOf !== undefined) return node.oneOf.map((n) => describeNode(n, depth)).join(" | ");
  switch (node.type) {
    case "array":
      return `${describeNode(node.items, depth + 1)}[]`;
    case "object": {
      if (depth >= 2) return "object";
      const props = Object.entries(node.properties ?? {});
      const required = new Set(node.required ?? []);
      return `{ ${props.map(([k, v]) => `${k}${required.has(k) ? "" : "?"}: ${describeNode(v, depth + 1)}`).join("; ")} }`;
    }
    case "string": {
      const bounds = [
        node.minLength !== undefined ? `min ${node.minLength}` : null,
        node.maxLength !== undefined ? `max ${node.maxLength}` : null,
      ].filter(Boolean);
      return `string${bounds.length > 0 ? ` (${bounds.join(", ")})` : ""}`;
    }
    case "integer":
    case "number":
      return node.type;
    case "boolean":
    case "null":
      return node.type;
    default:
      return node.type ?? "any";
  }
}

function fieldsOf(schema, io) {
  let json;
  try {
    json = z.toJSONSchema(schema, { io, unrepresentable: "any", target: "draft-2020-12" });
  } catch {
    return [["(not representable)", ""]];
  }
  const nodes = json.anyOf !== undefined ? json.anyOf : [json];
  const rows = [];
  nodes.forEach((node, index) => {
    const props = Object.entries(node.properties ?? {});
    const required = new Set(node.required ?? []);
    const prefix = json.anyOf !== undefined ? `variant ${index + 1}: ` : "";
    for (const [key, value] of props) {
      rows.push([`${prefix}${key}${required.has(key) ? "" : "?"}`, describeNode(value, 1)]);
    }
  });
  return rows;
}

function table(headers, rows) {
  const line = (cells) => `| ${cells.join(" | ")} |`;
  return [
    line(headers),
    line(headers.map(() => "---")),
    ...rows.map((row) => line(row.map((c) => String(c).replace(/\|/g, "\\|")))),
  ].join("\n");
}

function routeSection() {
  const rows = contracts.ROUTE_LIST.map((r) => [
    `\`${r.method}\``,
    `\`${r.path}\``,
    r.access,
    r.owner,
    r.successStatus,
    r.errors.map((c) => `\`${c}\``).join(" "),
  ]);
  return table(["Method", "Path", "Access", "Owner slice", "Success", "Error codes"], rows);
}

function schemaSections() {
  const requestNames = [];
  const dtoNames = [];
  for (const [name, value] of Object.entries(contracts).sort(([a], [b]) => a.localeCompare(b))) {
    if (!name.endsWith("Schema") || value?._zod === undefined) continue;
    if (/(Input|Query)Schema$/.test(name)) requestNames.push(name);
    else dtoNames.push(name);
  }
  const out = [];
  out.push("### Request schemas (strict)\n");
  for (const name of requestNames) {
    out.push(`**${name}**\n\n${table(["Field", "Type"], fieldsOf(contracts[name], "input"))}\n`);
  }
  out.push("### DTOs and response schemas\n");
  for (const name of dtoNames) {
    out.push(`**${name}**\n\n${table(["Field", "Type"], fieldsOf(contracts[name], "output"))}\n`);
  }
  return out.join("\n");
}

function routeDetails() {
  const out = [];
  for (const r of contracts.ROUTE_LIST) {
    const parts = [
      r.params !== null ? "params" : null,
      r.query !== null ? "query" : null,
      r.body !== null ? "body" : null,
      r.response !== null ? "response" : "no body (204)",
    ].filter(Boolean);
    out.push(`- \`${r.id}\`: ${r.summary} (${parts.join(", ")})`);
  }
  return out.join("\n");
}

function messageSection() {
  const rows = contracts.ERROR_CODES.map((code) => {
    const entry = contracts.messagesNb[code];
    let message;
    if (typeof entry === "string") message = entry;
    else {
      const probes = {
        BOOKING_STARTED: [
          { currentStatus: "pending", action: "approve" },
          { currentStatus: "pending", action: "cancel" },
        ],
        RESOURCE_HAS_FUTURE_BOOKINGS: [
          { futureBookingCount: 3, firstFutureBookingAt: "x" },
          { futureBookingCount: 1, firstFutureBookingAt: "x" },
        ],
        RATE_LIMITED: [{ retryAfterSeconds: 10 }, { retryAfterSeconds: 1 }],
      }[code];
      message = probes.map((d) => entry(d)).join(" / ");
    }
    return [`\`${code}\``, contracts.ERROR_STATUS[code], message];
  });
  return table(["Code", "Status", "Message (nb)"], rows);
}

function openQuestions() {
  const file = join(root, "docs", "s00-open-design-questions.md");
  return existsSync(file)
    ? normalised(file)
        .replace(/^# .*\n/, "")
        .trim()
    : "(none recorded)";
}

function schemaSection() {
  const hashFile = join(root, "apps", "api", "test", "snapshot", "schema.hash");
  if (!existsSync(hashFile))
    return "The database schema (Story 1.7) is not part of this summary yet.";
  return `Schema snapshot SHA-256: \`${normalised(hashFile).trim()}\``;
}

export function buildSummary() {
  return `# FELLES contracts summary (Gate S00-CP review package)

Generated by \`npm run contracts:summary\`. Do not edit by hand; the content is deterministic.

- **Contracts content hash** (SHA-256 of \`packages/contracts/src\`, files in name order, LF-normalised): \`${contractsHash()}\`
- **Routes:** ${contracts.ROUTE_LIST.length}; **error codes:** ${contracts.ERROR_CODES.length}

## Routes

${routeSection()}

### What each route carries

${routeDetails()}

## Schemas

${schemaSections()}

## Error catalogue

${messageSection()}

## Database schema

${schemaSection()}

## Open design questions

${openQuestions()}
`;
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  const text = buildSummary();
  if (process.argv.includes("--check")) {
    const current = existsSync(outFile) ? normalised(outFile) : "";
    if (current !== text) {
      console.error("docs/contracts-summary.md is out of date; run `npm run contracts:summary`.");
      process.exit(1);
    }
    console.log("docs/contracts-summary.md is current.");
  } else {
    writeFileSync(outFile, text);
    console.log(`Wrote ${relative(root, outFile)} (contracts hash ${contractsHash()}).`);
  }
}
