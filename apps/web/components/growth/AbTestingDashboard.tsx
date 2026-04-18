import { abTestingFlags } from "@/config/feature-flags";
import { listExperiments } from "@/modules/experiments/ab-experiment.service";
import { buildNextAbTestPlan } from "@/modules/experiments/ab-test-plan.service";
import { listAbTestingAutopilotRecommendations } from "@/modules/experiments/ab-autopilot-bridge";
import { ExperimentCard } from "@/components/growth/ExperimentCard";

export async function AbTestingDashboard({ locale, country }: { locale: string; country: string }) {
  if (!abTestingFlags.abTestingV1) {
    return null;
  }

  const running = await listExperiments({ status: ["running", "paused"] });
  const plan = await buildNextAbTestPlan();
  const autopilot = listAbTestingAutopilotRecommendations();

  return (
    <section className="rounded-2xl border border-indigo-900/40 bg-indigo-950/15 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400/90">A/B testing</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Autonomous experiments</h2>
        </div>
        <p className="max-w-lg text-xs text-zinc-500">
          Assignment + analytics only. Enable <code className="rounded bg-zinc-800 px-1">FEATURE_AB_TESTING_V1</code>.
          Client beacons must include <code className="rounded bg-zinc-800 px-1">meta.ab</code> from assignment.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Running & paused</h3>
        {running.length === 0 ? (
          <p className="text-xs text-zinc-500">No experiments — create drafts in admin or via API.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {running.map((e) => (
              <ExperimentCard key={e.id} experiment={e} locale={locale} country={country} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800/80 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">Next test suggestions</h3>
        <p className="mt-1 text-xs text-zinc-500">{plan.sources.join(" · ")}</p>
        <ul className="mt-3 space-y-2 text-xs text-zinc-400">
          {plan.proposedTests.length === 0 ? (
            <li>—</li>
          ) : (
            plan.proposedTests.map((t, i) => (
              <li key={i} className="rounded border border-zinc-800/60 p-2">
                <span className="font-medium text-indigo-200/90">{t.title}</span> — {t.objective}
                <span className="block text-zinc-600">
                  {t.control} vs {t.challenger} · {t.durationDays}d · {t.successMetric}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">Autopilot reference (recommendation-only)</h3>
        <ul className="mt-2 space-y-1 text-xs text-zinc-500">
          {autopilot.map((a) => (
            <li key={a.actionType}>
              <code className="text-indigo-300/80">{a.actionType}</code> — {a.title}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
