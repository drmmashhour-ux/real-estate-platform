import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { assertDarlinkContext, assertDarlinkRuntimeEnv } from "@/lib/guard";

describe("guard", () => {
  const prevEnv = process.env.APP_CONTEXT;
  const prevNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.APP_CONTEXT = prevEnv;
    process.env.NODE_ENV = prevNodeEnv;
  });

  it("assertDarlinkContext rejects forbidden tokens", () => {
    expect(() => assertDarlinkContext("qc quebec")).toThrow(/country apps must remain isolated/);
    expect(() => assertDarlinkContext("OACIQ rule")).toThrow(/country apps must remain isolated/);
  });

  it("assertDarlinkRuntimeEnv allows unset APP_CONTEXT in development", () => {
    process.env.NODE_ENV = "development";
    delete process.env.APP_CONTEXT;
    expect(() => assertDarlinkRuntimeEnv()).not.toThrow();
  });

  it("assertDarlinkRuntimeEnv rejects wrong APP_CONTEXT when set", () => {
    process.env.NODE_ENV = "development";
    process.env.APP_CONTEXT = "other-monorepo-app";
    expect(() => assertDarlinkRuntimeEnv()).toThrow(/APP_CONTEXT=darlink/);
  });

  it("assertDarlinkRuntimeEnv requires darlink in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.APP_CONTEXT;
    expect(() => assertDarlinkRuntimeEnv()).toThrow(/APP_CONTEXT=darlink/);
    process.env.APP_CONTEXT = "darlink";
    expect(() => assertDarlinkRuntimeEnv()).not.toThrow();
  });
});
