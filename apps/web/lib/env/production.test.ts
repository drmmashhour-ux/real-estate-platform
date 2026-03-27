import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getProductionEnvStatus } from "@/lib/env/production";

describe("production env status", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env = { ...saved };
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it("reports missing core vars when unset", () => {
    delete process.env.DATABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const s = getProductionEnvStatus();
    expect(s.ok).toBe(false);
    expect(s.missing.length).toBeGreaterThan(0);
  });

  it("reports ok when required vars are set", () => {
    process.env.DATABASE_URL = "postgresql://x";
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const s = getProductionEnvStatus();
    expect(s.ok).toBe(true);
  });
});
