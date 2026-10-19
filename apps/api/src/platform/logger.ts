// Logging (AD-28): pino JSON to stdout with a request id on every request line. Credentials, cookies,
// request bodies and booking text never reach the output.
import { randomUUID } from "node:crypto";
import pino, { type DestinationStream, type Logger } from "pino";
import type { LogLevel, NodeEnv } from "../config";

/** The AD-28 paths plus top-level equivalents and the booking text fields. */
export const REDACT_PATHS = [
  "req.headers.cookie",
  "req.headers.authorization",
  'res.headers["set-cookie"]',
  "req.body",
  "*.password",
  "*.passwordHash",
  "*.token",
  "password",
  "passwordHash",
  "token",
  "cookie",
  "authorization",
  "body",
  "purpose",
  "reason",
  "*.purpose",
  "*.reason",
  "*.cookie",
  "*.authorization",
  "*.body",
];

export const REDACTED = "[Redacted]";

/** The error serialiser keeps type, message, code and stack and drops everything else, including input. */
export function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { type: "NonError", message: String(error) };
  const code = (error as { code?: unknown }).code;
  return {
    type: error.name,
    message: error.message,
    ...(typeof code === "string" ? { code } : {}),
    ...(error.stack === undefined ? {} : { stack: error.stack }),
  };
}

/** pino-pretty is used only in development. */
export function usesPrettyOutput(nodeEnv: NodeEnv): boolean {
  return nodeEnv === "development";
}

export interface LoggerOptions {
  level: LogLevel;
  nodeEnv: NodeEnv;
  /** A stream for tests; when absent the logger writes to stdout. */
  destination?: DestinationStream;
}

export function createLogger(options: LoggerOptions): Logger {
  const base = {
    level: options.level,
    redact: { paths: REDACT_PATHS, censor: REDACTED },
    serializers: { err: serializeError },
    base: undefined,
  };
  if (options.destination !== undefined) return pino(base, options.destination);
  if (usesPrettyOutput(options.nodeEnv)) {
    return pino({ ...base, transport: { target: "pino-pretty", options: { colorize: true } } });
  }
  return pino(base);
}

export function newRequestId(): string {
  return randomUUID();
}

/** A child logger that stamps the request id on every line it writes. */
export function requestLogger(logger: Logger, requestId: string): Logger {
  return logger.child({ reqId: requestId });
}
