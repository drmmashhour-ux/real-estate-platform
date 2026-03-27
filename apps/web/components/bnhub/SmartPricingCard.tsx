export function SmartPricingCard(props: {
  currentCents: number;
  recommendedCents: number;
  confidence: "low" | "medium" | "high";
  demandLevel: string;
  marketAvgCents: number | null;
}) {
  const { currentCents, recommendedCents, confidence, demandLevel, marketAvgCents } = props;
  const cur = (currentCents / 100).toFixed(0);
  const rec = (recommendedCents / 100).toFixed(0);
  const delta = recommendedCents - currentCents;
  const deltaLabel =
    delta === 0 ? "aligned with model" : delta > 0 ? `+$${(delta / 100).toFixed(0)} vs your rate` : `−$${(Math.abs(delta) / 100).toFixed(0)} vs your rate`;

  return (
    <div className="rounded-xl border border-indigo-500/35 bg-indigo-950/30 p-4 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90">Smart pricing</p>
      <p className="mt-2 text-sm text-slate-400">
        Your nightly · <span className="font-semibold text-white">${cur}</span>
      </p>
      <p className="mt-1 text-lg font-semibold text-indigo-200">
        Suggested · ${rec}{" "}
        <span className="text-sm font-normal text-slate-400">({deltaLabel})</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-slate-600 px-2 py-0.5 text-slate-300">
          Model confidence: {confidence}
        </span>
        <span className="rounded-full border border-slate-600 px-2 py-0.5 text-slate-300">
          Demand: {demandLevel}
        </span>
        {marketAvgCents != null ? (
          <span className="rounded-full border border-slate-600 px-2 py-0.5 text-slate-300">
            Area avg · ${(marketAvgCents / 100).toFixed(0)}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Uses published peers in your city, recent booking activity, and seasonality — not a guarantee of revenue.
      </p>
    </div>
  );
}
