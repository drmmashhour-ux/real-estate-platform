import { getGrowthScaleDashboardSnapshot } from "@/modules/growth/growth-scale-dashboard.service";

/** Admin / flag-gated snapshot: traffic → leads → activation proxy → viral approximation. */
export async function GrowthScaleMetricsSection() {
  const d = await getGrowthScaleDashboardSnapshot();

  return (
    <section className="rounded-xl border border-emerald-500/20 bg-zinc-950/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-emerald-100">Scale engine metrics</h2>
          <p className="mt-1 max-w-xl text-xs text-zinc-500">
            Last {d.window}: funnel events + captured leads + referral graph. Goal path: reach 1,000 users → scale toward
            10,000 with repeatable acquisition loops.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Traffic (VISIT)" value={d.traffic.visits} hint="Growth SEO + marketing surfaces" />
        <Metric label="Captured leads" value={d.funnel.captureLeads} hint="Forms + landing capture API" />
        <Metric label="Signups (funnel)" value={d.funnel.signups} hint="Recorded SIGNUP events" />
        <Metric label="Activations" value={d.funnel.activations} hint="ACTIVATION funnel events" />
      </dl>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Conversions" value={d.funnel.conversions} hint="Includes capture CONVERSION" />
        <Metric label="New users (platform)" value={d.funnel.newPlatformUsers} hint="User.createdAt window" />
        <Metric label="Visit → lead ratio" value={d.conversionRates.visitToLeadRatio} hint="Approximate" />
        <Metric label="Viral coeff. (approx)" value={d.referrals.viralCoefficientApprox} hint="Referrals / referrer" />
      </dl>

      <p className="mt-4 text-[11px] text-zinc-600">{d.narrative}</p>
    </section>
  );
}

function Metric(props: { label: string; value: number | string; hint: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{props.label}</dt>
      <dd className="mt-1 font-mono text-xl text-emerald-300">{props.value}</dd>
      <p className="mt-1 text-[10px] text-zinc-600">{props.hint}</p>
    </div>
  );
}
