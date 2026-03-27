"use client";

import { useEffect, useState } from "react";
import { MarketTrendCard } from "./MarketTrendCard";

type ApiPayload = {
  summary: {
    direction: string;
    confidence: string;
    safeSummary: string;
    warnings: string[];
  };
  newerSnapshot: { snapshotDate: string; medianPriceCents: string | null; activeListingCount: number } | null;
  olderSnapshot: { snapshotDate: string; medianPriceCents: string | null; activeListingCount: number } | null;
  disclaimer?: string;
  error?: string;
};

type Props = {
  regionSlug: string;
  propertyType?: string;
  mode?: string;
  windowDays?: 30 | 90 | 180;
};

export function RegionTrendPanel({ regionSlug, propertyType = "unknown", mode = "investor", windowDays = 90 }: Props) {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const enc = encodeURIComponent(regionSlug);
        const qs = new URLSearchParams({
          propertyType,
          mode,
          windowDays: String(windowDays),
        });
        const res = await fetch(`/api/market-trends/regions/${enc}?${qs.toString()}`, {
          credentials: "include",
        });
        const j = (await res.json()) as ApiPayload & { error?: string };
        if (!res.ok) {
          if (!cancelled) setError(j.error ?? `HTTP ${res.status}`);
          return;
        }
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [regionSlug, propertyType, mode, windowDays]);

  if (loading) {
    return <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6 text-sm text-slate-400">Loading region trends…</div>;
  }
  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-100">{error}</div>
    );
  }
  if (!data?.summary) return null;

  return (
    <div className="space-y-4">
      <MarketTrendCard
        direction={data.summary.direction}
        confidence={data.summary.confidence}
        safeSummary={data.summary.safeSummary}
        warnings={data.summary.warnings}
      />
      {data.newerSnapshot && data.olderSnapshot ? (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-400">
          <p>
            Compared snapshots: {data.olderSnapshot.snapshotDate} → {data.newerSnapshot.snapshotDate}. Median (newer):{" "}
            {data.newerSnapshot.medianPriceCents != null
              ? `$${(Number(data.newerSnapshot.medianPriceCents) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : "—"}
          </p>
          {data.disclaimer ? <p className="mt-2 text-slate-500">{data.disclaimer}</p> : null}
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Need at least two daily snapshots for directional comparison. Run the market snapshot refresh job after data is available.
        </p>
      )}
    </div>
  );
}
