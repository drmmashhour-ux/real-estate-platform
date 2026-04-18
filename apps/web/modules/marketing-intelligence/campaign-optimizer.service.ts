/**
 * Rule-based campaign suggestions from real ROI + funnel signals — explainable, no black box.
 */
export type OptimizationSuggestion = {
  category: "headline" | "cta" | "targeting" | "budget";
  title: string;
  detail: string;
  basedOn: string;
};

export type CampaignOptimizationResult = {
  suggestions: OptimizationSuggestion[];
  explain: string[];
};

export function optimizeCampaign(input: {
  revenueCents: number;
  spendCents: number;
  leadCount: number;
  bookingCount: number;
  weakestFunnelStep: { from: string; to: string } | null;
  impressions: number;
  clicks: number;
}): CampaignOptimizationResult {
  const explain: string[] = [];
  const suggestions: OptimizationSuggestion[] = [];

  const ctr = input.impressions > 0 ? input.clicks / input.impressions : 0;
  if (input.impressions > 50 && ctr < 0.01) {
    suggestions.push({
      category: "headline",
      title: "Refresh primary headline / hook",
      detail: "CTR is below 1% on recorded impressions — test a clearer value prop in the first line.",
      basedOn: `clicks/impressions ≈ ${(ctr * 100).toFixed(2)}%`,
    });
    explain.push("Headline suggestion triggered by low CTR on recorded impressions.");
  }

  if (input.spendCents > 0 && input.revenueCents < input.spendCents) {
    suggestions.push({
      category: "budget",
      title: "Tighten audience or pause low-intent placements",
      detail: "Spend exceeds attributed revenue in the window — narrow geography or intent before scaling.",
      basedOn: `revenue ${input.revenueCents}¢ vs spend ${input.spendCents}¢`,
    });
    explain.push("Budget guidance from spend > attributed revenue (reported events only).");
  }

  if (input.leadCount > 0 && input.bookingCount === 0 && input.leadCount >= 5) {
    suggestions.push({
      category: "cta",
      title: "Strengthen booking CTA after lead capture",
      detail: "Leads exist but no booking events — add a direct BNHub stay link and urgency line in follow-up.",
      basedOn: `leads ${input.leadCount}, bookings ${input.bookingCount}`,
    });
    explain.push("CTA suggestion from leads without booking completions in the same window.");
  }

  if (input.weakestFunnelStep) {
    suggestions.push({
      category: "targeting",
      title: `Improve ${input.weakestFunnelStep.from} → ${input.weakestFunnelStep.to}`,
      detail: "Largest relative drop in your recorded funnel — align ad creative with the next step’s intent.",
      basedOn: `funnel weakest link: ${input.weakestFunnelStep.from} → ${input.weakestFunnelStep.to}`,
    });
    explain.push("Targeting nudge from funnel drop-off heuristic.");
  }

  if (suggestions.length === 0) {
    suggestions.push({
      category: "headline",
      title: "Keep monitoring weekly",
      detail: "No strong negative signals in current metrics — continue A/B testing headlines and CTAs.",
      basedOn: "neutral signals",
    });
    explain.push("Default guidance when thresholds are not crossed.");
  }

  return { suggestions: suggestions.slice(0, 6), explain };
}
