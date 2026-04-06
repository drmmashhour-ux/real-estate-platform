import type { BrainRecommendationDraft } from "./opportunity-detector";
import type { GrowthBrainSnapshot } from "./types";

/**
 * SEO opportunities — page ideas, not live URLs without review.
 */
export function buildSeoRecommendations(snapshot: GrowthBrainSnapshot): BrainRecommendationDraft[] {
  const out: BrainRecommendationDraft[] = [];

  for (const g of snapshot.seoCoverageGaps.slice(0, 8)) {
    const slug = `${g.kind.toLowerCase()}-${g.city.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`.replace(/^-|-$/g, "");
    out.push({
      type: "seo_collection_page",
      domain: "seo",
      priority: g.listingCount >= 8 ? "high" : "medium",
      confidence: 0.54,
      title: `Draft SEO page: ${g.city} (${g.kind})`,
      description:
        "Propose a compliant landing page that lists only verified inventory and required disclosures.",
      reasoning: `Listing counts in snapshot suggest ${g.listingCount} listings — verify before publishing.`,
      suggestedAction: `Prepare draft at /city or /collections path after editorial + legal review. Suggested slug fragment: ${slug}`,
      autoRunnable: true,
      requiresApproval: true,
      targetEntityType: "city",
      targetEntityId: g.city,
      metadataJson: { slugSuggestion: slug, kind: g.kind },
    });
  }

  return out;
}
