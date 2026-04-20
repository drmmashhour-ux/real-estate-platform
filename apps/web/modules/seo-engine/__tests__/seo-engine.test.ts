import { describe, expect, it } from "vitest";
import {
  buildEditorialContentBrief,
  buildInternalLinkPlan,
  buildKeywordPlan,
  buildLandingPageSuggestion,
  createPlaceholderSeoPerformanceSnapshot,
  generateCityPageMetadata,
  generateListingMetadata,
  generateStayMetadata,
  validateBriefGuardrails,
} from "../index";
import { findForbiddenTerm } from "../seo-quality-rules";

describe("seo-keyword.service", () => {
  it("generates primary and secondary keywords for marketplace hub", () => {
    const k = buildKeywordPlan({
      city: "Montreal",
      propertyType: "condos",
      intent: "buy",
      hub: "marketplace",
    });
    expect(k.primaryKeyword).toContain("Montreal");
    expect(k.secondaryKeywords.length).toBeGreaterThan(0);
    expect(k.longTailVariants.length).toBeGreaterThan(0);
  });

  it("uses BNHub intent for stays hub", () => {
    const k = buildKeywordPlan({
      city: "Montreal",
      intent: "short_term_stay",
      hub: "bnhub",
    });
    expect(k.primaryKeyword.toLowerCase()).toContain("short-term");
  });
});

describe("seo-metadata.service", () => {
  it("truncates listing title safely", () => {
    const m = generateListingMetadata({
      title: "A".repeat(80),
      city: "Laval",
      province: "QC",
      propertyCategory: "Condo",
    });
    expect(m.title.length).toBeLessThanOrEqual(61);
    expect(m.metaDescription.length).toBeLessThanOrEqual(157);
    expect(m.canonicalPathSuggestion).toBeTruthy();
  });

  it("generates city metadata for residence services focus", () => {
    const m = generateCityPageMetadata({
      city: "Montreal",
      province: "QC",
      country: "CA",
      pageFocus: "residence_services",
    });
    expect(m.title.toLowerCase()).toContain("montreal");
    expect(m.metaDescription.toLowerCase()).not.toContain("keyword stuffing");
    expect(m.canonicalPathSuggestion).toContain("residence-services");
  });
});

describe("seo-landing-page.service", () => {
  it("returns route and intro for luxury landing", () => {
    const p = buildLandingPageSuggestion("city_luxury", "Quebec City");
    expect(p.routeSuggestion).toContain("luxury");
    expect(p.supportingSectionIdeas.length).toBeGreaterThan(0);
  });
});

describe("seo-content-brief.service", () => {
  it("builds brief and passes guardrails", () => {
    const b = buildEditorialContentBrief("invest_evaluate_laval");
    const g = validateBriefGuardrails(b);
    expect(g.ok).toBe(true);
  });
});

describe("seo-internal-linking.service", () => {
  it("returns edges with anchors", () => {
    const edges = buildInternalLinkPlan("/en/ca");
    expect(edges.length).toBeGreaterThan(0);
    expect(edges[0].recommendedTargets[0].anchorSuggestions.length).toBeGreaterThan(0);
  });
});

describe("seo-performance.service", () => {
  it("creates placeholder snapshot", () => {
    const s = createPlaceholderSeoPerformanceSnapshot({ pagesGeneratedTotal: 10 });
    expect(s.pagesGeneratedTotal).toBe(10);
    expect(s.notes.some((n) => n.includes("Search Console"))).toBe(true);
  });
});

describe("seo-quality-rules", () => {
  it("detects forbidden terms", () => {
    expect(findForbiddenTerm("This is a diagnosis tool")).toBe("diagnosis");
    expect(findForbiddenTerm("Clean operational copy")).toBe(null);
  });
});

describe("seo-metadata stay", () => {
  it("does not imply guaranteed availability", () => {
    const m = generateStayMetadata({
      title: "Cozy suite",
      city: "Montreal",
      neighborhood: "Plateau",
    });
    expect(m.metaDescription.toLowerCase()).toMatch(/availability|calendar/);
  });
});
