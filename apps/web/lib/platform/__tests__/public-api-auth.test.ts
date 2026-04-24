import { describe, expect, it, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { authenticatePublicApi, partnerHasScopes } from "../public-api-auth";
import { __resetPartnersForTests } from "../partner-registry";
import type { Partner } from "@/modules/platform/partner.types";

const sample: Partner = {
  id: "p_test",
  name: "Test",
  type: "broker",
  apiKey: "lecipm_pk_test_secret",
  scopes: ["leads:read", "leads:write"],
};

beforeEach(() => {
  __resetPartnersForTests([sample]);
});

describe("authenticatePublicApi", () => {
  it("rejects missing key", () => {
    const req = new NextRequest("http://localhost/api/public/leads");
    const r = authenticatePublicApi(req, ["leads:read"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it("accepts bearer token", () => {
    const req = new NextRequest("http://localhost/api/public/leads", {
      headers: { authorization: "Bearer lecipm_pk_test_secret" },
    });
    const r = authenticatePublicApi(req, ["leads:read"]);
    expect(r.ok).toBe(true);
  });

  it("accepts x-api-key", () => {
    const req = new NextRequest("http://localhost/api/public/leads", {
      headers: { "x-api-key": "lecipm_pk_test_secret" },
    });
    const r = authenticatePublicApi(req, ["leads:read"]);
    expect(r.ok).toBe(true);
  });

  it("enforces scopes", () => {
    const req = new NextRequest("http://localhost/api/public/insights", {
      headers: { authorization: "Bearer lecipm_pk_test_secret" },
    });
    const r = authenticatePublicApi(req, ["insights:read"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });
});

describe("partnerHasScopes", () => {
  it("returns true when all scopes present", () => {
    expect(partnerHasScopes(sample, ["leads:read"])).toBe(true);
  });
});
