"use client";

export type GrowthAdsRoiPanelProps = {
  health: string;
  scaleSuggestion: string | null;
  pauseSuggestion: string | null;
};

export function GrowthAdsRoiPanel(ads: GrowthAdsRoiPanelProps) {
  return (
    <section className="rounded-xl border border-amber-900/35 bg-amber-950/15 p-4" data-growth-ads-roi-v1>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300/90">Ads ROI (UTM)</p>
      <h3 className="mt-1 text-lg font-semibold text-zinc-100">Campaign loop</h3>
      <p className="mt-2 text-sm">
        Health: <span className="font-semibold text-amber-200">{ads.health}</span>
      </p>
      {ads.scaleSuggestion ? (
        <p className="mt-2 text-sm text-emerald-200/95">
          <span className="text-zinc-500">Scale: </span>
          {ads.scaleSuggestion}
        </p>
      ) : null}
      {ads.pauseSuggestion ? (
        <p className="mt-2 text-sm text-amber-200/90">
          <span className="text-zinc-500">Tighten: </span>
          {ads.pauseSuggestion}
        </p>
      ) : null}
      <p className="mt-2 text-[11px] text-zinc-600">Uses /get-leads early_conversion_lead UTM metadata — no auto spend.</p>
    </section>
  );
}
