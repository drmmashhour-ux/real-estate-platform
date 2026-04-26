import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { allocateLaunchBudget, simulateFromAllocatedBudget } from "@/modules/growth-strategy";
import { buildFirst100UsersPlan, generateDailyLaunchActions } from "@/modules/launch/first-100-users.service";
import { getRetargetingSnapshot } from "@/modules/experiments/retargeting-audience.service";
import { getExperimentVariantStats } from "@/modules/experiments/experiment-stats.service";
import { LAUNCH_EXPERIMENTS } from "@/modules/experiments/experiment-registry";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";
import { GrowthLaunchBudgetClient } from "./growth-launch-client";

export const dynamic = "force-dynamic";

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

export default async function AdminGrowthLaunchPage() {
  await requireAdminControlUserId();

  const [riskAlerts, plan, retarget, daily, expStats] = await Promise.all([
    getAdminRiskAlerts(),
    Promise.resolve(buildFirst100UsersPlan("Montreal")),
    getRetargetingSnapshot(30),
    Promise.resolve(generateDailyLaunchActions(new Date(), "Montreal")),
    getExperimentVariantStats("lp_hero_v1", 14).catch(() => null),
  ]);

  const end = addDays(startOfUtcDay(new Date()), 1);
  const start30 = addDays(end, -30);
  const [users30d, signupsTraffic] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: start30, lt: end } } }),
    prisma.trafficEvent.count({
      where: { eventType: "signup_completed", createdAt: { gte: start30, lt: end } },
    }),
  ]);

  const defaultBudget = 750;
  const allocation = allocateLaunchBudget({ totalBudget: defaultBudget, city: "Montreal" });
  const simulation = simulateFromAllocatedBudget(allocation, {
    avgBookingValueCad: 185,
    bnhubTakeRate: 0.12,
  });

  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Launch growth</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Budget engine, simulations, first-100 plan, retargeting segments — tied to tracking + ROI dashboard.
            </p>
          </div>
          <Link
            href="/admin/analytics"
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Analytics →
          </Link>
        </div>

        <GrowthLaunchBudgetClient
          initialBudget={defaultBudget}
          initialAllocation={allocation}
          initialSimulation={simulation}
        />

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">Actuals (30d)</h2>
          <ul className="mt-3 space-y-1 text-sm text-zinc-400">
            <li>New users (DB): {users30d}</li>
            <li>signup_completed (traffic_events): {signupsTraffic}</li>
            <li>
              CPA: use Admin Analytics cost/lead once Google Ads spend is imported — do not treat all users as paid.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">First 100 users — channels</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Expected range {plan.expectedUsersTotal.low}–{plan.expectedUsersTotal.high} users (conservative).
          </p>
          <ul className="mt-4 space-y-3 text-sm text-zinc-400">
            {plan.channels.map((c) => (
              <li key={c.id} className="rounded-lg border border-zinc-800/80 bg-black/30 p-3">
                <span className="font-medium text-zinc-200">{c.name}</span> — {c.expectedUsersLow}–{c.expectedUsersHigh}{" "}
                users · <span className="text-zinc-500">{c.trackingHint}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-medium text-zinc-300">Timeline</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500">
            {plan.timeline.map((t) => (
              <li key={t.week}>
                W{t.week}: {t.focus}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">Today&apos;s actions</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-400">
            {daily.actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">Retargeting segments</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {retarget.segments.map((s) => (
              <li key={s.id} className="border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-200">{s.label}</span>: {s.count}{" "}
                <span className="text-zinc-600">— {s.trackingNote}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">Experiments (A/B)</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Use <code className="text-zinc-400">?exp=lp_hero_v1&amp;var=b</code> on LPs — variants attach to growth_events.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {LAUNCH_EXPERIMENTS.map((e) => (
              <li key={e.id}>
                <span className="font-mono text-premium-gold/90">{e.id}</span> — {e.description} (
                {e.variants.join(", ")})
              </li>
            ))}
          </ul>
          {expStats?.rows?.length ? (
            <div className="mt-4">
              <p className="text-xs text-zinc-500">lp_hero_v1 (14d) variant exposure</p>
              <ul className="mt-2 text-sm text-zinc-500">
                {expStats.rows.map((r) => (
                  <li key={r.variant}>
                    {r.variant}: {r.pageViews} views, {r.conversions} signups (same experiment metadata)
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-600">No experiment traffic yet — drive tagged LP URLs from Ads.</p>
          )}
        </section>
      </div>
    </LecipmControlShell>
  );
}
