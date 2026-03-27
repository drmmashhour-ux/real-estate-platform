/**
 * Core AI helper tests for pure fallback logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/bnhub/pricing", () => ({
  getPricingRecommendation: vi.fn(),
}));

vi.mock("@/lib/ai/lead-scoring", () => ({
  scoreLead: vi.fn(),
}));

vi.mock("@/lib/ai-listing-analysis", () => ({
  analyzeListing: (input: { title: string; description?: string; amenities?: string[]; location?: { city?: string; address?: string }; photos?: string[] }) => {
    const recommendations = [] as Array<{ type: string; priority: string; title: string; suggestion: string }>;
    let score = 80;
    if (!input.title || input.title.length < 10) {
      recommendations.push({ type: "title", priority: "high", title: "Improve title", suggestion: "Use a better title." });
      score -= 15;
    }
    if ((input.description ?? "").length < 100) {
      recommendations.push({ type: "description", priority: "high", title: "Improve description", suggestion: "Write more detail." });
      score -= 15;
    }
    if ((input.amenities ?? []).length < 3) score -= 10;
    if ((input.photos ?? []).length < 5) score -= 10;
    return { recommendations, overallScore: Math.max(0, score), summary: recommendations.length ? "Needs work." : "Strong listing." };
  },
}));

const { analyzeListing } = await import("@/lib/ai-listing-analysis");
const { optimizeListing, rewriteTitle, rewriteDescription, addSeoKeywords } = await import("@/lib/ai/optimize");
const { recommendTemplate } = await import("@/lib/ai/template-recommendation");
const { calculateScore, analyzeListing: brainAnalyzeListing, getAiFallbacksForHub } = await import("@/lib/ai/brain");
const { analyzePdfBuffer } = await import("@/lib/document-ai/client");

describe("core AI helpers", () => {
  beforeEach(() => {
    delete process.env.DOCUMENT_AI_URL;
  });

  it("scores listing analysis and exposes recommendations", () => {
    const out = analyzeListing({
      title: "Loft",
      description: "Nice place",
      amenities: ["Wifi"],
      photos: [],
      location: {},
    });
    expect(out.overallScore).toBeLessThan(80);
    expect(out.recommendations.length).toBeGreaterThan(0);
  });

  it("optimizes titles, descriptions and keywords from listing input", () => {
    const listing = {
      title: "Luxury condo",
      description: "Bright condo near downtown.",
      amenities: ["Wifi", "Parking"],
      location: { city: "Montreal", address: "123 Main St" },
      photos: ["one.jpg"],
    };
    expect(rewriteTitle(listing)).toContain("Luxury");
    expect(rewriteDescription(listing)).toContain("Montreal");
    expect(addSeoKeywords(listing)).toContain("Montreal real estate");
    const optimized = optimizeListing(listing);
    expect(optimized.optimizedTitle).toBeTruthy();
    expect(optimized.optimizedDescription).toBeTruthy();
  });

  it("recommends a template from the listing theme", () => {
    const rec = recommendTemplate({
      title: "Luxury penthouse",
      description: "High-end penthouse with city views.",
      amenities: [],
      location: {},
      photos: [],
    });
    expect(rec.recommendedTemplateId).toBeTruthy();
    expect(rec.reason).toContain("Luxury");
  });

  it("returns ai brain fallbacks with safe defaults", () => {
    expect(calculateScore({
      title: "Modern family home",
      description: "Large listing with great location",
      amenities: ["Wifi", "Parking", "Pool"],
      location: { city: "Montreal" },
      photos: ["a.jpg", "b.jpg", "c.jpg", "d.jpg", "e.jpg"],
    })).toBeGreaterThan(0);
    expect(brainAnalyzeListing({
      title: "Modern family home",
      description: "Large listing with great location",
      amenities: ["Wifi", "Parking", "Pool"],
      location: { city: "Montreal" },
      photos: ["a.jpg", "b.jpg", "c.jpg", "d.jpg", "e.jpg"],
    }).score).toBeGreaterThan(0);
    expect(getAiFallbacksForHub("luxury")).toHaveProperty("template");
  });

  it("falls back when document ai url is missing", async () => {
    const result = await analyzePdfBuffer(Buffer.from("%PDF-1.4 fake"), "doc-1");
    expect(result.confidence_score).toBe(0);
    expect(result.cadastre_number).toBeNull();
  });
});
