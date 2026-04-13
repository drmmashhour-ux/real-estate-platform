import { describe, expect, it, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { clearRateLimitStore } from "@/lib/rate-limit";
import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";

describe("gateDistributedRateLimit", () => {
  beforeEach(() => {
    clearRateLimitStore();
    delete process.env.RATE_LIMIT_IP_BLOCK;
  });

  it("allows first request and returns rate limit headers", async () => {
    const req = new NextRequest("http://localhost/api/x", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    const gate = await gateDistributedRateLimit(req, "test:gate", { windowMs: 60_000, max: 3 });
    expect(gate.allowed).toBe(true);
    if (gate.allowed) {
      expect(gate.responseHeaders["X-RateLimit-Remaining"]).toBeDefined();
    }
  });

  it("blocks after max requests (in-memory fallback)", async () => {
    const req = new NextRequest("http://localhost/api/x", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });
    clearRateLimitStore();
    expect((await gateDistributedRateLimit(req, "test:burst", { windowMs: 60_000, max: 3 })).allowed).toBe(
      true
    );
    expect((await gateDistributedRateLimit(req, "test:burst", { windowMs: 60_000, max: 3 })).allowed).toBe(
      true
    );
    expect((await gateDistributedRateLimit(req, "test:burst", { windowMs: 60_000, max: 3 })).allowed).toBe(
      true
    );
    const blocked = await gateDistributedRateLimit(req, "test:burst", { windowMs: 60_000, max: 3 });
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.response.status).toBe(429);
    }
  });
});
