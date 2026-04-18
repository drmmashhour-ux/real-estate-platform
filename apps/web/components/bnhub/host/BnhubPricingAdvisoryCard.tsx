"use client";

import { useEffect, useState } from "react";

type Advisory = {
  listingId: string;
  currentPriceCents: number;
  suggestedPriceCents: number;
  band: { minCents: number; maxCents: number };
  demandLevel: string;
  confidenceLabel: string;
  noChangeRecommended: boolean;
  explanation: { summary: string; lines: string[] };
};

export function BnhubPricingAdvisoryCard({ listingId }: { listingId: string }) {
  const [data, setData] = useState<Advisory | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bnhub/host/pricing/suggest", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return;
        const advisory = j?.advisory as Advisory | null | undefined;
        setData(advisory ?? null);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (data === "loading" || data == null) return null;

  const fmt = (c: number) =>
    (c / 100).toLocaleString(undefined, { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

  return (
    <div className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">Pricing insight (advisory)</p>
      <p className="mt-1 text-xs text-neutral-300">{data.explanation.summary}</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
        <div>
          <dt className="text-neutral-500">Current</dt>
          <dd className="font-mono text-neutral-200">{fmt(data.currentPriceCents)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Suggested range</dt>
          <dd className="font-mono text-neutral-200">
            {fmt(data.band.minCents)} – {fmt(data.band.maxCents)}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">Demand</dt>
          <dd className="capitalize text-neutral-200">{data.demandLevel}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Confidence</dt>
          <dd className="capitalize text-neutral-200">{data.confidenceLabel}</dd>
        </div>
      </dl>
      {data.noChangeRecommended ? (
        <p className="mt-2 text-[11px] text-amber-200/90">Recommendation: keep your nightly rate steady for now.</p>
      ) : (
        <p className="mt-2 text-[11px] text-neutral-400">
          Suggested anchor: <span className="font-mono text-neutral-200">{fmt(data.suggestedPriceCents)}</span>{" "}
          (review before any change — never auto-applied).
        </p>
      )}
    </div>
  );
}
