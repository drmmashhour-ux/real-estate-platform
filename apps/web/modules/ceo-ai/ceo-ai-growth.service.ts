import type { CeoDecisionProposal, CeoMarketSignals } from "@/modules/ceo-ai/ceo-ai.types";

/** Content drafts & page ideas only — never mutates homepage without CEO decision execution. */

export function proposeGrowthDecisions(signals: CeoMarketSignals): CeoDecisionProposal[] {
  const out: CeoDecisionProposal[] = [];

  if (signals.demandIndex > 0.55 && signals.leadsLast30d >= 15) {
    const cities =
      signals.demandIndex > 0.72 ? ["Montréal", "Laval", "Longueuil"] : ["Laval", "Terrebonne"];

    out.push({
      domain: "GROWTH",
      title: `Launch localized SEO hubs (${cities.slice(0, 2).join(", ")})`,
      summary:
        "Demand signals are elevated — expand city landing coverage to capture high-intent family searches.",
      rationale: `Demand index ${signals.demandIndex.toFixed(2)} with ${signals.leadsLast30d} leads/30d supports incremental SEO surface area without touching core homepage.`,
      confidence: 0.71,
      impactEstimate: 0.06,
      requiresApproval: true,
      payload: {
        kind: "growth_seo_city_pages",
        cities,
        notes: ["Intent: residence search + care level FAQs", "Internal review before publish"],
      },
    });
  }

  if (signals.avgLeadQualityScore != null && signals.avgLeadQualityScore < 42) {
    out.push({
      domain: "GROWTH",
      title: 'Shift primary CTA toward "Find a residence"',
      summary: "Lead quality skews low — test empathy-led CTA vs productivity-led copy on acquisition landings.",
      rationale: `Average lead score ${signals.avgLeadQualityScore.toFixed(1)} suggests messaging/browsing mismatch.`,
      confidence: 0.64,
      impactEstimate: 0.035,
      requiresApproval: false,
      payload: {
        kind: "growth_cta_shift",
        fromLabel: "Start now",
        toLabel: "Find a residence",
        scope: "marketing_landing_only",
      },
    });
  }

  out.push({
    domain: "GROWTH",
    title: "Prioritize family-centered explainers",
    summary: "Double down on decision-support content for adult children researching care options.",
    rationale:
      "Conversion and quality lift historically correlates with trust-building narratives in regulated categories.",
    confidence: 0.58,
    impactEstimate: 0.03,
    requiresApproval: false,
    payload: {
      kind: "growth_family_content",
      themes: ["Choosing between residences", "Budget + subsidies overview", "Visit checklist PDF"],
    },
  });

  return out;
}
