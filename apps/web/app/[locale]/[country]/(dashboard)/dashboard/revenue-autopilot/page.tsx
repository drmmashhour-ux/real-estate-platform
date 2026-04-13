import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getRevenueOverview } from "@/lib/revenue-autopilot/get-revenue-overview";
import { RevenueRunClient } from "./revenue-run-client";
import { RevenueAutopilotSettingsForm } from "./revenue-settings-form";

export const dynamic = "force-dynamic";

export default async function RevenueAutopilotPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) notFound();

  const base = `/${locale}/${country}`;
  const overview = await getRevenueOverview({ scopeType: "owner", scopeId: userId });

  const rev90 = overview.health.totalRevenueCents90 / 100;
  const revPrev = overview.health.totalRevenueCentsPrev90 / 100;
  const trend =
    revPrev > 0 ? (((rev90 - revPrev) / revPrev) * 100).toFixed(1) : rev90 > 0 ? "new" : "0";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`${base}/bnhub/host/dashboard`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Host dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Revenue autopilot</h1>
      <p className="mt-1 text-sm text-slate-600">
        Gross booking revenue signals (BNHub short-term stays), monetization gaps, and prioritized growth actions.
        Estimates are directional — not tax or payout advice.
      </p>
      {overview.health.listingCount === 0 ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          No eligible stays on this account yet — publish BNHub listings or use the host login that owns inventory to see
          revenue health.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Revenue health score</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">
            {overview.health.revenueScore}
            <span className="ml-2 text-lg font-medium text-slate-500">/ 100</span>
          </p>
          {overview.health.portfolioHealthScore != null ? (
            <p className="mt-2 text-xs text-slate-600">
              Portfolio quality (cached): {overview.health.portfolioHealthScore}/100
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">90d gross (completed stays)</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {rev90.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Prior 90d: {revPrev.toLocaleString(undefined, { maximumFractionDigits: 0 })} · trend{" "}
            {typeof trend === "string" && trend !== "new" ? `${trend}%` : trend}
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-sm text-slate-800">
        {overview.health.summary}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Estimated opportunity upside (heuristic):{" "}
        <span className="font-semibold text-emerald-900">
          {(overview.estimatedUpsideCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>{" "}
        (minor units, directional)
      </p>

      <div className="mt-8 space-y-8">
        <RevenueAutopilotSettingsForm
          initial={{
            mode: overview.settings.mode,
            autoPromoteTopListings: overview.settings.autoPromoteTopListings,
            autoGenerateRevenueActions: overview.settings.autoGenerateRevenueActions,
            allowPriceRecommendations: overview.settings.allowPriceRecommendations,
          }}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Score breakdown</h2>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <li>Trend: {overview.health.trendScore}</li>
            <li>Conversion efficiency: {overview.health.conversionScore}</li>
            <li>Pricing efficiency: {overview.health.pricingEfficiencyScore}</li>
            <li>Portfolio mix: {overview.health.portfolioMixScore}</li>
          </ul>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Top earning listings</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {overview.topEarners.length === 0 ? (
                <li className="text-slate-500">No completed revenue in window.</li>
              ) : (
                overview.topEarners.map((l) => (
                  <li key={l.listingId} className="flex justify-between gap-2">
                    <Link
                      href={`${base}/dashboard/listings/${l.listingId}/quality`}
                      className="font-medium text-emerald-800 hover:underline"
                    >
                      {l.title}
                    </Link>
                    <span className="text-slate-500">{(l.revenue90dCents / 100).toFixed(0)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Weak monetizers</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {overview.weakMonetizers.length === 0 ? (
                <li className="text-slate-500">—</li>
              ) : (
                overview.weakMonetizers.map((l) => (
                  <li key={l.listingId} className="flex justify-between gap-2">
                    <Link
                      href={`${base}/dashboard/listings/${l.listingId}/quality`}
                      className="font-medium text-amber-900 hover:underline"
                    >
                      {l.title}
                    </Link>
                    <span className="text-slate-500">{l.views30d} views</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Biggest opportunities</h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {overview.opportunities.length === 0 ? (
              <li>None flagged.</li>
            ) : (
              overview.opportunities.slice(0, 8).map((o, i) => (
                <li key={`${o.listing.listingId}-${i}`}>
                  <span className="font-medium text-slate-800">{o.opportunityType}</span> — {o.listing.title}: {o.notes}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
          <RevenueRunClient
            basePath={base}
            actions={overview.actions.map((a) => ({
              id: a.id,
              actionType: a.actionType,
              title: a.title,
              description: a.description,
              priority: a.priority,
              status: a.status,
              estimatedUpliftCents: a.estimatedUpliftCents,
            }))}
          />
        </section>
      </div>
    </div>
  );
}
