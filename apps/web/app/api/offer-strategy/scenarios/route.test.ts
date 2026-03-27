import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/lib/analytics/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/lib/deal-analyzer/phase3ListingAccess", () => ({
  assertFsboListingAccessibleForPhase3: vi.fn(),
}));
vi.mock("@/src/modules/offer-strategy-simulator/application/getOfferScenarioHistory", () => ({
  getOfferScenarioHistory: vi.fn(),
}));
vi.mock("@/src/modules/offer-strategy-simulator/application/saveOfferScenario", () => ({
  saveOfferScenario: vi.fn(),
}));
vi.mock("@/src/modules/growth-funnel/application/trackGrowthFunnelEvent", () => ({
  trackGrowthFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));

import { getGuestId } from "@/lib/auth/session";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { getOfferScenarioHistory } from "@/src/modules/offer-strategy-simulator/application/getOfferScenarioHistory";
import { saveOfferScenario } from "@/src/modules/offer-strategy-simulator/application/saveOfferScenario";

describe("GET /api/offer-strategy/scenarios", () => {
  it("returns 401 when not signed in", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await GET(new Request("http://x?propertyId=p1&caseId=c1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when listing not accessible", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(assertFsboListingAccessibleForPhase3).mockResolvedValue({ ok: false, status: 404 });
    const res = await GET(new Request("http://x?propertyId=p1&caseId=c1"));
    expect(res.status).toBe(404);
    expect(getOfferScenarioHistory).not.toHaveBeenCalled();
  });

  it("returns scenarios when gate passes", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(assertFsboListingAccessibleForPhase3).mockResolvedValue({ ok: true, isOwner: true, isAdmin: false });
    vi.mocked(getOfferScenarioHistory).mockResolvedValue([]);
    const res = await GET(new Request("http://x?propertyId=p1&caseId=c1"));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.scenarios).toEqual([]);
  });
});

describe("POST /api/offer-strategy/scenarios", () => {
  const body = {
    propertyId: "p1",
    caseId: "c1",
    scenarioLabel: "Test",
    input: {
      propertyId: "p1",
      offerPriceCents: 100_000,
      depositAmountCents: 5000,
      financingCondition: true,
      inspectionCondition: true,
      documentReviewCondition: true,
      occupancyDate: null,
      signatureDate: null,
      userStrategyMode: null,
    },
    output: {
      dealImpact: { score: 50, band: "neutral", summary: "" },
      leverageImpact: { score: 50, band: "neutral", summary: "" },
      riskImpact: { score: 50, band: "neutral", summary: "" },
      readinessImpact: { score: 50, band: "neutral", summary: "" },
      recommendedStrategy: "s",
      keyWarnings: [],
      recommendedProtections: [],
      nextActions: [],
      confidence: "high",
      disclaimer: "d",
    },
  };

  it("returns 401 when not signed in", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(body) }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when listing not accessible", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(assertFsboListingAccessibleForPhase3).mockResolvedValue({ ok: false, status: 404 });
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(body) }));
    expect(res.status).toBe(404);
    expect(saveOfferScenario).not.toHaveBeenCalled();
  });
});
