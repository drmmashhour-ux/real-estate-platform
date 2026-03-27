"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cityToSlug } from "@/lib/market/slug";

type Row = { city: string; propertyType: string; priceGrowth6mPercent: number | null; rentYieldProxy: number | null; trendLabel: string };

type Leaderboard = {
  bestByPriceGrowth6m: Row[];
  bestByRentYieldProxy: Row[];
  trendingRisingMarkets: Row[];
  disclaimer: string;
};

export function InvestmentsMarketOverview() {
  const [data, setData] = useState<Leaderboard | null>(null);

  useEffect(() => {
    fetch("/api/market/leaderboard")
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData(null));
  }, []);

  if (!data || (!data.bestByPriceGrowth6m?.length && !data.bestByRentYieldProxy?.length)) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-sm font-medium text-white">Market trend overview</p>
        <p className="mt-2 text-sm text-slate-400">
          No city-level market series loaded yet. When admins add data, growth and yield leaders will appear here.
        </p>
        <Link href="/market" className="mt-3 inline-block text-sm text-[#C9A646] hover:underline">
          Market pages →
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">Trend analysis (estimate)</p>
      <h2 className="mt-1 text-lg font-semibold text-white">Markets at a glance</h2>
      <p className="mt-1 text-xs text-slate-500">Not investment advice — illustrative rankings from available data.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-slate-400">Best 6m price growth (est.)</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-200">
            {data.bestByPriceGrowth6m.slice(0, 5).map((r) => (
              <li key={`${r.city}-${r.propertyType}-g`}>
                <Link href={`/market/${cityToSlug(r.city)}`} className="text-[#C9A646] hover:underline">
                  {r.city}
                </Link>{" "}
                ({r.propertyType}): {r.priceGrowth6mPercent != null ? `${r.priceGrowth6mPercent.toFixed(1)}%` : "—"}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Rent yield proxy (est.)</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-200">
            {data.bestByRentYieldProxy.slice(0, 5).map((r) => (
              <li key={`${r.city}-${r.propertyType}-y`}>
                {r.city}: {r.rentYieldProxy != null ? `${r.rentYieldProxy.toFixed(2)}%` : "—"}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Trending (rising)</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-200">
            {data.trendingRisingMarkets.slice(0, 5).map((r) => (
              <li key={`${r.city}-${r.propertyType}-t`}>
                {r.city} — {r.propertyType}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{data.disclaimer}</p>
      <Link href="/market" className="mt-2 inline-block text-sm text-[#C9A646] hover:underline">
        Explore market pages →
      </Link>
    </section>
  );
}
