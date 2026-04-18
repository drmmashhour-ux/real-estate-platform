"use client";

export type GrowthPricingRecommendationPanelProps = {
  anchorCad: number;
  recommendedPrice: number;
  adjustmentPercent: number;
  note: string;
  recentUnlocks: number;
  priorUnlocks: number;
};

export function GrowthPricingRecommendationPanel(p: GrowthPricingRecommendationPanelProps) {
  return (
    <section className="rounded-xl border border-teal-900/40 bg-teal-950/15 p-4" data-growth-pricing-recommendation-v1>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-300/90">Pricing optimizer</p>
      <h3 className="mt-1 text-lg font-semibold text-zinc-100">Default unlock anchor</h3>
      <p className="mt-2 text-sm text-zinc-300">
        Suggested: <strong className="text-teal-200">${p.recommendedPrice.toFixed(2)} CAD</strong> (anchor ${p.anchorCad},
        Δ {p.adjustmentPercent}%)
      </p>
      <p className="mt-1 text-xs text-zinc-500">{p.note}</p>
      <p className="mt-1 text-[11px] text-zinc-600">
        Unlocks: {p.recentUnlocks} (last 7d incl. today) vs {p.priorUnlocks} (prior 7d). Manual review before any
        Stripe/catalog change.
      </p>
    </section>
  );
}
