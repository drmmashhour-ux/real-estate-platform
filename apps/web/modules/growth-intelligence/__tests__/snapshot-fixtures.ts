import type { GrowthSnapshot } from "../growth.types";

export function emptyGrowthSnapshot(overrides: Partial<GrowthSnapshot> = {}): GrowthSnapshot {
  return {
    id: "snap_test",
    collectedAt: "2026-04-01T12:00:00.000Z",
    locale: "en",
    country: "ca",
    availabilityNotes: [],
    inventoryByRegion: [],
    leadStats: null,
    funnelRatiosByListing: [],
    trustDistribution: [],
    legalReadinessSamples: [],
    contentFreshness: null,
    campaignRollups: [],
    rankingHints: [],
    demandSignals: [],
    ...overrides,
  };
}
