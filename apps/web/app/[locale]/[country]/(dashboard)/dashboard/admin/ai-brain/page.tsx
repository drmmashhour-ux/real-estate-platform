import { redirect } from "next/navigation";

import { getMarketplaceBrainActions, getMarketplaceBrainSummary } from "@/lib/ai/marketplaceBrain";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { flags } from "@/lib/flags";

export const dynamic = "force-dynamic";

function priorityPill(p: "low" | "medium" | "high") {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (p === "high") return `${base} bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40`;
  if (p === "medium") return `${base} bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35`;
  return `${base} bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-600/50`;
}

function areaLabel(a: string) {
  return a;
}

export default async function AutonomousMarketplaceBrainPage({
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

  const enabled = flags.AUTONOMOUS_AGENT;
  const [summary, actions] = enabled
    ? await Promise.all([getMarketplaceBrainSummary(), getMarketplaceBrainActions()])
    : [null, [] as Awaited<ReturnType<typeof getMarketplaceBrainActions>>];

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">BNHub · LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Autonomous Marketplace Brain</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Central decision layer: demand, pricing, reputation, conversion, and campaigns. Recommendations and signals
          only — no automatic price, campaign, or database changes from this view.
        </p>
        <a href={base} className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </a>
      </div>

      {!enabled ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">
          <p className="font-medium">Autonomous marketplace brain is disabled</p>
          <p className="mt-1 text-amber-200/80">
            Set <code className="font-mono text-amber-50/90">FEATURE_AI_AGENT=1</code> to load live signals. This page
            still renders for navigation and copy review.
          </p>
        </div>
      ) : null}

      {enabled && summary != null ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Demand</h2>
            <p className="mt-2 text-sm text-zinc-300">Hot cities</p>
            <p className="text-lg font-medium text-white">{summary.demand.hotCities.length > 0 ? summary.demand.hotCities.join(", ") : "—"}</p>
            <p className="mt-3 text-sm text-zinc-300">Weak cities</p>
            <p className="text-lg font-medium text-white">{summary.demand.weakCities.length > 0 ? summary.demand.weakCities.join(", ") : "—"}</p>
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pricing (signals)</h2>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Increase recommendations</dt>
                <dd className="font-semibold tabular-nums text-emerald-200">{summary.pricing.increaseCount}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Decrease recommendations</dt>
                <dd className="font-semibold tabular-nums text-rose-200">{summary.pricing.decreaseCount}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Reputation (sample)</h2>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Trusted (high) listings</dt>
                <dd className="font-semibold tabular-nums">{summary.reputation.trustedListingCount}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Low trust (in sample)</dt>
                <dd className="font-semibold tabular-nums">{summary.reputation.lowTrustListingCount}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-zinc-600">From recent published listings; internal scoring, not a public label.</p>
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Growth</h2>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Early users</dt>
                <dd className="font-semibold tabular-nums">{summary.growth.earlyUserCount}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Remaining early spots (cap)</dt>
                <dd className="font-semibold tabular-nums">{summary.growth.remainingEarlySpots}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4 md:col-span-2 lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Campaigns (simulation)</h2>
            <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-zinc-500 sm:mb-1">To scale</dt>
                <dd className="font-semibold tabular-nums sm:text-lg">{summary.campaigns.campaignsToScale}</dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-zinc-500 sm:mb-1">To improve copy</dt>
                <dd className="font-semibold tabular-nums sm:text-lg">{summary.campaigns.campaignsToImprove}</dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-zinc-500 sm:mb-1">To pause</dt>
                <dd className="font-semibold tabular-nums sm:text-lg">{summary.campaigns.campaignsToPause}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : enabled ? (
        <p className="text-sm text-zinc-500">No summary data yet.</p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a]">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Recommended actions</h2>
          <p className="mt-1 text-xs text-zinc-500">Prioritized suggestions. Review before any execution.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Title</th>
                <th className="min-w-[200px] px-4 py-3">Description</th>
                <th className="min-w-[200px] px-4 py-3">Recommended action</th>
                <th className="px-4 py-3">safeToAutomate</th>
              </tr>
            </thead>
            <tbody>
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    {enabled ? "No actions for current signals — check back as data accrues." : "Enable FEATURE_AI_AGENT to surface actions."}
                  </td>
                </tr>
              ) : (
                actions.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-800/80 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <span className={priorityPill(a.priority)}>{a.priority}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-zinc-300">{a.area}</td>
                    <td className="px-4 py-3 align-top font-medium text-zinc-100">{a.title}</td>
                    <td className="px-4 py-3 align-top text-zinc-400">{a.description}</td>
                    <td className="px-4 py-3 align-top text-zinc-300">{a.recommendedAction}</td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={
                          a.safeToAutomate
                            ? "text-emerald-300"
                            : "text-zinc-500"
                        }
                      >
                        {a.safeToAutomate ? "true" : "false"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
