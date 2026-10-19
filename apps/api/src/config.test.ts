import { describe, expect, it } from "vitest";
import { ConfigError, assertBindingAllowed, parseConfig } from "./config";

describe("configuration", () => {
  it("[NFR-04] documented defaults apply to an empty environment (@1.3)", () => {
    const config = parseConfig({});
    expect(config).toMatchObject({
      nodeEnv: "development",
      isProduction: false,
      port: 3000,
      host: "127.0.0.1",
      dbPath: "data/felles.db",
      nowStartMs: null,
      allowedOrigins: [],
      allowedHosts: [],
      cookieSecure: "auto",
      scryptN: 65536,
      logLevel: "info",
      vitePort: 5173,
      allowRemoteDemo: false,
      isVitest: false,
    });
  });

  it("[NFR-04] every FELLES_* variable is read and validated (@1.3)", () => {
    const config = parseConfig({
      NODE_ENV: "test",
      VITEST: "true",
      FELLES_PORT: "0",
      FELLES_HOST: "localhost",
      FELLES_DB_PATH: "tmp/x.db",
      FELLES_ALLOWED_ORIGINS: "http://localhost:3001, http://127.0.0.1:3001",
      FELLES_ALLOWED_HOSTS: "localhost:3001",
      FELLES_COOKIE_SECURE: "true",
      FELLES_SCRYPT_N: "4096",
      FELLES_LOG_LEVEL: "silent",
      FELLES_VITE_PORT: "5199",
      FELLES_ALLOW_REMOTE_DEMO: "1",
    });
    expect(config.port).toBe(0);
    expect(config.isVitest).toBe(true);
    expect(config.allowedOrigins).toEqual(["http://localhost:3001", "http://127.0.0.1:3001"]);
    expect(config.cookieSecure).toBe("true");
    expect(config.scryptN).toBe(4096);
    expect(config.logLevel).toBe("silent");
    expect(config.allowRemoteDemo).toBe(true);
  });

  it("[NFR-04] bad values are refused with a message naming the variable (@1.3)", () => {
    expect(() => parseConfig({ FELLES_PORT: "99999" })).toThrow(ConfigError);
    expect(() => parseConfig({ FELLES_PORT: "abc" })).toThrow(/FELLES_PORT/);
    expect(() => parseConfig({ NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
    expect(() => parseConfig({ FELLES_SCRYPT_N: "1000" })).toThrow(/FELLES_SCRYPT_N/);
    expect(() => parseConfig({ FELLES_SCRYPT_N: "100000" })).toThrow(/FELLES_SCRYPT_N/);
    expect(() => parseConfig({ FELLES_COOKIE_SECURE: "maybe" })).toThrow(/FELLES_COOKIE_SECURE/);
    expect(() => parseConfig({ FELLES_ALLOW_REMOTE_DEMO: "yes" })).toThrow(
      /FELLES_ALLOW_REMOTE_DEMO/,
    );
  });

  it("[NFR-04] origins and hosts are exact strings; wildcard, null and paths are rejected (@1.3)", () => {
    for (const bad of [
      "*",
      "null",
      "http://localhost:3000/",
      "localhost:3000",
      "http://*.example.no",
      "https://a.no/path",
    ]) {
      expect(() => parseConfig({ FELLES_ALLOWED_ORIGINS: bad }), bad).toThrow(
        /FELLES_ALLOWED_ORIGINS/,
      );
    }
    expect(() => parseConfig({ FELLES_ALLOWED_HOSTS: "*" })).toThrow(/FELLES_ALLOWED_HOSTS/);
    expect(() => parseConfig({ FELLES_ALLOWED_HOSTS: "a.no/x" })).toThrow(/FELLES_ALLOWED_HOSTS/);
  });

  it("[BR-1] FELLES_NOW needs Z or an offset and is refused under production (@1.3)", () => {
    expect(parseConfig({ FELLES_NOW: "2026-10-19T07:00:00Z" }).nowStartMs).toBe(
      Date.UTC(2026, 9, 19, 7, 0, 0),
    );
    expect(parseConfig({ FELLES_NOW: "2026-10-19T09:00:00+02:00" }).nowStartMs).toBe(
      Date.UTC(2026, 9, 19, 7, 0, 0),
    );
    expect(() => parseConfig({ FELLES_NOW: "2026-10-19T07:00:00" })).toThrow(/FELLES_NOW/);
    expect(() =>
      parseConfig({ FELLES_NOW: "2026-10-19T07:00:00Z", NODE_ENV: "production" }),
    ).toThrow(/FELLES_NOW.*production/);
    expect(parseConfig({ NODE_ENV: "production" }).isProduction).toBe(true);
  });

  it("[NFR-04] a non-loopback host is refused while synthetic data exists unless allowed (@1.3)", () => {
    const remote = { host: "0.0.0.0", allowRemoteDemo: false };
    expect(() => assertBindingAllowed(remote, "synthetic-seed")).toThrow(/loopback/);
    expect(() =>
      assertBindingAllowed({ ...remote, allowRemoteDemo: true }, "synthetic-seed"),
    ).not.toThrow();
    expect(() => assertBindingAllowed(remote, null)).not.toThrow();
    expect(() =>
      assertBindingAllowed({ host: "127.0.0.1", allowRemoteDemo: false }, "synthetic-seed"),
    ).not.toThrow();
    expect(() =>
      assertBindingAllowed({ host: "localhost", allowRemoteDemo: false }, "synthetic-seed"),
    ).not.toThrow();
  });
});
