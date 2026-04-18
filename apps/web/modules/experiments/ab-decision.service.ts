import { prisma } from "@/lib/db";
import { AB_INCONCLUSIVE_BAND, AB_MIN_IMPRESSIONS_PER_VARIANT, AB_WINNER_RELATIVE_GAP } from "./ab-testing.constants";
import { computeExperimentResults, type VariantResultRow } from "./ab-results.service";
import { recordOutcomeHintsToLearning } from "./ab-learning-bridge.service";
import type { ExperimentOutcomeDecisionView } from "./ab-testing.types";

export async function getLatestExperimentOutcomeDecision(
  experimentId: string,
): Promise<ExperimentOutcomeDecisionView | null> {
  const row = await prisma.experimentOutcomeDecision.findFirst({
    where: { experimentId },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  const rat = row.rationale;
  const rationale = Array.isArray(rat) ? rat.map(String) : typeof rat === "string" ? [rat] : [];
  return {
    status: row.decisionType as ExperimentOutcomeDecisionView["status"],
    winningVariantId: row.winningVariantId ?? undefined,
    losingVariantIds: Array.isArray(row.losingVariantIds)
      ? (row.losingVariantIds as string[])
      : [],
    confidence: row.confidence,
    rationale,
    recommendation: row.recommendation ?? "",
  };
}

function primaryRate(row: VariantResultRow, metric: string): number | null {
  const m = metric.toLowerCase();
  if (m.includes("ctr") || m === "ctr") return row.ctr;
  if (m.includes("lead")) return row.leadRate;
  if (m.includes("book")) return row.bookingRate;
  if (m.includes("cvr") || m === "cvr") return row.cvr;
  return row.ctr ?? row.leadRate;
}

/**
 * Practical thresholds only — no frequentist p-values.
 */
export async function decideExperimentOutcome(experimentId: string): Promise<ExperimentOutcomeDecisionView> {
  const exp = await prisma.experiment.findUnique({ where: { id: experimentId } });
  if (!exp) {
    return {
      status: "insufficient_data",
      confidence: 0,
      rationale: ["Experiment not found"],
      recommendation: "Fix experiment id.",
    };
  }

  const { perVariant } = await computeExperimentResults(experimentId);
  const rationale: string[] = [];
  const metric = exp.primaryMetric || "ctr";

  const undersampled = perVariant.filter((r) => r.impressions < AB_MIN_IMPRESSIONS_PER_VARIANT);
  if (perVariant.length < 2 || undersampled.length === perVariant.length) {
    const out: ExperimentOutcomeDecisionView = {
      status: "insufficient_data",
      confidence: 0.35,
      rationale: [
        `Need ≥ ${AB_MIN_IMPRESSIONS_PER_VARIANT} impressions per variant on primary surface events.`,
        ...perVariant.map((r) => `${r.variantKey}: ${r.impressions} imp`),
      ],
      recommendation: "Keep traffic running; avoid calling a winner early.",
    };
    return out;
  }

  const rates = perVariant
    .map((r) => ({ row: r, rate: primaryRate(r, metric) }))
    .filter((x) => x.rate != null) as { row: VariantResultRow; rate: number }[];

  if (rates.length < 2) {
    return {
      status: "inconclusive",
      confidence: 0.4,
      rationale: ["Primary metric rates unavailable for comparison."],
      recommendation: "Verify event instrumentation for this experiment.",
    };
  }

  const sorted = [...rates].sort((a, b) => b.rate - a.rate);
  const best = sorted[0]!;
  const second = sorted[1]!;

  rationale.push(`Primary metric: ${metric} (proxy from experiment_events).`);
  rationale.push(`Best: ${best.row.variantKey} @ ${best.rate.toFixed(4)}; runner-up: ${second.row.variantKey} @ ${second.rate.toFixed(4)}.`);

  const relGap = second.rate > 0 ? (best.rate - second.rate) / second.rate : 1;
  if (relGap < AB_INCONCLUSIVE_BAND) {
    const view: ExperimentOutcomeDecisionView = {
      status: "inconclusive",
      confidence: 0.55,
      rationale: [...rationale, `Relative gap ${(relGap * 100).toFixed(2)}% below decision band.`],
      recommendation: "Extend run or widen creative difference — metrics too close.",
    };
    await persistDecision(experimentId, view);
    return view;
  }

  if (relGap < AB_WINNER_RELATIVE_GAP && best.row.impressions < AB_MIN_IMPRESSIONS_PER_VARIANT * 1.5) {
    const view: ExperimentOutcomeDecisionView = {
      status: "inconclusive",
      confidence: 0.58,
      rationale: [...rationale, "Gap suggests direction but sample still thin."],
      recommendation: "Collect more impressions before promoting a winner.",
    };
    await persistDecision(experimentId, view);
    return view;
  }

  const losers = sorted.slice(1).map((s) => s.row.variantId);
  const view: ExperimentOutcomeDecisionView = {
    status: "winner_found",
    winningVariantId: best.row.variantId,
    losingVariantIds: losers,
    confidence: Math.min(0.92, 0.55 + Math.min(relGap, 0.25)),
    rationale: [...rationale, `Relative lift vs runner-up: ${(relGap * 100).toFixed(1)}%.`],
    recommendation: "Promote winner in CMS/Ads UI after human approval — LECIPM does not auto-switch live UX.",
  };
  await persistDecision(experimentId, view);
  await recordOutcomeHintsToLearning(experimentId, view).catch(() => {});
  return view;
}

async function persistDecision(experimentId: string, view: ExperimentOutcomeDecisionView): Promise<void> {
  await prisma.experimentOutcomeDecision.create({
    data: {
      experimentId,
      decisionType: view.status,
      winningVariantId: view.winningVariantId ?? null,
      losingVariantIds: view.losingVariantIds ?? [],
      confidence: view.confidence,
      rationale: view.rationale,
      recommendation: view.recommendation,
    },
  });
}
