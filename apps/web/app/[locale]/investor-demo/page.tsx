import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getMarketplaceBrainActions } from "@/lib/ai/marketplaceBrain";
import { getGrowthBrainActions } from "@/lib/growth/growthBrain";
import { getRevenueIntelligence } from "@/lib/finance/revenueInsights";
import { flags } from "@/lib/flags";
import { generateMarketInsights } from "@/lib/market/insights";
import { getLaunchFocusLineForDay } from "@/lib/launch/plan";
import { getCityPricingRecommendations } from "@/lib/market/cityPricingEngine";
import { getListingPricingRecommendations } from "@/lib/market/listingPricingEngine";
import { getAcquisitionInsights } from "@/lib/growth/acquisitionInsights";

type Props = { params: Promise<{ locale: string }> };

function shortId(id: string): string {
  if (id.length <= 10) return id;
  return `${id.slice(0, 8)}…`;
}

function recLabel(r: "increase_price" | "decrease_price" | "keep_price"): string {
  return r.replaceAll("_", " ");
}

function recTone(
  r: "increase_price" | "decrease_price" | "keep_price"
): { card: string; label: string } {
  if (r === "increase_price") {
    return {
      card: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30",
      label: "text-emerald-800 dark:text-emerald-200",
    };
  }
  if (r === "decrease_price") {
    return {
      card: "border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/30",
      label: "text-red-800 dark:text-red-200",
    };
  }
  return {
    card: "border-slate-200 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/40",
    label: "text-slate-700 dark:text-zinc-300",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "LECIPM AI Marketplace Engine — Investor Demo",
    description:
      "Live demonstration of autonomous pricing, demand intelligence, and revenue optimization.",
    alternates: { canonical: `/${locale}/investor-demo` },
  };
}

