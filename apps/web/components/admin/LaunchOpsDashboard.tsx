import Link from "next/link";
import type { LaunchFunnelMetrics } from "@/modules/launch/launch-metrics.service";
import type { LaunchStrategyPlan } from "@/modules/launch/launch-strategy.service";

type Props = {
  plan: LaunchStrategyPlan;
  metrics: LaunchFunnelMetrics;
};

export function LaunchOpsDashboard({ plan, metrics }: Props) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Launch ops &amp; acquisition</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {plan.version} — first {plan.targetUserCount} users, budget {cad(plan.budgetMinCents)}–{cad(plan.budgetMaxCents)}{" "}
          (strategy) · funnel from <code className="text-zinc-400">user_events</code> (last {metrics.periodDays}d).
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Checklist &amp; inventory:{" "}
          <Link href="/admin/soft-launch" className="text-emerald-400/90 hover:underline">
            Soft launch &amp; growth →
          </Link>
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users acquired" value={metrics.usersAcquired.toLocaleString()} />
        <Stat
          label="Conversion (landing → complete)"
          value={pct(metrics.conversionRates.overallFunnel)}
        />
        <Stat label="Revenue (period)" value={cad(metrics.revenueCents)} />
        <Stat label="Revenue / user" value={metrics.revenuePerUserCents != null ? cad(metrics.revenuePerUserCents) : "—"} />
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
        <h2 className="text-lg font-semibold text-white">Funnel counts</h2>
        <ul className="mt-3 grid gap-2 font-mono text-xs text-zinc-400 sm:grid-cols-2">
          <li>ad_click: {metrics.counts.ad_click}</li>
          <li>landing_view: {metrics.counts.landing_view}</li>
          <li>listing_view: {metrics.counts.listing_view}</li>
          <li>booking_start: {metrics.counts.booking_start}</li>
          <li>checkout: {metrics.counts.checkout}</li>
          <li>booking_completed: {metrics.counts.booking_completed}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
        <h2 className="text-lg font-semibold text-white">Channel plan (strategy)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-500">
              <tr>
                <th className="px-3 py-2">Channel</th>
                <th className="px-3 py-2">Budget</th>
                <th className="px-3 py-2">Est. users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {plan.channels.map((c) => {
                const eu = plan.expectedUsers.find((e) => e.channelId === c.id);
                return (
                  <tr key={c.id}>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{cad(c.budgetCents)}</td>
                    <td className="px-3 py-2">{eu?.users ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
        <h2 className="text-lg font-semibold text-white">Timeline (4 weeks)</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          {plan.timeline.map((t) => (
            <li key={t.week}>
              <span className="text-emerald-400/90">W{t.week}</span> — {t.focus}
              <ul className="ml-4 mt-1 list-disc text-xs text-zinc-500">
                {t.milestones.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function cad(cents: number) {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function pct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{props.label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{props.value}</p>
    </div>
  );
}
