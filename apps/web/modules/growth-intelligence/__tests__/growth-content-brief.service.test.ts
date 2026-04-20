import { describe, expect, it } from "vitest";
import {
  buildCtaImprovementBrief,
  buildProgrammaticLandingBrief,
  buildSeoContentBrief,
} from "../growth-content-brief.service";
import type { GrowthOpportunity } from "../growth.types";

const baseOpp = (): GrowthOpportunity => ({
  id: "opp_1",
  opportunityType: "create_content_brief",
  severity: "info",
  title: "Sample",
  explanation: "Explain",
  entityType: "region",
  entityId: null,
  region: "MTL",
  locale: "en",
  country: "ca",
  signalIds: ["s1"],
  createdAt: "2026-04-01T12:00:00.000Z",
  metadata: {},
});

describe("growth-content-brief.service", () => {
  it("SEO brief contains required sections", () => {
    const b = buildSeoContentBrief(baseOpp());
    expect(b.title.length).toBeGreaterThan(4);
    expect(b.keySections.length).toBeGreaterThan(0);
    expect(b.ctaGoals.length).toBeGreaterThan(0);
    expect(b.disclaimers.some((d) => d.includes("legal"))).toBe(true);
    expect(b.notesForReview.some((n) => n.includes("opp_1"))).toBe(true);
    expect(b.whyGeneratedNow.length).toBeGreaterThan(12);
    expect(Array.isArray(b.timelineEvidenceSummary)).toBe(true);
  });

  it("programmatic brief targets region safely", () => {
    const b = buildProgrammaticLandingBrief({
      ...baseOpp(),
      opportunityType: "create_programmatic_page_brief",
      region: "QC-QC",
    });
    expect(b.targetRegion).toBe("QC-QC");
    expect(b.purpose.length).toBeGreaterThan(10);
  });

  it("CTA brief references entity without invented metrics", () => {
    const b = buildCtaImprovementBrief({
      ...baseOpp(),
      opportunityType: "improve_cta",
      entityId: "listing_x",
    });
    expect(b.title.includes("listing_x")).toBe(true);
  });
});
