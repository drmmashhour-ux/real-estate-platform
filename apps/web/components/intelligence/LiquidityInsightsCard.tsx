"use client";

export function LiquidityInsightsCard({
  city,
  liquidityScore,
  interpretation,
}: {
  city: string;
  liquidityScore: number;
  interpretation: string;
}) {
  return (
    <div className="rounded-xl border border-premium-gold/20 bg-black/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Liquidity</p>
      <p className="mt-1 text-lg font-bold text-white">{city}</p>
      <p className="text-sm text-slate-300">
        Score {liquidityScore.toFixed(1)} — <span className="text-slate-400">{interpretation}</span>
      </p>
    </div>
  );
}
