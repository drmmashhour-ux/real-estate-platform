import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { verifyBnhubGrowthAutomationRequest } from "./bnhub-growth-internal-auth";

describe("verifyBnhubGrowthAutomationRequest", () => {
  const prev = process.env.BNHUB_GROWTH_CRON_SECRET;

  beforeEach(() => {
    process.env.BNHUB_GROWTH_CRON_SECRET = "test-secret-value";
  });

  afterEach(() => {
    process.env.BNHUB_GROWTH_CRON_SECRET = prev;
  });

  it("accepts x-bnhub-growth-secret when it matches", () => {
    const req = new NextRequest("http://localhost/api/internal/x", {
      headers: { "x-bnhub-growth-secret": "test-secret-value" },
    });
    expect(verifyBnhubGrowthAutomationRequest(req)).toBe(true);
  });

  it("accepts legacy x-cron-secret when it matches", () => {
    const req = new NextRequest("http://localhost/api/admin/x", {
      headers: { "x-cron-secret": "test-secret-value" },
    });
    expect(verifyBnhubGrowthAutomationRequest(req)).toBe(true);
  });

  it("rejects wrong secret", () => {
    const req = new NextRequest("http://localhost/api/internal/x", {
      headers: { "x-bnhub-growth-secret": "wrong" },
    });
    expect(verifyBnhubGrowthAutomationRequest(req)).toBe(false);
  });
});
