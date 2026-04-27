import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { flags } from "@/lib/flags";
import { getSeasonalPricingRecommendations } from "@/lib/market/seasonalPricingEngine";

export const dynamic = "force-dynamic";

const UI_DAYS = 7;

function seasonLabel(s: "normal" | "high_season" | "low_season") {
  if (s === "high_season") return "High";
  if (s === "low_season") return "Low";
  return "Normal";
}

export default async function SeasonalSurgePricingPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(`${base}`);
  }

  const recommendations = flags.AI_PRICING
    ? await getSeasonalPricingRecommendations({ daysAhead: UI_DAYS })
    : [];

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">BNHub · LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Seasonal &amp; Surge Pricing Engine</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Recommendation-only time-based multipliers (weekend, season, city demand from the heatmap). Does not
          change listing prices. Enable <code className="font-mono text-zinc-500">FEATURE_AI_PRICING=1</code> to
          populate; API serves up to 30 days &mdash; this view shows the next {UI_DAYS} days per listing.
        </p>
        <a href={base} className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a]">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Recommendations (read-only)</h2>
          <p className="mt-1 text-xs text-zinc-500">Next {UI_DAYS} days per published listing; combined % is clamped to −10% through +25%.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Listing ID</th>
                <th className="whitespace-nowrap px-4 py-3">City</th>
                <th className="whitespace-nowrap px-4 py-3">Date</th>
                <th className="whitespace-nowrap px-4 py-3">Day type</th>
                <th className="whitespace-nowrap px-4 py-3">Season</th>
                <th className="whitespace-nowrap px-4 py-3">Demand</th>
                <th className="whitespace-nowrap px-4 py-3">Base</th>
                <th className="whitespace-nowrap px-4 py-3">Suggested</th>
                <th className="whitespace-nowrap px-4 py-3">Adj. %</th>
                <th className="min-w-[200px] px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-zinc-500">
                    No data. Turn on FEATURE_AI_PRICING, or add published listings with demand data.
                  </td>
                </tr>
              ) : (
                recommendations.map((r) => (
                  <tr
                    key={`${r.listingId}-${r.date}`}
                    className="border-b border-zinc-800/80 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-200">
                      {r.listingId}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{r.city ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-300">{r.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{r.dayType}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{seasonLabel(r.seasonType)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{r.demandPressure}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-200">
                      {r.basePrice != null ? r.basePrice : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-amber-200/95">
                      {r.suggestedPrice != null ? r.suggestedPrice : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-200">
                      {r.suggestedAdjustmentPercent > 0 ? "+" : ""}
                      {r.suggestedAdjustmentPercent}%
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{r.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
