import { redirect } from "next/navigation";

import { getGrowthBrainActions, getGrowthBrainSummary } from "@/lib/growth/growthBrain";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { flags } from "@/lib/flags";
import { isPlatformLaunchRunning } from "@/lib/launch/controller";

export const dynamic = "force-dynamic";

function priorityPill(p: "low" | "medium" | "high") {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (p === "high") return `${base} bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40`;
  if (p === "medium") return `${base} bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35`;
  return `${base} bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-600/50`;
}

export default async function AutonomousGrowthBrainPage({
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
  const [summary, actions, launchMode] = enabled
    ? await Promise.all([
        getGrowthBrainSummary(),
        getGrowthBrainActions(admin.userId),
        isPlatformLaunchRunning().catch(() => false),
      ])
    : [null, [] as Awaited<ReturnType<typeof getGrowthBrainActions>>, false];

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      {enabled && launchMode ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm font-medium text-amber-100">
          Launch mode active — high-priority growth actions are listed first. No auto-spend; manual review for risky
          changes.
        </div>
      ) : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">BNHub · LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Autonomous Growth Brain</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Early users, referrals, campaigns, and conversion signals in one read-only view. No payouts, ad spend, or
          campaign mutations from this page.
        </p>
        <a href={base} className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </a>
      </div>

      {!enabled ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">
          <p className="font-medium">Autonomous growth brain is disabled</p>
          <p className="mt-1 text-amber-200/80">
            Set <code className="font-mono text-amber-50/90">FEATURE_AI_AGENT=1</code> to load live growth signals. This
            page still renders with empty data.
          </p>
        </div>
      ) : null}

      {enabled && summary != null ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Early users</h2>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Count</dt>
                <dd className="font-semibold tabular-nums">{summary.earlyUsers.count}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Remaining (cap)</dt>
                <dd className="font-semibold tabular-nums">{summary.earlyUsers.remaining}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Early phase</dt>
                <dd className="text-zinc-200">{summary.earlyUsers.isEarlyPhase ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4 md:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Referrals</h2>
            <p className="mt-2 text-sm text-zinc-400">Total with referee</p>
            <p className="text-2xl font-bold tabular-nums text-white">{summary.referrals.totalReferrals}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Top referrers</p>
            {summary.referrals.topReferrers.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-500">No data yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                {summary.referrals.topReferrers.map((r) => (
                  <li key={r.ownerUserId} className="flex justify-between gap-2">
                    <span className="font-mono text-xs text-zinc-400">{r.ownerUserId.slice(0, 8)}…</span>
                    <span className="tabular-nums font-medium text-white">{r.referralCount}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Campaigns (simulation)</h2>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Total</dt>
                <dd className="font-semibold tabular-nums">{summary.campaigns.totalCampaigns}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Scale</dt>
                <dd className="tabular-nums">{summary.campaigns.campaignsToScale}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Improve copy</dt>
                <dd className="tabular-nums">{summary.campaigns.campaignsToImprove}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Pause</dt>
                <dd className="tabular-nums">{summary.campaigns.campaignsToPause}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4 md:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Conversion (approx.)</h2>
            <dl className="mt-2 flex flex-wrap gap-6 text-sm">
              <div>
                <dt className="text-zinc-500">High-intent users (30d)</dt>
                <dd className="text-lg font-semibold tabular-nums text-white">{summary.conversion.highIntentUsers}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Active searchers (14d, distinct)</dt>
                <dd className="text-lg font-semibold tabular-nums text-white">{summary.conversion.activeSearches}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-zinc-600">From `user_events` when available; zeros if the log is empty.</p>
          </section>
        </div>
      ) : enabled ? (
        <p className="text-sm text-zinc-500">No summary yet.</p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a]">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Recommended actions</h2>
          <p className="mt-1 text-xs text-zinc-500">Read-only recommendations — review before any execution.</p>
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
                    {enabled
                      ? "No actions for current signals — or connect more traffic/referral data."
                      : "Enable FEATURE_AI_AGENT to surface actions."}
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
                    <td className="px-4 py-3 align-top text-zinc-500">{a.safeToAutomate ? "true" : "false"}</td>
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
