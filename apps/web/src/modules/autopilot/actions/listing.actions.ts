import type { ListingRuleHit } from "../rules/listing.rules";

export type ProposedListingAutopilotAction = {
  type: string;
  domain: "listing";
  severity: "info" | "warning" | "critical";
  riskLevel: "low" | "medium" | "high";
  title: string;
  description: string;
  payload: Record<string, unknown>;
};

const RULE_TO_ACTION: Record<
  string,
  Omit<ProposedListingAutopilotAction, "payload"> & { payload?: Record<string, unknown> }
> = {
  weak_title: {
    type: "suggest_title_improvement",
    domain: "listing",
    severity: "warning",
    riskLevel: "medium",
    title: "Strengthen your listing title",
    description: "Add location and a standout feature so buyers can discover your property faster.",
  },
  short_description: {
    type: "suggest_description_improvement",
    domain: "listing",
    severity: "warning",
    riskLevel: "medium",
    title: "Expand your description",
    description: "Longer, structured descriptions improve trust and conversion in search.",
  },
  too_few_photos: {
    type: "suggest_add_photos",
    domain: "listing",
    severity: "warning",
    riskLevel: "medium",
    title: "Add more photos",
    description: "Listings with richer galleries get more qualified inquiries.",
  },
  low_trust_score: {
    type: "suggest_verification_completion",
    domain: "listing",
    severity: "warning",
    riskLevel: "high",
    title: "Improve verification and trust signals",
    description: "Complete verification steps to unlock stronger placement and buyer confidence.",
  },
  stale_listing: {
    type: "suggest_price_review",
    domain: "listing",
    severity: "info",
    riskLevel: "high",
    title: "Review pricing and freshness",
    description:
      "This listing has not been updated recently. A price or content refresh may restore demand.",
  },
  high_impressions_low_inquiries: {
    type: "improve_conversion",
    domain: "listing",
    severity: "warning",
    riskLevel: "medium",
    title: "Strong visibility, weak conversion",
    description: "Traffic is reaching the listing but inquiries are low — tune photos, price, or trust cues.",
  },
  saved_often_not_contacted: {
    type: "prioritize_broker_followup",
    domain: "listing",
    severity: "info",
    riskLevel: "medium",
    title: "High interest from saves",
    description: "Many users saved this listing — follow up while intent is warm.",
  },
};

export function proposedActionsFromListingHits(
  hits: ListingRuleHit[],
  listingId: string
): ProposedListingAutopilotAction[] {
  const out: ProposedListingAutopilotAction[] = [];
  const emitted = new Set<string>();

  for (const h of hits) {
    if (h.ruleKey.startsWith("event:")) {
      if (!emitted.has("mark_growth_candidate")) {
        emitted.add("mark_growth_candidate");
        out.push({
          type: "mark_growth_candidate",
          domain: "listing",
          severity: "info",
          riskLevel: "low",
          title: "Growth review candidate",
          description: "Eligible for growth tooling review (no content changes applied automatically).",
          payload: { listingId, ruleKey: h.ruleKey },
        });
      }
      continue;
    }
    const mapped = RULE_TO_ACTION[h.ruleKey];
    if (!mapped || emitted.has(mapped.type)) continue;
    emitted.add(mapped.type);
    out.push({
      ...mapped,
      payload: { listingId, ruleKey: h.ruleKey, ...(h.detail ?? {}) },
    });
  }

  const needsFeaturedHint = hits.some((x) =>
    ["high_impressions_low_inquiries", "too_few_photos"].includes(x.ruleKey)
  );
  if (needsFeaturedHint && !emitted.has("mark_featured_candidate")) {
    out.push({
      type: "mark_featured_candidate",
      domain: "listing",
      severity: "info",
      riskLevel: "low",
      title: "Featured placement candidate",
      description: "Consider featured exposure after media/trust improvements.",
      payload: { listingId },
    });
  }

  return out;
}
