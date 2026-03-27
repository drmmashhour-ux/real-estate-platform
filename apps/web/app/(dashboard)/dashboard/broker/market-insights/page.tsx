"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Zone = { city: string; listingCount: number; avgNightPriceCents: number; label: string };
type Trend = { city: string; newListings: number };

export default function BrokerMarketInsightsPage() {
  const [hotZones, setHotZones] = useState<Zone[]>([]);
  const [trending, setTrending] = useState<Trend[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai/market/summary", { credentials: "same-origin" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setErr(d.error ?? "Unable to load");
          return;
        }
        setHotZones(Array.isArray(d.hotZones) ? d.hotZones : []);
        setTrending(Array.isArray(d.trendingAreas) ? d.trendingAreas : []);
      })
      .catch(() => setErr("Network error"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/dashboard/broker" className="text-sm text-emerald-400 hover:text-emerald-300">
        ← Broker hub
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Market analytics (AI)</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Aggregated from published inventory — hot zones and trending areas. Explainable rules, not forecasts.
      </p>

      {err && (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {err}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-orange-500/25 bg-orange-500/5 p-5">
          <h2 className="text-lg font-medium text-orange-200">Hot zones</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {hotZones.length === 0 && !err && <li className="text-slate-500">No aggregate data yet.</li>}
            {hotZones.map((z) => (
              <li key={z.city} className="flex justify-between border-b border-white/5 py-2 text-slate-300">
                <span>
                  {z.city}{" "}
                  <span className="text-xs text-slate-500">({z.label})</span>
                </span>
                <span className="text-slate-500">
                  {z.listingCount} listings · ~${(z.avgNightPriceCents / 100).toFixed(0)}/night
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5">
          <h2 className="text-lg font-medium text-emerald-200">Trending areas</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {trending.length === 0 && !err && <li className="text-slate-500">No recent listing velocity data.</li>}
            {trending.map((t) => (
              <li key={t.city} className="flex justify-between border-b border-white/5 py-2 text-slate-300">
                <span>{t.city}</span>
                <span className="text-slate-500">{t.newListings} new (window)</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
