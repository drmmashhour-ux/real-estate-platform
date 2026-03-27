import { describe, expect, it, afterEach } from "vitest";
import {
  assertStripeSandboxForBillingSimulation,
  assertSystemValidationAllowed,
} from "../assertSafeTestEnvironment";

describe("assertSystemValidationAllowed", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("throws when TEST_MODE is not true", () => {
    delete process.env.TEST_MODE;
    expect(() => assertSystemValidationAllowed()).toThrow(/TEST_MODE/);
  });

  it("throws in production NODE_ENV without override", () => {
    process.env.TEST_MODE = "true";
    process.env.NODE_ENV = "production";
    delete process.env.LECIPM_ALLOW_SYSTEM_VALIDATION_IN_PRODUCTION;
    expect(() => assertSystemValidationAllowed()).toThrow(/production/);
  });

  it("allows production when explicitly overridden", () => {
    process.env.TEST_MODE = "true";
    process.env.NODE_ENV = "production";
    process.env.LECIPM_ALLOW_SYSTEM_VALIDATION_IN_PRODUCTION = "true";
    expect(() => assertSystemValidationAllowed()).not.toThrow();
  });
});

describe("assertStripeSandboxForBillingSimulation", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("allows empty key", () => {
    delete process.env.STRIPE_SECRET_KEY;
    const r = assertStripeSandboxForBillingSimulation();
    expect(r.sandboxOnly).toBe(true);
  });

  it("rejects live key", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_xxx";
    expect(() => assertStripeSandboxForBillingSimulation()).toThrow(/live/);
  });

  it("accepts test key", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    const r = assertStripeSandboxForBillingSimulation();
    expect(r.sandboxOnly).toBe(true);
  });
});
