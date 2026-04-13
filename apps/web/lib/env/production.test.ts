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

  it("warns when DATABASE_URL uses literal HOST as hostname (Vercel template mistake)", () => {
    process.env.VERCEL = "1";
    process.env.DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/dbname";
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const s = getProductionEnvStatus();
    expect(s.ok).toBe(true);
    expect(s.warnings.some((w) => w.includes("literal hostname HOST"))).toBe(true);
  });
});
