import Link from "next/link";
import { computeExperimentResults } from "@/modules/experiments/ab-results.service";
import { getLatestExperimentOutcomeDecision } from "@/modules/experiments/ab-decision.service";
import type { AbExperimentView, ExperimentOutcomeDecisionView } from "@/modules/experiments/ab-testing.types";
import { AbDecisionPanel } from "@/components/growth/AbDecisionPanel";
import { VariantComparisonTable } from "@/components/growth/VariantComparisonTable";

export async function ExperimentCard({
  experiment,
  locale,
  country,
}: {
  experiment: AbExperimentView;
  locale: string;
  country: string;
}) {
  const results = await computeExperimentResults(experiment.id);
  const decision: ExperimentOutcomeDecisionView =
    (await getLatestExperimentOutcomeDecision(experiment.id)) ?? {
      status: "insufficient_data",
      confidence: 0,
      rationale: ["No saved decision yet — run `decideExperimentOutcome` from tooling when sample is ready."],
      recommendation: "Avoid promoting variants until a decision row exists.",
    };
  const adminBase = `/${locale}/${country}/admin/experiments/${experiment.id}`;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-black/20 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">{experiment.domain}</p>
          <h3 className="text-sm font-semibold text-zinc-100">{experiment.name}</h3>
        </div>
        <span className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">{experiment.status}</span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">Primary metric: {experiment.metricPrimary}</p>
      <VariantComparisonTable rows={results.perVariant} />
      <div className="mt-3">
        <AbDecisionPanel decision={decision} />
      </div>
      <Link href={adminBase} className="mt-3 inline-block text-xs text-emerald-400 hover:underline">
        Open in admin →
      </Link>
    </div>
  );
}
