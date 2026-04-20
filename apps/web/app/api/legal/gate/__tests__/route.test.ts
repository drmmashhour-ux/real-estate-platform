import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/modules/legal/legal-gate-session.service", () => ({
  evaluateLegalComplianceForUser: vi.fn(),
}));

vi.mock("@/config/feature-flags", async (imp) => {
  const actual = await imp<typeof import("@/config/feature-flags")>();
  return {
    ...actual,
    legalHubFlags: {
      ...actual.legalHubFlags,
      legalHubV1: true,
    },
  };
});

import { POST } from "../route";
import { getGuestId } from "@/lib/auth/session";
import { evaluateLegalComplianceForUser } from "@/modules/legal/legal-gate-session.service";

describe("POST /api/legal/gate", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockResolvedValue("user-1");
    vi.mocked(evaluateLegalComplianceForUser).mockResolvedValue({
      gate: {
        allowed: true,
        mode: "none",
        reasons: [],
        blockingRequirements: [],
      },
      readiness: {
        score: 80,
        level: "mostly_ready",
        missingCritical: 0,
        missingOptional: 1,
        completed: 5,
        total: 6,
      },
    });
  });

  it("returns allowed, gate fields, and readiness", async () => {
    const req = new Request("http://localhost/api/legal/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_offer",
        actor: "buyer",
        locale: "en",
        country: "ca",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.allowed).toBe(true);
    expect(json.mode).toBe("none");
    expect(Array.isArray(json.reasons)).toBe(true);
    expect(Array.isArray(json.blockingRequirements)).toBe(true);
    expect(json.readiness).toBeTruthy();
  });

  it("returns 400 for invalid action", async () => {
    const req = new Request("http://localhost/api/legal/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invalid_action_xyz" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getGuestId).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/legal/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit_offer" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
