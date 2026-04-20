/**
 * Real-data preview path: read-only observation, full detector registry + full policy when flag on.
 * Never calls executors.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const stableCreatedAt = new Date(Date.now() - 120 * 86400000);

const richListingInclude = {
  id: "listing-test",
  status: "ACTIVE",
  moderationStatus: "APPROVED",
  featuredUntil: null,
  title: "T",
  description: "D",
  priceCents: 1_000_00,
  city: "MTL",
  country: "CA",
  createdAt: stableCreatedAt,
  images: [],
  experienceTags: [],
  metrics: { conversionScore: 0.1, priceSuggestedCents: null },
  buyerListingViews: Array.from({ length: 200 }, (_, i) => ({ id: `v${i}` })),
  buyerSavedListings: [],
  buyerHubCrmLeads: [],
};

vi.mock("@/lib/db", () => ({
  prisma: {
    fsboListing: {
      findUnique: vi.fn().mockImplementation((args: { include?: unknown; select?: { _count?: unknown } }) => {
        if (args?.include) return Promise.resolve(richListingInclude);
        if (args?.select && "_count" in (args.select ?? {})) {
          return Promise.resolve({
            status: "ACTIVE",
            priceCents: 1_000_00,
            title: "T",
            _count: {
              buyerListingViews: 200,
              buyerSavedListings: 0,
              buyerHubCrmLeads: 0,
            },
          });
        }
        return Promise.resolve(null);
      }),
    },
    immoContactLog: { count: vi.fn().mockResolvedValue(0) },
    hostListingPerformanceSnapshot: { findFirst: vi.fn().mockResolvedValue(null) },
    lead: { findUnique: vi.fn().mockResolvedValue(null) },
    adsAutomationCampaignResult: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...actual,
    engineFlags: {
      ...actual.engineFlags,
      autonomousMarketplaceV1: true,
      autonomyPreviewRealV1: true,
    },
  };
});

describe("previewForListing real preview mode", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("surfaces observation signals and dry-run envelope without executing actions", async () => {
    const { autonomousMarketplaceEngine } = await import("../execution/autonomous-marketplace.engine");
    const p = await autonomousMarketplaceEngine.previewForListing("listing-test");

    expect(p.executionResult.status).toBe("DRY_RUN");
    expect(p.executionResult.reasons?.join(",")).toContain("preview mode");
    expect(p.executionResult.executedActions ?? []).toHaveLength(0);
    expect(Array.isArray(p.executionResult.skippedActions)).toBe(true);
    expect(p.executionResult.metadata?.previewMode).toBe(true);
    expect(p.executionResult.metadata?.autonomyPreviewRealV1).toBe(true);

    expect(p.signals).toBe(p.observation.signals);
    expect(p.observation.signals.length).toBeGreaterThan(0);

    const a = await autonomousMarketplaceEngine.previewForListing("listing-test");
    const b = await autonomousMarketplaceEngine.previewForListing("listing-test");
    const bundleKey = (x: typeof a) =>
      JSON.stringify({
        signalCount: x.observation.signals.length,
        opportunityCount: x.opportunities.length,
        actionTypes: x.proposedActions.map((p) => p.type).sort(),
        policyDispositions: x.policyDecisions.map((d) => d.disposition).sort(),
        risks: x.proposedActions.map((p) => p.risk).sort(),
      });
    expect(bundleKey(a)).toBe(bundleKey(b));
  });
});
