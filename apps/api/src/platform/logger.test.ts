import { describe, expect, it } from "vitest";
import {
  REDACTED,
  createLogger,
  newRequestId,
  requestLogger,
  serializeError,
  usesPrettyOutput,
} from "./logger";

function capture() {
  const lines: string[] = [];
  return {
    destination: { write: (chunk: string) => void lines.push(chunk) },
    records: () => lines.map((line) => JSON.parse(line) as Record<string, unknown>),
    text: () => lines.join(""),
  };
}

describe("logger", () => {
  it("[NFR-04] credentials, cookies, authorization, request bodies and tokens are redacted (@1.3)", () => {
    const out = capture();
    const logger = createLogger({ level: "info", nodeEnv: "test", destination: out.destination });
    logger.info(
      {
        req: {
          headers: { cookie: "felles_sid=SECRETSID", authorization: "Bearer SECRETTOKEN" },
          body: { password: "hunter2" },
        },
        res: { headers: { "set-cookie": "felles_sid=SECRETSID; HttpOnly" } },
        user: {
          password: "hunter2",
          passwordHash: "scrypt$65536$8$2$salt$hash",
          token: "SECRETTOKEN",
        },
        password: "hunter2",
        token: "SECRETTOKEN",
      },
      "request done",
    );
    const text = out.text();
    for (const secret of ["SECRETSID", "SECRETTOKEN", "hunter2", "scrypt$65536"]) {
      expect(text, secret).not.toContain(secret);
    }
    const record = out.records()[0]!;
    expect((record.req as { headers: { cookie: string } }).headers.cookie).toBe(REDACTED);
    expect((record.user as { passwordHash: string }).passwordHash).toBe(REDACTED);
  });

  it("[NFR-04] booking purposes and reasons are never written (@1.3)", () => {
    const out = capture();
    const logger = createLogger({ level: "info", nodeEnv: "test", destination: out.destination });
    logger.info(
      {
        booking: { purpose: "Styremøte om lønn", reason: "Privat grunn" },
        purpose: "Styremøte om lønn",
      },
      "created",
    );
    expect(out.text()).not.toContain("Styremøte");
    expect(out.text()).not.toContain("Privat grunn");
  });

  it("[NFR-04] every request line carries the request id (@1.3)", () => {
    const out = capture();
    const logger = createLogger({ level: "info", nodeEnv: "test", destination: out.destination });
    const id = newRequestId();
    const child = requestLogger(logger, id);
    child.info("one");
    child.warn({ status: 503 }, "two");
    expect(out.records().map((r) => r.reqId)).toEqual([id, id]);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("[NFR-04] the error serialiser drops input and keeps type, message and code (@1.3)", () => {
    const error = Object.assign(new Error("boom"), {
      code: "E_X",
      input: { password: "hunter2" },
      body: "x",
    });
    const serialised = serializeError(error);
    expect(serialised).toMatchObject({ type: "Error", message: "boom", code: "E_X" });
    expect(JSON.stringify(serialised)).not.toContain("hunter2");
    const out = capture();
    createLogger({ level: "info", nodeEnv: "test", destination: out.destination }).error(
      { err: error },
      "failed",
    );
    expect(out.text()).not.toContain("hunter2");
  });

  it("[NFR-04] pino-pretty is used only in development (@1.3)", () => {
    expect(usesPrettyOutput("development")).toBe(true);
    expect(usesPrettyOutput("test")).toBe(false);
    expect(usesPrettyOutput("production")).toBe(false);
  });

  it("[NFR-04] the log level filters lines (@1.3)", () => {
    const out = capture();
    const logger = createLogger({ level: "warn", nodeEnv: "test", destination: out.destination });
    logger.info("hidden");
    logger.warn("shown");
    expect(out.records().map((r) => r.msg)).toEqual(["shown"]);
  });
});
