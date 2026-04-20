import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/events/event-timeline.service", () => ({
  buildEntityTimeline: vi.fn(async () => ({
    events: [],
    byType: {},
    orderedIds: [],
  })),
}));

vi.mock("@/modules/integrations/regions/syria/syria-region-adapter.service", () => ({
  getListingById: vi.fn(),
  getBookingStats: vi.fn(() => ({
    data: null,
    availabilityNotes: [],
  })),
  SYRIA_REGION_CODE: "sy",
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      findUnique: vi.fn(() =>
        Promise.resolve({
          id: "web_1",
          price: 500000,
          title: "t",
          listingCode: "c",
          commissionCategory: "PREMIUM",
          updatedAt: new Date(),
        }),
      ),
    },
    autonomousMarketplaceRun: {
      count: vi.fn(() => Promise.resolve(2)),
      findMany: vi.fn((args: { select?: Record<string, unknown> }) => {
        if (args.select && Object.keys(args.select).length === 1 && args.select.targetId !== undefined) {
          return Promise.resolve([{ targetId: "web_1" }]);
        }
        return Promise.resolve([
          {
            id: "run_a",
            createdAt: new Date(),
            dryRun: true,
            status: "completed",
            autonomyMode: "ASSIST",
            actions: [
              {
                actionType: "CREATE_TASK",
                governanceDisposition: "AUTO_EXECUTE",
                executionStatus: "executed",
              },
            ],
          },
        ]);
      }),
    },
  },
}));

vi.mock("@/config/feature-flags", () => ({
  engineFlags: {
    syriaRegionAdapterV1: false,
    regionListingKeyV1: false,
    autonomousMarketplaceV1: true,
    autonomyExplainabilityV1: true,
    legalTrustRankingV1: false,
    controlledExecutionV1: true,
    unifiedIntelligenceV1: true,
  },
  eventTimelineFlags: {
    eventTimelineV1: false,
  },
}));

describe("buildUnifiedListingReadModel", () => {
  it("merges canonical runs with listing observation without throwing", async () => {
    const { buildUnifiedListingReadModel } = await import("../unified-intelligence.service");
    const model = await buildUnifiedListingReadModel({ listingId: "web_1", source: "web" });
    expect(model.listingId).toBe("web_1");
    expect(model.sourceStatus.canonicalRuns).toBe("available");
    expect(model.execution).toBeDefined();
    const exec = model.execution as { recentRuns?: unknown[] };
    expect(Array.isArray(exec.recentRuns)).toBe(true);
    expect(model.availabilityNotes.every((n) => typeof n === "string")).toBe(true);
  });
});

describe("buildUnifiedIntelligenceSummary", () => {
  it("returns counts and flags deterministically", async () => {
    const { buildUnifiedIntelligenceSummary } = await import("../unified-intelligence.service");
    const s = await buildUnifiedIntelligenceSummary();
    expect(s.canonicalRunCountHint).toBe(2);
    expect(s.flags.unifiedReadModel).toBe(true);
    expect(typeof s.freshness).toBe("string");
  });
});
