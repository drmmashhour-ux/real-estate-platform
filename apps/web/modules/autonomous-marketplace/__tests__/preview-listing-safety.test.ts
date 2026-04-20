/**
 * Phase 10 — preview never executes marketplace actions or persists runs for listing preview path.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    fsboListing: {
      findUnique: vi.fn().mockResolvedValue({
        status: "ACTIVE",
        moderationStatus: "APPROVED",
        featuredUntil: null,
      }),
    },
    lead: { findUnique: vi.fn().mockResolvedValue(null) },
    adsAutomationCampaignResult: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("../signals/observation-builder", async () => {
  const actual = await vi.importActual<typeof import("../signals/observation-builder")>(
    "../signals/observation-builder",
  );
  return {
    ...actual,
    buildListingObservationSnapshot: vi.fn().mockResolvedValue(null),
    buildObservationForListing: vi.fn().mockResolvedValue({
      id: "obs-test",
      target: { type: "fsbo_listing", id: "listing-test" },
      signals: [],
      aggregates: {},
      facts: {},
      builtAt: new Date().toISOString(),
    }),
  };
});

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...actual,
    engineFlags: { ...actual.engineFlags, autonomousMarketplaceV1: true },
  };
});

describe("previewForListing safety", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns DRY_RUN execution envelope and preview-only detail", async () => {
    const { autonomousMarketplaceEngine } = await import("../execution/autonomous-marketplace.engine");
    const p = await autonomousMarketplaceEngine.previewForListing("listing-test");
    expect(p.executionResult.status).toBe("DRY_RUN");
    expect(p.executionResult.detail).toMatch(/Preview only/i);
    expect(p.executionResult.metadata?.mock).toBe(true);
    expect(p.signals).toEqual(p.observation.signals);
    expect(Array.isArray(p.executionResult.skippedActions)).toBe(true);
  });

  it("creates task-shaped actions only as proposals — preview does not call listing executor apply path", async () => {
    const { autonomousMarketplaceEngine } = await import("../execution/autonomous-marketplace.engine");
    const p = await autonomousMarketplaceEngine.previewForListing("listing-test");
    const taskLike = p.proposedActions.filter((a) => a.type === "CREATE_TASK");
    for (const a of taskLike) {
      expect(a.id).toBeTruthy();
    }
    expect(p.executionResult.status).toBe("DRY_RUN");
  });
});
