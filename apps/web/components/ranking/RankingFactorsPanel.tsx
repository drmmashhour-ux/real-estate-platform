"use client";

import type { ReputationRankingFactors } from "@/modules/ranking/ranking-factors.service";

export function RankingFactorsPanel({ factors }: { factors: ReputationRankingFactors }) {
  const rows: { key: keyof ReputationRankingFactors; label: string }[] = [
    { key: "listingQuality", label: "Listing quality" },
    { key: "hostTrust", label: "Host trust" },
    { key: "reviewStrength", label: "Reviews" },
    { key: "conversionStrength", label: "Conversion" },
    { key: "freshness", label: "Freshness" },
    { key: "riskPenalty", label: "Risk penalty" },
    { key: "pricingCompetitiveness", label: "Pricing fit" },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.key} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{row.label}</p>
          <p className="text-lg font-semibold tabular-nums text-zinc-100">{factors[row.key].toFixed(1)}</p>
        </div>
      ))}
    </div>
  );
}
