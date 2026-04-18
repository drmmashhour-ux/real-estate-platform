import { describe, expect, it, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { buildGrowthFusionSnapshot } from "../growth-fusion-snapshot.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/modules/ads/ads-performance.service", () => ({
  getAdsPerformanceSummary: vi.fn().mockResolvedValue({
    windowDays: 90,
    since: "2026-01-01",
    until: "2026-04-02",
    impressions: 10,
    clicks: 2,
    leads: 0,
    bookingsStarted: 0,
    bookingsCompleted: 0,
    estimatedSpend: 0,
    ctrPercent: 20,
    cpl: null,
    conversionRatePercent: 0,
  }),
  getAdsPerformanceByCampaign: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/services/growth/cro-v8-optimization-bridge", () => ({
  runCroV8OptimizationBundle: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    aiAutopilotContentAssistFlags: {
      contentAssistV1: false,
      adCopyV1: false,
      listingCopyV1: false,
      outreachCopyV1: false,
    },
  };
});

vi.mock("@/modules/growth/ai-autopilot.service", () => ({
  buildAutopilotActions: vi.fn().mockReturnValue([]),
}));

vi.mock("@/modules/growth/ai-autopilot-influence.service", () => ({
  buildInfluenceSuggestions: vi.fn().mockReturnValue([]),
}));

beforeEach(() => {
  vi.mocked(prisma.lead.count).mockImplementation((args?: { where?: { createdAt?: { gte?: Date } } }) => {
    if (args?.where?.createdAt?.gte) return Promise.resolve(3);
    return Promise.resolve(42);
  });
});

describe("buildGrowthFusionSnapshot", () => {
  it("builds a normalized snapshot with partial modules", async () => {
    const snap = await buildGrowthFusionSnapshot();
    expect(snap.leads.totalCount).toBe(42);
    expect(snap.leads.recent7dCount).toBe(3);
    expect(snap.ads.summary).not.toBeNull();
    expect(snap.warnings).toBeDefined();
    expect(Array.isArray(snap.autopilot.actions)).toBe(true);
  });
});
