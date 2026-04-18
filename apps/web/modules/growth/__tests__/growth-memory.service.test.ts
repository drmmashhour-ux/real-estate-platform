import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildGrowthMemorySummaryFromEntries,
  consolidateGrowthMemoryEntries,
} from "../growth-memory.service";
import { extractGrowthMemoryEntries } from "../growth-memory-extractor.service";
import type { GrowthMemoryExtractorContext } from "../growth-memory.types";

describe("consolidateGrowthMemoryEntries", () => {
  it("merges duplicate titles and increases recurrence", () => {
    const ctx: GrowthMemoryExtractorContext = {
      executive: {
        status: "healthy",
        topPriorities: [],
        topRisks: ["Same risk", "Same risk"],
        campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
        leadSummary: { totalLeads: 10, hotLeads: 0 },
        createdAt: "x",
      },
      governance: null,
      strategyBundle: null,
      coordination: null,
      simulationBundle: null,
      responseDesk: null,
      adsHealth: "OK",
      leadsToday: 0,
      autopilotRejected: 0,
      autopilotPending: 0,
      autopilotManualOnly: 0,
      missingDataWarnings: [],
    };
    const raw = extractGrowthMemoryEntries(ctx);
    const merged = consolidateGrowthMemoryEntries(raw);
    const same = merged.filter((m) => m.title === "Same risk");
    expect(same.length).toBe(1);
    expect((same[0]?.recurrenceCount ?? 0) >= 2).toBe(true);
  });
});

describe("buildGrowthMemorySummaryFromEntries", () => {
  it("bounds category lists", () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      id: `b-${i}`,
      category: "blocker" as const,
      title: `Blocker ${i}`,
      detail: "d",
      source: "executive" as const,
      confidence: 0.5,
      createdAt: "x",
    }));
    const s = buildGrowthMemorySummaryFromEntries(entries);
    expect(s.recurringBlockers.length).toBeLessThanOrEqual(5);
  });
});

describe("buildGrowthMemorySummary flag gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns null when memory flag off", async () => {
    vi.stubEnv("FEATURE_GROWTH_MEMORY_V1", "");
    vi.resetModules();
    const { buildGrowthMemorySummary } = await import("../growth-memory.service");
    await expect(buildGrowthMemorySummary()).resolves.toBeNull();
  });
});
