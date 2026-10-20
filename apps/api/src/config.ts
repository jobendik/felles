// Configuration is read once, here, and validated with Zod (AD-24). Every FELLES_* variable and NODE_ENV
// has a documented default; no secret exists.
import { z } from "zod";
import { parseInstant } from "./platform/oslo-time";

export class ConfigError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`Invalid configuration:\n- ${issues.join("\n- ")}`);
    this.name = "ConfigError";
    this.issues = issues;
  }
}

export const NODE_ENVS = ["development", "test", "production"] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

export const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

/** An exact `scheme://host[:port]` string: no path, no wildcard, no `null`. */
const ORIGIN_PATTERN =
  /^https?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?$|^https?:\/\/\[[0-9a-fA-F:]+\](:\d{1,5})?$/;
const HOST_PATTERN = /^[A-Za-z0-9.-]+(:\d{1,5})?$|^\[[0-9a-fA-F:]+\](:\d{1,5})?$/;

function list(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

const port = z.coerce.number().int().min(0).max(65535);

const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default("development"),
  FELLES_PORT: port.default(3000),
  FELLES_HOST: z.string().min(1).default("127.0.0.1"),
  FELLES_DB_PATH: z.string().min(1).default("data/felles.db"),
  FELLES_NOW: z.string().min(1).optional(),
  FELLES_ALLOWED_ORIGINS: z.string().optional(),
  FELLES_ALLOWED_HOSTS: z.string().optional(),
  FELLES_COOKIE_SECURE: z.enum(["auto", "true", "false"]).default("auto"),
  FELLES_SCRYPT_N: z.coerce.number().int().default(65536),
  FELLES_LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  FELLES_VITE_PORT: port.default(5173),
  FELLES_ALLOW_REMOTE_DEMO: z.enum(["1"]).optional(),
});

export interface Config {
  nodeEnv: NodeEnv;
  isProduction: boolean;
  isVitest: boolean;
  port: number;
  host: string;
  /** As configured; `openDatabase()` resolves it against the repository root. */
  dbPath: string;
  /** The start instant from `FELLES_NOW` in epoch milliseconds; the clock keeps advancing from it. */
  nowStartMs: number | null;
  allowedOrigins: string[];
  allowedHosts: string[];
  cookieSecure: "auto" | "true" | "false";
  scryptN: number;
  logLevel: LogLevel;
  vitePort: number;
  allowRemoteDemo: boolean;
}

export function parseConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = envSchema.safeParse(env);
  const issues: string[] = [];
  if (!parsed.success) {
    for (const issue of parsed.error.issues)
      issues.push(`${issue.path.join(".") || "env"}: ${issue.message}`);
    throw new ConfigError(issues);
  }
  const values = parsed.data;

  const allowedOrigins = list(values.FELLES_ALLOWED_ORIGINS);
  for (const origin of allowedOrigins) {
    if (origin === "*" || origin === "null" || !ORIGIN_PATTERN.test(origin)) {
      issues.push(
        `FELLES_ALLOWED_ORIGINS: "${origin}" is not an exact scheme://host[:port] origin`,
      );
    }
  }
  const allowedHosts = list(values.FELLES_ALLOWED_HOSTS);
  for (const host of allowedHosts) {
    if (host === "*" || !HOST_PATTERN.test(host)) {
      issues.push(`FELLES_ALLOWED_HOSTS: "${host}" is not an exact host[:port]`);
    }
  }

  const n = values.FELLES_SCRYPT_N;
  if (n < 2 ** 12 || n > 2 ** 17 || (n & (n - 1)) !== 0) {
    issues.push("FELLES_SCRYPT_N: must be a power of two from 4096 to 131072");
  }

  let nowStartMs: number | null = null;
  if (values.FELLES_NOW !== undefined) {
    if (values.NODE_ENV === "production") {
      issues.push("FELLES_NOW: refused when NODE_ENV=production");
    } else {
      try {
        nowStartMs = parseInstant(values.FELLES_NOW);
      } catch {
        issues.push(
          "FELLES_NOW: needs an ISO instant with Z or an offset, for example 2026-10-19T07:00:00Z",
        );
      }
    }
  }

  if (issues.length > 0) throw new ConfigError(issues);

  return {
    nodeEnv: values.NODE_ENV,
    isProduction: values.NODE_ENV === "production",
    isVitest: env.VITEST === "true",
    port: values.FELLES_PORT,
    host: values.FELLES_HOST,
    dbPath: values.FELLES_DB_PATH,
    nowStartMs,
    allowedOrigins,
    allowedHosts,
    cookieSecure: values.FELLES_COOKIE_SECURE,
    scryptN: n,
    logLevel: values.FELLES_LOG_LEVEL,
    vitePort: values.FELLES_VITE_PORT,
    allowRemoteDemo: values.FELLES_ALLOW_REMOTE_DEMO === "1",
  };
}

export function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host);
}

/**
 * A non-loopback `FELLES_HOST` is refused while the database holds synthetic seed data, unless
 * `FELLES_ALLOW_REMOTE_DEMO=1` (AD-13). `dataOrigin` is `app_meta.data_origin`, or null for no database yet.
 */
export function assertBindingAllowed(
  config: Pick<Config, "host" | "allowRemoteDemo">,
  dataOrigin: string | null,
): void {
  if (isLoopbackHost(config.host)) return;
  if (dataOrigin === "synthetic-seed" && !config.allowRemoteDemo) {
    throw new ConfigError([
      `FELLES_HOST=${config.host} is not a loopback address and the database holds synthetic demo data; set FELLES_ALLOW_REMOTE_DEMO=1 to allow it`,
    ]);
  }
}
