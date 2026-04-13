import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, clearRateLimitStore, getRateLimitHeaders } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("allows up to max requests per window", () => {
    const key = "ip:test-1";
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit(key, { max: 5, windowMs: 60_000 });
      expect(r.allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, { max: 5, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("getRateLimitHeaders exposes reset hint", () => {
    const r = checkRateLimit("ip:test-2", { max: 10, windowMs: 60_000 });
    const h = getRateLimitHeaders(r);
    expect(h["X-RateLimit-Remaining"]).toBeDefined();
    expect(h["X-RateLimit-Reset"]).toBeDefined();
  });
});
