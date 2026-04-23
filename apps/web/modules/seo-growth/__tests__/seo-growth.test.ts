import { describe, expect, it, beforeEach } from "vitest";

import {
  buildLocationKeywords,
  getCoreRealEstateKeywords,
  mergeKeywordPools,
} from "@/modules/seo-growth/seo-keywords.service";
import {
  createSeoContentPiece,
  generateSeoContent,
  buildPageSpec,
  listSeoContentPieces,
} from "@/modules/seo-growth/seo-content.service";
import {
  buildSeoPerformanceSummary,
  loadSeoMetricsStore,
  recordRankingSample,
  recordSeoLead,
  recordTraffic,
  resetAllSeoGrowthStoresForTests,
} from "@/modules/seo-growth/seo-ranking.service";

describe("seo-growth", () => {
  beforeEach(() => {
    resetAllSeoGrowthStoresForTests();
  });

  it("keyword engine merges core + location pools", () => {
    const loc = buildLocationKeywords("Montreal", "QC");
    const core = getCoreRealEstateKeywords();
    const merged = mergeKeywordPools([core, loc]);
    expect(merged.some((k) => k.phrase.includes("Montreal"))).toBe(true);
    expect(merged.length).toBeGreaterThanOrEqual(core.length);
  });

  it("generates article with metadata and body", () => {
    const kw = buildLocationKeywords("Montreal")[0]!;
    const draft = generateSeoContent({ keyword: kw, kind: "ARTICLE" });
    expect(draft.title.length).toBeGreaterThan(5);
    expect(draft.body).toContain("#");
    expect(draft.pageSpec.metadata.title.length).toBeGreaterThan(0);
    expect(draft.pageSpec.metadata.description.length).toBeGreaterThan(0);
  });

  it("createSeoContentPiece persists virtual page", () => {
    const kw = buildLocationKeywords("Montreal")[0]!;
    const piece = createSeoContentPiece({ keyword: kw, kind: "LANDING_PAGE" });
    expect(piece.pageSpec.path).toMatch(/^\/seo\//);
    expect(listSeoContentPieces().length).toBe(1);
  });

  it("buildPageSpec creates titles and descriptions", () => {
    const spec = buildPageSpec({
      kind: "GUIDE",
      title: "How brokers get more clients",
      description: "Practical acquisition plays for serious brokers in competitive markets.",
      slug: "brokers-more-clients",
      extraKeywords: ["broker", "pipeline"],
    });
    expect(spec.metadata.title).toContain("brokers");
    expect(spec.metadata.description.length).toBeLessThanOrEqual(155);
  });

  it("tracking aggregates traffic, rank, leads", () => {
    const kw = getCoreRealEstateKeywords()[0]!;
    const piece = createSeoContentPiece({ keyword: kw, kind: "ARTICLE" });
    recordTraffic(piece.id, 120);
    recordRankingSample(piece.id, 8);
    recordRankingSample(piece.id, 10);
    recordSeoLead(piece.id, 3);

    const summary = buildSeoPerformanceSummary(listSeoContentPieces(), loadSeoMetricsStore().metrics);
    expect(summary.totalSessions).toBe(120);
    expect(summary.avgPosition).toBe(9);
    expect(summary.totalLeadsFromSeo).toBe(3);
  });
});
