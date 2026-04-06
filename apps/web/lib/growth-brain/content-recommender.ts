import type { BrainRecommendationDraft } from "./opportunity-detector";
import type { GrowthBrainSnapshot } from "./types";

/**
 * Content angles — drafts/ideas only; no auto-publish.
 */
export function recommendContentOpportunities(snapshot: GrowthBrainSnapshot): BrainRecommendationDraft[] {
  const out: BrainRecommendationDraft[] = [];
  const cities = snapshot.inventoryByCityCategory.slice(0, 5);

  for (const c of cities) {
    if (c.totalListings < 2) continue;
    out.push({
      type: "social_inventory_angle",
      domain: "content",
      priority: "low",
      confidence: 0.5,
      title: `Social angle: spotlight inventory in ${c.city}`,
      description:
        "Highlight real listings with owner permission — avoid fabricated performance claims; use neutral framing.",
      reasoning: `Inventory sample shows activity in ${c.city} (aggregated counts only).`,
      suggestedAction: "Draft a short carousel/post outline for operator review (see draft-content).",
      autoRunnable: true,
      requiresApproval: true,
      targetEntityType: "city",
      targetEntityId: c.city,
      metadataJson: { channel: "social", city: c.city },
    });
  }

  return out;
}
