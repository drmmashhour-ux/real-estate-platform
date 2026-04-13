import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getPortfolioOverview } from "@/lib/portfolio-autopilot/get-portfolio-overview";
import { PortfolioAutopilotRunPanel } from "./portfolio-autopilot-client";
import { PortfolioAutopilotSettingsForm } from "./portfolio-autopilot-settings-form";

export const dynamic = "force-dynamic";

function healthLabel(score: number): string {
  if (score <= 39) return "Poor";
  if (score <= 59) return "Needs improvement";
  if (score <= 79) return "Good";
  return "Excellent";
}

export default async function PortfolioAutopilotPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) notFound();

  const base = `/${locale}/${country}`;
  const [overview, viewer] = await Promise.all([
    getPortfolioOverview(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
  ]);

  const rev = overview.health.revenue90dCents / 100;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`${base}/bnhub/host/dashboard`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Host dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Portfolio autopilot</h1>
      <p className="mt-1 text-sm text-slate-600">
        One view across all BNHub stays you own: health, winners, weak spots, and prioritized actions. Hosts and
        listing owners see their portfolio here; safe mode triggers listing optimization runs — never auto-updates live
        prices from here. CRM-focused broker accounts without owned stays may see an empty portfolio until listings are
        tied to this user.
      </p>
      {overview.health.listingCount === 0 ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          No active stays found for this account. Publish BNHub listings or switch to the host account that owns them to
          populate portfolio analytics
          {viewer?.role === "BROKER" ? " (brokers often use a dedicated host login for inventory)." : "."}
        </p>
      ) : null}
      <p className="mt-2 text-sm">
        <Link href={`${base}/dashboard/revenue-autopilot`} className="font-semibold text-emerald-800 hover:underline">
          Revenue autopilot
        </Link>{" "}
        — monetization trends, upside estimates, and revenue-focused actions.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Portfolio health</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {overview.health.portfolioHealthScore}
            <span className="ml-2 text-lg font-medium text-slate-500">/ 100</span>
          </p>
          <p className="mt-1 text-sm text-indigo-700">{healthLabel(overview.health.portfolioHealthScore)}</p>
          <p className="mt-3 text-xs text-slate-500">
            Last persisted run:{" "}
            {overview.health.lastPersistedAt
              ? new Date(overview.health.lastPersistedAt).toLocaleString()
              : "— run analysis to save"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Revenue (90d, completed)</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {rev.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-sm text-slate-600">{overview.health.listingCount} listing(s) in portfolio</p>
          <p className="mt-1 text-xs text-slate-500">Revenue total uses completed booking amounts (host currency mix may vary).</p>
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {overview.health.summary}
      </p>

      <div className="mt-8 space-y-8">
        <PortfolioAutopilotSettingsForm
          initial={{
            mode: overview.settings.mode,
            autoRunListingOptimization: overview.settings.autoRunListingOptimization,
            autoGenerateContentForTopListings: overview.settings.autoGenerateContentForTopListings,
            autoFlagWeakListings: overview.settings.autoFlagWeakListings,
            allowPriceRecommendations: overview.settings.allowPriceRecommendations,
          }}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Component scores</h2>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <li>Revenue: {overview.health.revenueHealth}</li>
            <li>Quality (avg): {overview.health.qualityHealth}</li>
            <li>Performance (avg): {overview.health.performanceHealth}</li>
            <li>Behavior (host): {overview.health.behaviorHealth}</li>
            <li>Trust (avg): {overview.health.trustHealth}</li>
          </ul>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Top performers</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {overview.top.length === 0 ? (
                <li>No listings yet.</li>
              ) : (
                overview.top.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2">
                    <Link
                      href={`${base}/dashboard/listings/${l.id}/quality`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {l.title}
                    </Link>
                    <span className="text-slate-500">{Math.round(l.rankScore)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Weak performers</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {overview.weak.length === 0 ? (
                <li>None flagged in this batch.</li>
              ) : (
                overview.weak.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2">
                    <Link
                      href={`${base}/dashboard/listings/${l.id}/quality`}
                      className="font-medium text-amber-800 hover:underline"
                    >
                      {l.title}
                    </Link>
                    <span className="text-slate-500">{l.qualityScore}/100</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        {overview.opportunities.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Opportunities</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {overview.opportunities.map((o, i) => (
                <li key={`${o.listing.id}-${i}`}>
                  <span className="font-medium text-slate-800">{o.listing.title}</span> — {o.note}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Runs & actions</h2>
          <PortfolioAutopilotRunPanel
            basePath={base}
            actions={overview.actions.map((a) => ({
              id: a.id,
              actionType: a.actionType,
              title: a.title,
              description: a.description,
              priority: a.priority,
              status: a.status,
              metadataJson: a.metadataJson,
            }))}
          />
        </section>
      </div>
    </div>
  );
}
