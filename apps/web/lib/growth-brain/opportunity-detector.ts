import { explainDemandGap, explainSeoGap, explainStaleLeads, explainUnlockFunnel } from "./explain";
import type {
  GrowthBrainDomain,
  GrowthBrainPriorityLevel,
  GrowthBrainSnapshot,
  ScoredBuyerIntent,
  ScoredGrowthLead,
} from "./types";

export type BrainRecommendationDraft = {
  type: string;
  domain: GrowthBrainDomain;
  priority: GrowthBrainPriorityLevel;
  confidence: number;
  title: string;
  description: string;
  reasoning: string;
  suggestedAction: string;
  autoRunnable: boolean;
  requiresApproval: boolean;
  targetEntityType: string | null;
  targetEntityId: string | null;
  metadataJson: Record<string, unknown>;
};

/**
 * Turns snapshot + scores into draft recommendations (no DB ids yet).
 */
export function detectOpportunities(
  snapshot: GrowthBrainSnapshot,
  scoredLeads: ScoredGrowthLead[],
  scoredBuyers: ScoredBuyerIntent[]
): BrainRecommendationDraft[] {
  const out: BrainRecommendationDraft[] = [];

  if (snapshot.sparse) {
    out.push({
      type: "sparse_data_notice",
      domain: "retention",
      priority: "low",
      confidence: 0.55,
      title: "Limited analytics volume — widen instrumentation or wait for traffic",
      description:
        "The growth snapshot has few events. Recommendations will be conservative until behavior and listing analytics accumulate.",
      reasoning:
        "Sparse mode avoids overfitting; we still surface safe operational reminders (follow-up, drafts).",
      suggestedAction: "Keep CRM hygiene; confirm analytics pipelines are enabled in staging/production.",
      autoRunnable: false,
      requiresApproval: false,
      targetEntityType: null,
      targetEntityId: null,
      metadataJson: { sparse: true },
    });
  }

  // Supply: demand vs inventory mismatch (heuristic)
  for (const d of snapshot.demandByCityCategory.slice(0, 8)) {
    const inv = snapshot.inventoryByCityCategory.find((i) => i.city === d.city);
    const supply = inv?.totalListings ?? 0;
    if (d.trendScore >= 0.58 && supply > 0 && supply < 12 && d.engagementWeighted >= 3) {
      out.push({
        type: "supply_gap_city",
        domain: "supply",
        priority: "high",
        confidence: 0.62,
        title: `Supply gap signal: ${d.city}`,
        description: explainDemandGap(d.city, d.trendScore, supply),
        reasoning: `Trend score ${d.trendScore.toFixed(2)} with limited visible listings (${supply}) in aggregated inventory.`,
        suggestedAction:
          "Run permission-based owner/broker outreach in this city; prioritize warm CRM leads first.",
        autoRunnable: false,
        requiresApproval: true,
        targetEntityType: "city",
        targetEntityId: d.city,
        metadataJson: { city: d.city, trendScore: d.trendScore, supply },
      });
    }
  }

  // Stale leads
  if (snapshot.staleGrowthLeads.length > 0) {
    const city = snapshot.staleGrowthLeads[0]?.city;
    out.push({
      type: "stale_growth_leads",
      domain: "supply",
      priority: "medium",
      confidence: 0.7,
      title: `Follow up: ${snapshot.staleGrowthLeads.length} leads need attention`,
      description: explainStaleLeads(snapshot.staleGrowthLeads.length, city ?? null),
      reasoning: "Stages and follow-up flags indicate operator action may unlock conversions.",
      suggestedAction: "Batch human outreach using templates; mark sent in CRM after contact.",
      autoRunnable: true,
      requiresApproval: false,
      targetEntityType: "growth_lead_batch",
      targetEntityId: null,
      metadataJson: { count: snapshot.staleGrowthLeads.length },
    });
  }

  // Hot scored leads
  const hot = scoredLeads.filter((s) => s.tier === "hot").slice(0, 8);
  for (const h of hot) {
    out.push({
      type: "hot_lead_priority",
      domain: "conversion",
      priority: "high",
      confidence: 0.68,
      title: `Prioritize hot lead ${h.leadId.slice(0, 8)}…`,
      description: h.recommendedNextAction,
      reasoning: h.reasons.join(" "),
      suggestedAction: "Open growth CRM pipeline and assign owner for same-day follow-up.",
      autoRunnable: false,
      requiresApproval: true,
      targetEntityType: "growth_engine_lead",
      targetEntityId: h.leadId,
      metadataJson: { score: h.score, tier: h.tier },
    });
  }

  // Buyer intent — ready sessions
  for (const b of scoredBuyers.filter((x) => x.tier === "ready" || x.tier === "high_intent").slice(0, 6)) {
    out.push({
      type: "high_intent_buyer",
      domain: "demand",
      priority: b.tier === "ready" ? "high" : "medium",
      confidence: 0.64,
      title: `High-intent buyer session (${b.tier})`,
      description: b.recommendedNextAction,
      reasoning: b.reasons.join(" "),
      suggestedAction:
        "Use in-app assistance and saved-search prompts — do not auto-message external channels.",
      autoRunnable: false,
      requiresApproval: false,
      targetEntityType: b.userId ? "user" : "session",
      targetEntityId: b.userId ?? b.sessionKey,
      metadataJson: { score: b.score, tier: b.tier },
    });
  }

  // Low performing listings
  for (const low of snapshot.lowPerformingListings.slice(0, 5)) {
    out.push({
      type: "listing_conversion_friction",
      domain: "conversion",
      priority: "medium",
      confidence: 0.58,
      title: `Listing ${low.listingId.slice(0, 8)}… has traffic but weak engagement`,
      description:
        "Views are present relative to contacts/unlocks — review photos, title, and trust signals without making unverified performance claims.",
      reasoning: `Observed views=${low.viewsTotal}, contacts=${low.contactClicks}, unlock starts=${low.unlockStarts}.`,
      suggestedAction: "Suggest listing optimization checklist to the owner/host (draft only until they approve).",
      autoRunnable: false,
      requiresApproval: true,
      targetEntityType: "listing_analytics",
      targetEntityId: `${low.kind}:${low.listingId}`,
      metadataJson: { kind: low.kind, listingId: low.listingId },
    });
  }

  // SEO gaps
  for (const g of snapshot.seoCoverageGaps.slice(0, 6)) {
    out.push({
      type: "seo_city_coverage",
      domain: "seo",
      priority: "medium",
      confidence: 0.55,
      title: `SEO: consider a compliant city/collection page for ${g.city}`,
      description: explainSeoGap(g.city, g.listingCount),
      reasoning: `Inventory sample shows ${g.listingCount} listings; pair with editorial review before publish.`,
      suggestedAction: "Generate SEO draft in admin; legal/editor approval before go-live.",
      autoRunnable: true,
      requiresApproval: true,
      targetEntityType: "city",
      targetEntityId: g.city,
      metadataJson: { kind: g.kind, listingCount: g.listingCount },
    });
  }

  // Monetization — unlock funnel
  out.push({
    type: "unlock_funnel_review",
    domain: "revenue",
    priority: "medium",
    confidence: 0.52,
    title: "Review unlock funnel performance (sampled)",
    description: explainUnlockFunnel(snapshot.monetizationSignals.avgUnlockStartToSuccessRatio),
    reasoning: "Aggregated listing analytics only — no fabricated lift percentages.",
    suggestedAction: "If operators approve, run a scoped pricing/copy test with measurement windows.",
    autoRunnable: false,
    requiresApproval: true,
    targetEntityType: null,
    targetEntityId: null,
    metadataJson: {
      ratio: snapshot.monetizationSignals.avgUnlockStartToSuccessRatio,
    },
  });

  return dedupeByTypeCity(out);
}

function dedupeByTypeCity(recs: BrainRecommendationDraft[]): BrainRecommendationDraft[] {
  const seen = new Set<string>();
  const out: BrainRecommendationDraft[] = [];
  for (const r of recs) {
    const key = `${r.type}:${r.targetEntityType ?? ""}:${r.targetEntityId ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}
