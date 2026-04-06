import {
  computeFunnelRates,
  getManagerGrowthDimensionSplit,
  getManagerGrowthEventCounts,
} from "@/lib/growth/funnels";
import { computeLaunchReadinessScore } from "@/lib/growth/launch-score";
import { buildManagerGrowthRecommendations, computeAiAdoptionRate } from "@/lib/growth/recommendations";

function WindowTable(props: {
  title: string;
  counts: Record<string, number>;
  rates: ReturnType<typeof computeFunnelRates>;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold text-white">{props.title}</h3>
      <ul className="mt-3 space-y-1 text-xs text-slate-400">
        {Object.entries(props.counts)
          .filter(([, v]) => v > 0)
          .slice(0, 14)
          .map(([k, v]) => (
            <li key={k} className="flex justify-between gap-4">
              <span className="font-mono text-slate-500">{k}</span>
              <span className="text-slate-200">{v}</span>
            </li>
          ))}
      </ul>
      <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
        <p>listing → contact: {props.rates.listingViewToContactPct?.toFixed(2) ?? "—"}%</p>
        <p>listing → booking req: {props.rates.listingViewToBookingRequestPct?.toFixed(2) ?? "—"}%</p>
        <p>booking flow → confirmed: {props.rates.bookingRequestToConfirmedPct?.toFixed(2) ?? "—"}%</p>
        <p>manual ÷ (online+manual) completes: {props.rates.syriaManualVsOnlineBookingCompleteRatio?.toFixed(2) ?? "—"}</p>
      </div>
    </div>
  );
}

export async function GrowthFunnelDashboard() {
  const [c7, c30, call, localeSplit, marketSplit, readiness] = await Promise.all([
    getManagerGrowthEventCounts("7d"),
    getManagerGrowthEventCounts("30d"),
    getManagerGrowthEventCounts("all"),
    getManagerGrowthDimensionSplit({ window: "30d", dimension: "locale" }),
    getManagerGrowthDimensionSplit({ window: "30d", dimension: "marketCode" }),
    computeLaunchReadinessScore(),
  ]);

  const r7 = computeFunnelRates(c7, "7d");
  const r30 = computeFunnelRates(c30, "30d");
  const totalLocale = localeSplit.reduce((a, b) => a + b.count, 0) || 1;
  const arShare =
    (localeSplit.find((x) => x.key === "ar")?.count ?? 0) / totalLocale * 100;
  const syShare =
    (marketSplit.find((x) => x.key === "syria")?.count ?? 0) /
    (marketSplit.reduce((a, b) => a + b.count, 0) || 1) *
    100;

  const recs = buildManagerGrowthRecommendations(
    "en",
    c30,
    r30,
    { arabicSharePct: arShare, syriaMarketSharePct: syShare },
  );
  void computeAiAdoptionRate(c30);

  return (
    <section className="mt-12 space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Funnel dashboard (manager events)</h2>
        <p className="mt-1 text-sm text-slate-400">
          Source: <code className="text-slate-500">growth_funnel_events</code> + mirror{" "}
          <code className="text-slate-500">launch_events</code> (<code className="text-slate-500">mgr:*</code>).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <WindowTable title="Last 7 days" counts={c7 as unknown as Record<string, number>} rates={r7} />
        <WindowTable title="Last 30 days" counts={c30 as unknown as Record<string, number>} rates={r30} />
        <WindowTable title="Launch-to-date" counts={call as unknown as Record<string, number>} rates={computeFunnelRates(call, "all")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Traffic by locale (30d sample)</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            {localeSplit.slice(0, 12).map((row) => (
              <li key={row.key} className="flex justify-between">
                <span>{row.key}</span>
                <span className="text-slate-200">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Traffic by market (30d sample)</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            {marketSplit.slice(0, 12).map((row) => (
              <li key={row.key} className="flex justify-between">
                <span>{row.key}</span>
                <span className="text-slate-200">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <h3 className="text-sm font-semibold text-amber-200">Launch readiness (heuristic)</h3>
        <p className="mt-2 text-2xl font-bold text-white">
          {readiness.score}/100 · <span className="uppercase">{readiness.level}</span>
        </p>
        {readiness.blockers.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm text-red-300">
            {readiness.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        {readiness.warnings.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-200/90">
            {readiness.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
        {readiness.nextActions.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-300">
            {readiness.nextActions.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="text-sm font-semibold text-white">AI-assisted recommendations (ops-safe)</h3>
        <ul className="mt-3 space-y-3 text-sm text-slate-300">
          {recs.map((r) => (
            <li key={r.id}>
              <span
                className={
                  r.severity === "critical"
                    ? "text-red-300"
                    : r.severity === "warning"
                      ? "text-amber-200"
                      : "text-slate-400"
                }
              >
                [{r.severity}]
              </span>{" "}
              {r.detail}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
