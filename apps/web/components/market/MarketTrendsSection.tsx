"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cityToSlug } from "@/lib/market/slug";

type Analysis = {
  label?: string;
  trend: { trend: "rising" | "stable" | "declining" };
  forecast: {
    predictedPrice3Months: number;
    predictedPrice6Months: number;
    predictedPrice12Months: number;
  };
  marketScore: number;
  insights: string[];
  confidence: number;
  dataPoints: number;
  disclaimer: string;
};

export function MarketTrendsSection({ city, propertyType = "Residential" }: { city: string; propertyType?: string }) {
  const [data, setData] = useState<Analysis | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const q = new URLSearchParams({ city, type: propertyType });
    fetch(`/api/market/analysis?${q}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Request failed");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        setData(j);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message ?? "Could not load trend analysis.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city, propertyType]);

  if (loading) {
    return (
      <section className="mt-10 rounded-2xl border border-white/10 bg-[#121212] p-6 text-sm text-slate-400">
        Loading market trend analysis…
      </section>
    );
  }

  if (err || !data) {
    return (
      <section className="mt-10 rounded-2xl border border-white/10 bg-[#121212] p-6 text-sm text-slate-400">
        <p className="text-xs uppercase tracking-wider text-[#C9A646]">Market Trends</p>
        <p className="mt-2">{err ?? "No analysis available."}</p>
        <p className="mt-2 text-xs text-slate-500">
          Trend analysis may appear once market data exists for this city.{" "}
          <Link href={`/market/${cityToSlug(city)}`} className="text-[#C9A646] hover:underline">
            Open city market page
          </Link>
        </p>
      </section>
    );
  }

  if (data.dataPoints < 2) {
    return (
      <section className="mt-10 rounded-2xl border border-white/10 bg-[#121212] p-6">
        <p className="text-xs uppercase tracking-wider text-[#C9A646]">Market Trends</p>
        <p className="mt-2 text-sm text-slate-400">
          Not enough historical data in our system for a reliable trend estimate for <strong>{city}</strong>.
        </p>
        <p className="mt-3 text-xs text-slate-500">{data.disclaimer}</p>
      </section>
    );
  }

  const badge =
    data.trend.trend === "rising" ? (
      <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-sm text-emerald-200">
        ↑ Rising (estimate)
      </span>
    ) : data.trend.trend === "declining" ? (
      <span className="rounded-full border border-red-500/40 bg-red-950/40 px-3 py-1 text-sm text-red-200">
        ↓ Declining (estimate)
      </span>
    ) : (
      <span className="rounded-full border border-slate-500/40 bg-slate-900/60 px-3 py-1 text-sm text-slate-200">
        → Stable (estimate)
      </span>
    );

  return (
    <section className="mt-10 rounded-2xl border border-[#C9A646]/25 bg-black/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C9A646]">Market Trends</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Trend analysis — {city}</h2>
        </div>
        {badge}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Market score (estimate)</p>
          <p className="mt-1 text-2xl font-bold text-white">{data.marketScore}/100</p>
          <p className="text-xs text-slate-500">Confidence: {data.confidence}/100</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">Avg. price forecast (illustrative)</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            <li>3 mo: ${(data.forecast.predictedPrice3Months / 100).toLocaleString()}</li>
            <li>6 mo: ${(data.forecast.predictedPrice6Months / 100).toLocaleString()}</li>
            <li>12 mo: ${(data.forecast.predictedPrice12Months / 100).toLocaleString()}</li>
          </ul>
        </div>
      </div>

      {data.insights[0] ? <p className="mt-4 text-sm leading-relaxed text-slate-300">{data.insights[0]}</p> : null}

      <p className="mt-4 text-xs text-slate-500">{data.disclaimer}</p>
      <Link href={`/market/${cityToSlug(city)}`} className="mt-3 inline-block text-sm text-[#C9A646] hover:underline">
        Full trend analysis & charts →
      </Link>
    </section>
  );
}
