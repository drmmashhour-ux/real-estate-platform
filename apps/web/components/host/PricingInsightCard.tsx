"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type V2Result = {
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  comparableCount: number;
  marketMedian: number | null;
  lowConfidence: boolean;
  preserveCurrentPrice: boolean;
  currentPrice: number;
  currencyHint: string;
  reasoning: string[];
  warnings: string[];
  scenarios: {
    conservative: { label: string; recommendedPrice: number };
    balanced: { label: string; recommendedPrice: number };
    aggressive: { label: string; recommendedPrice: number };
  };
};

export function PricingInsightCard({ listingId }: { listingId: string }) {
  const [data, setData] = useState<V2Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/pricing/recommend-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingType: "bnhub", listingId, persistSnapshot: false }),
      });
      const j = (await res.json()) as { ok?: boolean; result?: V2Result; error?: string };
      if (!res.ok || !j.ok || !j.result) {
        setErr(j.error ?? "Unavailable");
        setData(null);
      } else {
        setData(j.result);
      }
    } catch {
      setErr("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-[#111] p-6 text-sm text-zinc-500">
        Loading pricing insight…
      </div>
    );
  }
  if (err || !data) {
    return null;
  }

  const cur = data.currencyHint || "CAD";

  return (
    <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-br from-[#141208] to-[#0d0d0d] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">Pricing intelligence</p>
          <h3 className="mt-1 font-serif text-lg text-white">Suggested nightly (modeled)</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Internal peers only — not an external market appraisal.{" "}
            {data.lowConfidence ? "Low confidence: treat as exploratory." : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-amber-100">
            {data.preserveCurrentPrice ? "Hold" : `$${data.recommendedPrice.toFixed(0)}`}
            <span className="ml-1 text-sm font-normal text-zinc-500">{cur}</span>
          </p>
          <p className="text-xs text-zinc-500">
            Current ~${data.currentPrice.toFixed(0)} · confidence {(data.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <dt className="text-xs text-zinc-500">Band</dt>
          <dd className="text-zinc-200">
            ${data.minPrice.toFixed(0)} – ${data.maxPrice.toFixed(0)}
          </dd>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <dt className="text-xs text-zinc-500">Peer sample</dt>
          <dd className="text-zinc-200">{data.comparableCount} listings</dd>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <dt className="text-xs text-zinc-500">Peer median (internal)</dt>
          <dd className="text-zinc-200">{data.marketMedian != null ? `$${data.marketMedian.toFixed(0)}` : "—"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-white/10 px-2 py-1 text-zinc-400">
          {data.scenarios.conservative.label}: ${data.scenarios.conservative.recommendedPrice.toFixed(0)}
        </span>
        <span className="rounded-full border border-amber-900/50 px-2 py-1 text-amber-100/90">
          {data.scenarios.balanced.label}: ${data.scenarios.balanced.recommendedPrice.toFixed(0)}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-zinc-400">
          {data.scenarios.aggressive.label}: ${data.scenarios.aggressive.recommendedPrice.toFixed(0)}
        </span>
      </div>

      {data.reasoning.length > 0 ? (
        <ul className="mt-4 list-inside list-disc space-y-1 text-xs text-zinc-400">
          {data.reasoning.slice(0, 5).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      ) : null}

      {data.warnings.length > 0 ? (
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-200/80">
          {data.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/bnhub/host/pricing/listings/${listingId}`}
          className="text-xs font-medium text-amber-300 hover:text-amber-200"
        >
          Open listing pricing →
        </Link>
        <span className="text-xs text-zinc-600">Changes are never applied automatically.</span>
      </div>
    </div>
  );
}
