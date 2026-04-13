import { describe, expect, it } from "vitest";
import { buildHttpSecurityHeaders } from "@/lib/security/http-security-headers";

describe("buildHttpSecurityHeaders", () => {
  const requiredKeys = [
    "X-Frame-Options",
    "X-XSS-Protection",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Content-Security-Policy",
    "X-DNS-Prefetch-Control",
  ] as const;

  it("includes core browser hardening headers in non-prod", () => {
    const h = buildHttpSecurityHeaders({ isProductionLike: false });
    const keys = new Set(h.map((x) => x.key));
    for (const k of requiredKeys) {
      expect(keys.has(k), `missing ${k}`).toBe(true);
    }
    const csp = h.find((x) => x.key === "Content-Security-Policy");
    expect(csp?.value).toContain("frame-ancestors");
  });

  it("adds HSTS only in production-like builds", () => {
    const dev = buildHttpSecurityHeaders({ isProductionLike: false });
    expect(dev.some((x) => x.key === "Strict-Transport-Security")).toBe(false);
    const prod = buildHttpSecurityHeaders({ isProductionLike: true });
    const hsts = prod.find((x) => x.key === "Strict-Transport-Security");
    expect(hsts?.value).toContain("max-age=");
  });
});
