import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { ImpactBand, SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/lib/analytics/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/lib/deal-analyzer/phase3ListingAccess", () => ({
  assertFsboListingAccessibleForPhase3: vi.fn(),
}));
vi.mock("@/src/modules/offer-strategy-simulator/application/simulateOfferStrategy", () => ({
  simulateOfferStrategy: vi.fn(),
}));
vi.mock("@repo/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ plan: "free", role: "USER" }),
    },
  },
}));
vi.mock("@/src/modules/growth-funnel/application/checkGrowthPaywall", () => ({
  checkGrowthPaywall: vi.fn().mockResolvedValue({ allowed: true, remaining: 8, limit: 8 }),
}));
vi.mock("@/src/modules/growth-funnel/application/recordSuccessfulSimulatorRun", () => ({
  recordSuccessfulSimulatorRun: vi.fn().mockResolvedValue(undefined),
}));

import { getGuestId } from "@/lib/auth/session";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { simulateOfferStrategy } from "@/src/modules/offer-strategy-simulator/application/simulateOfferStrategy";

const body = {
  propertyId: "p1",
  offerPriceCents: 100_000,
  depositAmountCents: 5000,
  financingCondition: true,
  inspectionCondition: true,
  documentReviewCondition: true,
  occupancyDate: null,
  signatureDate: null,
  userStrategyMode: null,
};

const mockResult = {
  disclaimer: "d",
  confidence: SimulationConfidence.High,
  keyWarnings: [] as string[],
  recommendedProtections: [] as string[],
  nextActions: [] as string[],
  recommendedStrategy: "s",
  dealImpact: { score: 50, band: ImpactBand.Neutral, summary: "" },
  leverageImpact: { score: 50, band: ImpactBand.Neutral, summary: "" },
  riskImpact: { score: 50, band: ImpactBand.Neutral, summary: "" },
  readinessImpact: { score: 50, band: ImpactBand.Neutral, summary: "" },
};

describe("POST /api/offer-strategy/simulate", () => {
  it("returns 404 when listing is not accessible (auth gate)", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(assertFsboListingAccessibleForPhase3).mockResolvedValue({ ok: false, status: 404 });
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(body) }));
    expect(res.status).toBe(404);
    expect(simulateOfferStrategy).not.toHaveBeenCalled();
  });

  it("returns 200 when simulation succeeds", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(assertFsboListingAccessibleForPhase3).mockResolvedValue({ ok: true, isOwner: true, isAdmin: false });
    vi.mocked(simulateOfferStrategy).mockResolvedValue({ ok: true, result: mockResult });
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify(body) }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.result.recommendedStrategy).toBe("s");
  });
});
