import { describe, expect, it, vi } from "vitest";
import { assertDarlinkContext, assertDarlinkRuntimeEnv } from "@/lib/guard";

describe("guard", () => {
  it("assertDarlinkContext rejects forbidden tokens", () => {
    expect(() => assertDarlinkContext("qc quebec")).toThrow(/Forbidden cross-platform logic detected/);
    expect(() => assertDarlinkContext("OACIQ rule")).toThrow(/Forbidden cross-platform logic detected/);
  });

  it("assertDarlinkRuntimeEnv allows unset APP_CONTEXT in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_CONTEXT", "");
    expect(() => assertDarlinkRuntimeEnv()).not.toThrow();
    vi.unstubAllEnvs();
  });

  it("assertDarlinkRuntimeEnv rejects wrong APP_CONTEXT when set", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_CONTEXT", "other-monorepo-app");
    expect(() => assertDarlinkRuntimeEnv()).toThrow(/APP_CONTEXT=darlink/);
    vi.unstubAllEnvs();
  });

  it("assertDarlinkRuntimeEnv requires darlink in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_CONTEXT", "");
    expect(() => assertDarlinkRuntimeEnv()).toThrow(/APP_CONTEXT=darlink/);
    
    vi.stubEnv("APP_CONTEXT", "darlink");
    expect(() => assertDarlinkRuntimeEnv()).not.toThrow();
    vi.unstubAllEnvs();
  });
});
