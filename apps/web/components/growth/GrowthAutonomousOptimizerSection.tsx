import type { FullGrowthAnalysis } from "@/modules/ads/ads-performance.service";
import type { AutoOptimizerResult } from "@/services/growth/auto-optimizer.job";
import type { ScalingDecision } from "@/services/growth/scaling-engine.service";
import { FUNNEL_BENCHMARKS } from "@/services/growth/funnel-analysis.service";

function scalingExtra(decision: ScalingDecision): string | null {
  if (decision.action === "SCALE_UP") return `+${(decision.increase * 100).toFixed(0)}% budget (suggested)`;
  if (decision.action === "KILL" || decision.action === "HOLD") return decision.reason;
  return null;
}

function pctRatio(r: number): string {
  return `${(r * 100).toFixed(2)}%`;
}

function leakTone(sev: string): string {
  if (sev === "HIGH") return "border-red-900/45 bg-red-950/25 text-red-100";
  if (sev === "MEDIUM") return "border-amber-900/40 bg-amber-950/20 text-amber-100/95";
  return "border-zinc-700/80 bg-zinc-950/40 text-zinc-200";
}

/**
 * Autonomous funnel diagnostics + scaling suggestions (apply manually in ad platforms).
 */
export function GrowthAutonomousOptimizerSection({
  analysis,
  optimizer,
}: {
  analysis: FullGrowthAnalysis;
  optimizer: AutoOptimizerResult;
}) {
  const { metrics, leaks, fixes, healthScore } = analysis;
  const healthTone =
    healthScore >= 80 ? "text-emerald-300" : healthScore >= 60 ? "text-amber-200" : "text-rose-300";

  return (
    <div
      className="mt-6 rounded-xl border border-indigo-900/40 bg-indigo-950/15 p-4"
      data-growth-autonomous-optimizer
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-indigo-200">Autonomous optimization (diagnostic)</h3>
        <p className={`text-2xl font-bold tabular-nums ${healthTone}`} title="Composite health from funnel ratios">
          {healthScore}
          <span className="ml-1 text-xs font-normal text-zinc-500">/ 100 health</span>
        </p>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">
        Benchmarks (ratio): CTR ≥ {FUNNEL_BENCHMARKS.CTR}, click→lead ≥ {FUNNEL_BENCHMARKS.CLICK_TO_LEAD}, lead→booking
        ≥ {FUNNEL_BENCHMARKS.LEAD_TO_BOOKING}, completion ≥ {FUNNEL_BENCHMARKS.COMPLETION}. Scale-up blocked if health
        &lt; 70; kill blocked if clicks &lt; 100.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-xs">
          <p className="text-zinc-500">CTR</p>
          <p className="font-semibold text-zinc-100">{pctRatio(metrics.ctr)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-xs">
          <p className="text-zinc-500">Click → lead</p>
          <p className="font-semibold text-zinc-100">{pctRatio(metrics.clickToLead)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-xs">
          <p className="text-zinc-500">Lead → booking started</p>
          <p className="font-semibold text-zinc-100">{pctRatio(metrics.leadToBooking)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-xs">
          <p className="text-zinc-500">Booking completion</p>
          <p className="font-semibold text-zinc-100">{pctRatio(metrics.completionRate)}</p>
        </div>
      </div>

      {leaks.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">Funnel leaks</p>
          <ul className="mt-2 space-y-1.5">
            {leaks.map((L) => (
              <li
                key={L.stage}
                className={`rounded-lg border px-3 py-2 text-xs ${leakTone(L.severity)}`}
              >
                <span className="font-semibold">{L.stage}</span> · observed {pctRatio(L.value)} vs min{" "}
                {pctRatio(L.benchmarkMin)} · <span className="uppercase">{L.severity}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-xs text-emerald-400/90">No benchmark leaks detected in this window.</p>
      )}

      {fixes.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-400/90">Recommended fixes</p>
          <ul className="mt-2 space-y-2">
            {fixes.map((f) => (
              <li key={f.stage} className="rounded-lg border border-zinc-800/70 bg-black/20 px-3 py-2 text-xs text-zinc-300">
                <span className="font-medium text-zinc-100">{f.stage}</span>{" "}
                <span className="text-zinc-500">({f.severity})</span>
                <ul className="mt-1 list-disc pl-4 text-zinc-400">
                  {f.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 border-t border-zinc-800/70 pt-4">
        <p className="text-xs font-semibold text-zinc-300">Campaign scaling suggestions (UTM)</p>
        <p className="mt-1 text-[11px] text-zinc-500">
          {optimizer.timestamp} · reversible — adjust budgets only in your ad manager.
        </p>
        <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-xs">
          {optimizer.campaignDecisions.map((d) => {
            const extra = scalingExtra(d.decision);
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded border border-zinc-800/60 bg-zinc-950/40 px-2 py-1.5"
              >
                <code className="text-indigo-200/90">{d.id}</code>
                <span className="font-semibold text-zinc-200">{d.decision.action}</span>
                {extra ? (
                  <span
                    className={
                      d.decision.action === "SCALE_UP" ? "text-emerald-400/85" : "text-zinc-400"
                    }
                  >
                    {extra}
                  </span>
                ) : null}
                <span className="w-full text-[10px] text-zinc-600">{d.decision.note}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