export default async function InvestorDemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const enabled = flags.AI_PRICING;
  const brainEnabled = flags.AUTONOMOUS_AGENT;
  const demoRotationDay = (Math.floor(Date.now() / 86_400_000) % 7) + 1;
  const launchLine = getLaunchFocusLineForDay(demoRotationDay);

  const [cityPricing, listingPricing, revenue] = enabled
    ? await Promise.all([
        getCityPricingRecommendations(),
        getListingPricingRecommendations(),
        getRevenueIntelligence(),
      ])
    : [[], [], { totalRevenue: 0, avgRevenuePerListing: 0, topCityByRevenue: null }];

  const [brainTopActions, growthBrainTopActions] = brainEnabled
    ? await Promise.all([getMarketplaceBrainActions(), getGrowthBrainActions()])
    : [[], []];

  const acquisition = await getAcquisitionInsights().catch(() => null);

  const cityTop = cityPricing.slice(0, 3);
  const listingTop = listingPricing.slice(0, 5);
  const { insights, actions } = generateMarketInsights(cityPricing, listingPricing);

  const fullyEmpty =
    enabled &&
    cityPricing.length === 0 &&
    listingPricing.length === 0 &&
    revenue.totalRevenue === 0 &&
    revenue.topCityByRevenue == null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          LECIPM AI Marketplace Engine
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Live demonstration of autonomous pricing, demand intelligence, and revenue optimization.
        </p>
        <p className="mt-3 inline-flex max-w-2xl rounded-lg border border-amber-200/50 bg-amber-50/80 px-3 py-2 text-sm font-medium text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
          7-day launch plan: {launchLine} (read-only; ops checklist lives in the admin dashboard)
        </p>
      </div>

      {!enabled ? (
        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">AI modules are disabled</p>
          <p className="mt-2 text-sm opacity-90">
            Set <code className="rounded bg-black/5 px-1 font-mono dark:bg-white/10">FEATURE_AI_PRICING=1</code> to load
            city and listing engines, insights, and revenue rollups.
          </p>
        </div>
      ) : null}

      {fullyEmpty ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-400">
          <p>
            No data available yet. Tracking will populate this dashboard. Events, bookings, and revenue entries will
            appear here as the marketplace is used.
          </p>
        </div>
      ) : null}

      {enabled ? (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {/* 1. City pricing */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              City-Level Autonomous Pricing
            </h2>
            {cityTop.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">No city rows yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {cityTop.map((c) => {
                  const t = recTone(c.recommendation);
                  return (
                    <li
                      key={c.city}
                      className={`rounded-xl border p-3 text-sm ${t.card}`}
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">{c.city}</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">Demand: {c.demandScore.toFixed(1)}</p>
                      <p className={`mt-1 font-medium capitalize ${t.label}`}>
                        {c.recommendation.replace("_", " ")}
                        {c.suggestedAdjustmentPercent !== 0
                          ? ` · ${c.suggestedAdjustmentPercent > 0 ? "+" : ""}${c.suggestedAdjustmentPercent}%`
                          : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* 2. Listing pricing */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Listing-Level Dynamic Pricing
            </h2>
            {listingTop.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No listing rows yet.</p>
            ) : (
              <ul className="mt-4 space-y-2.5 text-xs">
                {listingTop.map((l) => {
                  const t = recTone(l.recommendation);
                  return (
                    <li
                      key={l.listingId}
                      className={`rounded-xl border p-2.5 ${t.card}`}
                    >
                      <p className="font-mono text-slate-800 dark:text-slate-200">{shortId(l.listingId)}</p>
                      <p className="text-slate-600 dark:text-slate-400">{l.city}</p>
                      <p className="mt-0.5 tabular-nums text-slate-600 dark:text-slate-300">
                        Conv. {(l.conversionRate * 100).toFixed(2)}% · RPV {l.revenuePerView.toFixed(2)}
                      </p>
                      <p className={`mt-0.5 font-medium capitalize ${t.label}`}>
                        {recLabel(l.recommendation)} · {l.suggestedAdjustmentPercent > 0 ? "+" : ""}
                        {l.suggestedAdjustmentPercent}%
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* 3. AI insights */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              AI Market Insights
            </h2>
            {insights.length === 0 && actions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No generated insights for this window.</p>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {insights.length > 0 ? (
                  <ul className="list-inside list-disc space-y-1">
                    {insights.map((s, i) => (
                      <li key={`i-${i}`}>{s}</li>
                    ))}
                  </ul>
                ) : null}
                {actions.length > 0 ? (
                  <ul className="list-inside list-decimal space-y-1 text-slate-600 dark:text-slate-400">
                    {actions.map((a, i) => (
                      <li key={`a-${i}`}>{a}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </section>

          {/* 4. Revenue */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Revenue Intelligence
            </h2>
            <dl className="mt-4 space-y-2 text-sm text-slate-800 dark:text-slate-200">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Total (shadow)</dt>
                <dd className="font-semibold tabular-nums">${revenue.totalRevenue.toFixed(0)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Avg / listing</dt>
                <dd className="tabular-nums">${revenue.avgRevenuePerListing.toFixed(0)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Top city</dt>
                <dd className="text-right font-medium">
                  {revenue.topCityByRevenue ?? "—"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
              From <code className="font-mono">marketplace_revenue_entries</code> (shadow ledger, not payment SoT).
            </p>
          </section>
        </div>
      ) : null}

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">User Acquisition</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          First-touch channels from signups (normalized: tiktok, meta, google, referral, direct, organic). Read-only; no
          spend controls here.
        </p>
        {!acquisition || acquisition.totalUsers === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">No signups in scope yet, or data unavailable for this run.</p>
        ) : (
          <div className="mt-4 space-y-3 text-sm text-slate-800 dark:text-slate-200">
            <p>
              <span className="font-medium text-slate-900 dark:text-white">Top channel:</span>{" "}
              <span className="capitalize">{acquisition.topChannel ?? "—"}</span>{" "}
              <span className="text-slate-500">
                (
                {acquisition.channels[0] != null
                  ? `${acquisition.channels[0].users} users, ${acquisition.channels[0].percentage.toFixed(1)}% share`
                  : "—"}
                )
              </span>
            </p>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              {acquisition.channels.map((c) => (
                <li key={c.source} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium capitalize text-slate-800 dark:text-slate-200">{c.source}</span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-500">
                    {c.percentage.toFixed(1)}% of signups
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {brainEnabled ? (
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Marketplace Brain</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            The system coordinates pricing, growth, trust, and conversion signals into one decision layer. Shown: top
            three recommended actions (read-only; no auto-execution here).
          </p>
          {brainTopActions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">No actions for the current data window, or add marketplace activity to see signals.</p>
          ) : (
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-slate-800 dark:text-slate-200">
              {brainTopActions.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <span className="font-medium">{a.title}</span>
                  <span className="ml-2 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 dark:border-zinc-700 dark:text-slate-400">
                    {a.priority} · {a.area}
                  </span>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">{a.description}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}

      {brainEnabled ? (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Autonomous Growth Brain
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Connects referrals, early users, campaigns, ads, and conversion signals into one growth decision layer. Top
            three actions (read-only).
          </p>
          {growthBrainTopActions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
              No growth actions for this window — add referral or funnel data to populate.
            </p>
          ) : (
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-slate-800 dark:text-slate-200">
              {growthBrainTopActions.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <span className="font-medium">{a.title}</span>
                  <span className="ml-2 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 dark:border-zinc-700 dark:text-slate-400">
                    {a.priority} · {a.area}
                  </span>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">{a.description}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}

      {enabled && (cityTop.length > 0 || listingTop.length > 0) ? (
        <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
          Recommendations are read-only. No live price changes.
        </p>
      ) : null}
    </main>
  );
}
