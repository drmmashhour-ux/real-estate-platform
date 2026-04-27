import { redirect } from "next/navigation";

import { MarketListingPricingExecuteClient } from "@/components/admin/MarketListingPricingExecuteClient";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getListingPricingRecommendations } from "@/lib/market/listingPricingEngine";
import { formatPricingRecommendationLabel } from "@/lib/market/pricingRecommendationLabels";

export const dynamic = "force-dynamic";

export default async function ListingPricingEnginePage({
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

  const recommendations = await getListingPricingRecommendations();

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">BNHub · LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Listing-Level Autonomous Pricing</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Dynamic pricing recommendations per stay. Execution is **opt-in**: use dry run by default, then apply with
          guardrails and full audit in <code className="font-mono text-zinc-500">pricing_execution_logs</code>.
        </p>
        <a href={base} className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </a>
      </div>

      <MarketListingPricingExecuteClient />

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a]">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Current recommendations (read-only)</h2>
          <p className="mt-1 text-xs text-zinc-500">Top signals from the listing engine — same input as execution.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Listing</th>
                <th className="whitespace-nowrap px-4 py-3">City</th>
                <th className="whitespace-nowrap px-4 py-3">Conv.</th>
                <th className="whitespace-nowrap px-4 py-3">RPV</th>
                <th className="whitespace-nowrap px-4 py-3">Recommendation</th>
                <th className="whitespace-nowrap px-4 py-3">Suggested %</th>
                <th className="min-w-[180px] px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                    No listing-level data yet. Enable FEATURE_AI_PRICING and ensure marketplace or legacy view events
                    exist.
                  </td>
                </tr>
              ) : (
                recommendations.slice(0, 25).map((r) => (
                  <tr key={r.listingId} className="border-b border-zinc-800/80 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-200">
                      {r.listingId.slice(0, 8)}…
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{r.city}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-300">
                      {(r.conversionRate * 100).toFixed(2)}%
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-300">
                      {r.revenuePerView.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-amber-200/95">
                      {formatPricingRecommendationLabel(r.recommendation)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-200">
                      {r.suggestedAdjustmentPercent > 0 ? `+` : ""}
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
