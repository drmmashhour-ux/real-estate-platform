import { describe, expect, it, vi, beforeEach } from "vitest";

const viFlags = vi.hoisted(() => ({
  hubJourneyV1: true,
  hubCopilotV1: true,
  hubJourneyAnalyticsV1: true,
}));

vi.mock("@/config/feature-flags", () => ({
  engineFlags: viFlags,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true }),
  getRateLimitHeaders: () => ({}),
}));

vi.mock("@/modules/journey/hub-journey-monitoring.service", () => ({
  logJourneyOutcomeEvent: vi.fn(),
}));

import { POST } from "./route";

describe("POST /api/journey/outcome", () => {
  beforeEach(() => {
    viFlags.hubJourneyAnalyticsV1 = true;
  });

  it("returns disabled when analytics flag is off", async () => {
    viFlags.hubJourneyAnalyticsV1 = false;
    const req = new Request("http://localhost/api/journey/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "journey_banner_viewed",
        hub: "buyer",
        locale: "en",
        country: "ca",
        actorType: "guest",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.disabled).toBe(true);
  });

  it("returns 400 for invalid hub when analytics enabled", async () => {
    viFlags.hubJourneyAnalyticsV1 = true;
    const req = new Request("http://localhost/api/journey/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "journey_banner_viewed",
        hub: "not-a-hub",
        locale: "en",
        country: "ca",
        actorType: "guest",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("accepts valid outcome payload when analytics enabled", async () => {
    viFlags.hubJourneyAnalyticsV1 = true;
    const req = new Request("http://localhost/api/journey/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "journey_next_cta_clicked",
        hub: "seller",
        locale: "en",
        country: "ca",
        actorType: "authenticated",
        progressPercent: 40,
        currentStepId: "seller-1-start",
        confidence: "medium",
        suggestionIds: ["a", "b"],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
