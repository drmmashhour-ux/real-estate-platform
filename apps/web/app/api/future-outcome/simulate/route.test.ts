import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/lib/deal-analyzer/phase3ListingAccess", () => ({ assertFsboListingAccessibleForPhase3: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";

const validBody = {
  propertyId: "p1",
  listPriceCents: 500_000_00,
  scenarioInput: {
    propertyId: "p1",
    offerPriceCents: 500_000_00,
    depositAmountCents: 10_000_00,
    financingCondition: true,
    inspectionCondition: true,
    documentReviewCondition: true,
    occupancyDate: null,
    signatureDate: null,
    userStrategyMode: null,
  },
  simulationResult: {
    dealImpact: { score: 50, band: "neutral", summary: "s" },
    leverageImpact: { score: 50, band: "neutral", summary: "s" },
    riskImpact: { score: 50, band: "neutral", summary: "s" },
    readinessImpact: { score: 50, band: "neutral", summary: "s" },
    recommendedStrategy: "x",
    keyWarnings: [],
    recommendedProtections: [],
    nextActions: [],
    confidence: "medium",
    disclaimer: "d",
  },
};

describe("POST /api/future-outcome/simulate", () => {
  it("returns 404 when listing gate fails", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(assertFsboListingAccessibleForPhase3).mockResolvedValue({ ok: false } as never);
    const res = await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify(validBody) }) as never,
    );
    expect(res.status).toBe(404);
  });

  it("returns future outcome when gate ok", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(assertFsboListingAccessibleForPhase3).mockResolvedValue({ ok: true } as never);
    const res = await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify(validBody) }) as never,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result.timelineSteps).toBeDefined();
    expect(Array.isArray(json.result.possibleRisks)).toBe(true);
  });
});
