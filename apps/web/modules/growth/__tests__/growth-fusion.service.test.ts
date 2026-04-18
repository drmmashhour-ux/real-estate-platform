import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildGrowthFusionSystem } from "../growth-fusion.service";
import type { GrowthFusionRawSnapshot } from "../growth-fusion-snapshot.service";

const fusionFlags = vi.hoisted(() => ({
  growthFusionV1: false,
  growthFusionAutopilotBridgeV1: false,
  growthFusionContentBridgeV1: false,
  growthFusionInfluenceBridgeV1: false,
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    growthFusionFlags: fusionFlags,
  };
});

vi.mock("../growth-fusion-snapshot.service", () => ({
  buildGrowthFusionSnapshot: vi.fn(async (): Promise<GrowthFusionRawSnapshot> => ({
    createdAt: "2026-04-02T12:00:00.000Z",
    leads: { totalCount: 5, recent7dCount: 1 },
    ads: { summary: null, byCampaign: null },
    cro: null,
    content: { adDrafts: 0, listingDrafts: 0, outreachDrafts: 0, skippedReason: "off" },
    autopilot: { actions: [] },
    influence: { suggestions: [] },
    warnings: [],
  })),
}));

beforeEach(() => {
  fusionFlags.growthFusionV1 = false;
  vi.clearAllMocks();
});

describe("buildGrowthFusionSystem", () => {
  it("returns null when FEATURE_GROWTH_FUSION_V1 is off", async () => {
    fusionFlags.growthFusionV1 = false;
    await expect(buildGrowthFusionSystem()).resolves.toBeNull();
  });

  it("returns snapshot, summary, and actions when flag on", async () => {
    fusionFlags.growthFusionV1 = true;
    const out = await buildGrowthFusionSystem();
    expect(out).not.toBeNull();
    expect(out?.snapshot.leads.totalCount).toBe(5);
    expect(out?.summary.status).toMatch(/weak|moderate|strong/);
    expect(Array.isArray(out?.actions)).toBe(true);
  });
});
