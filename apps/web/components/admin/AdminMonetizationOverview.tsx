import Link from "next/link";

import type { LecipmMonetizationSummary } from "@/modules/revenue/lecipm-monetization-summary.service";

function fmtCad(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Hub revenue strip — data from paid `platform_payments`, broker payments, active subscription mirrors. */
export function AdminMonetizationOverview({
  summary,
}: {
  summary: LecipmMonetizationSummary | null;
}) {
  if (!summary) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
        <p className="text-sm text-slate-400">Monetization rollup unavailable (database).</p>
      </section>
    );
  }

  const topHubs = summary.byHub.slice(0, 6);

  return (
    <section className="rounded-2xl border border-premium-gold/25 bg-black/35 p-5 shadow-[inset_0_1px_0_rgba(212,175,55,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">LECIPM monetization</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Cross-hub revenue · last 30 days</h2>
          <p className="mt-1 text-xs text-slate-500">
            Paid platform flows + broker lead settlements · subscriptions are active-seat counts with MRR estimate from
            workspace mirrors.
          </p>
        </div>
        <Link
          href="/admin/revenue-overview"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-premium-gold/40 hover:text-white"
        >
          Revenue detail
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Platform share (30d)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{fmtCad(summary.totalPlatformCents)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Daily avg</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-200/90">
            {fmtCad(summary.dailyAverageCents)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Workspace MRR (approx)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-100/90">
            {fmtCad(summary.subscriptionMrrCentsApprox)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{summary.activeWorkspaceSubscriptions} active seats</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Broker SaaS · lead pay</p>
          <p className="mt-1 text-sm text-slate-300">
            <span className="tabular-nums text-white">{summary.activeBrokerSaaS}</span> broker subs ·{" "}
            <span className="tabular-nums text-premium-gold">{fmtCad(summary.brokerLeadRevenueCents)}</span> leads (
            {summary.brokerLeadPaymentsCount} payments)
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[520px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4 font-medium">Hub</th>
              <th className="pb-2 pr-4 font-medium">Platform share</th>
              <th className="pb-2 font-medium">Transactions</th>
            </tr>
          </thead>
          <tbody>
            {topHubs.map((row) => (
              <tr key={row.hubKey} className="border-b border-white/5 text-slate-200">
                <td className="py-2 pr-4">{row.hubLabel}</td>
                <td className="py-2 pr-4 tabular-nums">{fmtCad(row.platformCents)}</td>
                <td className="py-2 tabular-nums text-slate-400">{row.transactionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
