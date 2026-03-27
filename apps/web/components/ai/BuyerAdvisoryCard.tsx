"use client";

import { useState, useEffect } from "react";
import { AiAdvisoryLabel } from "./AiAdvisoryLabel";

type BuyerAdvisory = {
  riskLevel: "low" | "medium" | "high";
  priceVsMarket: { label: string; detail: string; percentDiff?: number };
  potentialIssues: string[];
};

export function BuyerAdvisoryCard({ listingId }: { listingId: string }) {
  const [data, setData] = useState<BuyerAdvisory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    fetch(`/api/ai/advisory/buyer?listingId=${encodeURIComponent(listingId)}`)
      .then((r) => r.json())
      .then((d) => (d.error ? null : d))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold text-slate-200">AI insights</h2>
        <p className="mt-2 text-sm text-slate-500">Loading…</p>
        <AiAdvisoryLabel className="mt-3" />
      </div>
    );
  }

  if (!data) return null;

  const riskColors = {
    low: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40",
    medium: "bg-amber-500/20 text-amber-300 ring-amber-500/40",
    high: "bg-red-500/20 text-red-300 ring-red-500/40",
  };
  const riskLabel = { low: "Low risk", medium: "Medium risk", high: "High risk" };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold text-slate-200">AI insights</h2>
      <AiAdvisoryLabel className="mt-1" />

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-400">Risk level</p>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ${riskColors[data.riskLevel]}`}
          >
            {riskLabel[data.riskLevel]}
          </span>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400">Price vs market</p>
          <p className="mt-1 text-sm font-medium text-slate-200">{data.priceVsMarket.label}</p>
          <p className="mt-0.5 text-sm text-slate-400">{data.priceVsMarket.detail}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400">Potential issues</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-400">
            {data.potentialIssues.slice(0, 5).map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
