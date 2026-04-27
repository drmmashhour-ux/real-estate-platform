import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { labelDemandAction } from "@/lib/market/demandActions";
import { getCityPricingRecommendations } from "@/lib/market/cityPricingEngine";
import { formatPricingRecommendationLabel } from "@/lib/market/pricingRecommendationLabels";

export const dynamic = "force-dynamic";

export default async function CityPricingEnginePage({
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

  const recommendations = await getCityPricingRecommendations();

  return (
    <div className="min-h-screen space-y-8 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">BNHub · LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">City-Level Autonomous Pricing Engine</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          This module recommends city-level pricing actions based on demand signals. It does not automatically
          change listing prices yet.
        </p>
        <a href={base} className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </a>
      </div>

      <p className="text-xs text-zinc-500">
        Recommendations are rule-based and read from the same demand heatmap as analytics — decision support
        with soft % biases only; no automatic price writes.
      </p>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">City</th>
                <th className="whitespace-nowrap px-4 py-3">Demand</th>
                <th className="whitespace-nowrap px-4 py-3">Trend (7d)</th>
                <th className="min-w-[180px] px-4 py-3">Order 83 actions</th>
                <th className="whitespace-nowrap px-4 py-3">Views</th>
                <th className="whitespace-nowrap px-4 py-3">Bookings</th>
                <th className="whitespace-nowrap px-4 py-3">Demand score</th>
                <th className="whitespace-nowrap px-4 py-3">Pricing rec.</th>
                <th className="whitespace-nowrap px-4 py-3">Suggested %</th>
                <th className="min-w-[200px] px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-zinc-500">
                    No city demand data yet. Recommendations will appear when heatmap data is available.
                  </td>
                </tr>
              ) : (
                recommendations.map((r) => (
                  <tr key={r.city} className="border-b border-zinc-800/80 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-white">{r.city}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-200">{r.demandBand}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-300">
                      {r.trend >= 0 ? "+" : ""}
                      {Math.round(r.trend * 1000) / 10}%
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {r.demandActions.length === 0 ? (
                        <span className="text-zinc-500">—</span>
                      ) : (
                        <ul className="list-inside list-disc text-xs leading-relaxed">
                          {r.demandActions.map((a) => (
                            <li key={a}>{labelDemandAction(a)}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-300">{r.views}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-300">{r.bookings}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-200">
                      {r.demandScore.toFixed(1)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-amber-200/95">
                      {formatPricingRecommendationLabel(r.recommendation)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-200">
                      {r.suggestedAdjustmentPercent > 0 ? `+` : ""}
                      {r.suggestedAdjustmentPercent}%
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{r.reason}</td>
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
