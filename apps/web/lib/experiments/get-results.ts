import "server-only";

import type { PrismaClient } from "@prisma/client";

export type ExperimentSignalLabel = "early_signal" | "needs_more_data" | "likely_winner";

export type VariantResultRow = {
  variantKey: string;
  name: string;
  assignments: number;
  primaryMetricCount: number;
  primaryRate: number;
  liftVsControlPercent: number | null;
  signalLabel: ExperimentSignalLabel;
};

export type ExperimentResultsSummary = {
  experimentId: string;
  primaryMetric: string;
  controlVariantKey: string;
  variants: VariantResultRow[];
  overallLabel: ExperimentSignalLabel;
  winnerSuggestion: { variantKey: string; reason: string } | null;
};

const MIN_ASSIGNMENTS_PER_ARM = 30;
const MIN_TOTAL_ASSIGNMENTS = 80;

function labelForVariant(
  lift: number | null,
  assignments: number,
  totalAssignments: number,
  isLeader: boolean,
): ExperimentSignalLabel {
  if (totalAssignments < MIN_TOTAL_ASSIGNMENTS || assignments < MIN_ASSIGNMENTS_PER_ARM) {
    return "needs_more_data";
  }
  if (lift != null && lift > 5 && isLeader) return "likely_winner";
  if (lift != null && Math.abs(lift) > 3) return "early_signal";
  return "needs_more_data";
}

/**
 * MVP funnel math: assignment counts as exposure; primary metric rate = metric events / assignments.
 * Lift vs first variant sorted by `variantKey` (control convention: `control` if present, else lexical first).
 */
export async function getExperimentResults(prisma: PrismaClient, experimentId: string): Promise<ExperimentResultsSummary> {
  const experiment = await prisma.experiment.findUnique({
    where: { id: experimentId },
    include: { variants: { orderBy: { variantKey: "asc" } } },
  });
  if (!experiment) {
    throw new Error("experiment_not_found");
  }

  const primaryMetric = experiment.primaryMetric;
  const variants = experiment.variants;
  const controlKey =
    variants.some((v) => v.variantKey === "control")
      ? "control"
      : (variants[0]?.variantKey ?? "control");

  const assignmentGroups = await prisma.experimentAssignment.groupBy({
    by: ["variantId"],
    where: { experimentId },
    _count: { _all: true },
  });
  const assignMap = new Map(assignmentGroups.map((g) => [g.variantId, g._count._all]));

  const metricGroups = await prisma.experimentEvent.groupBy({
    by: ["variantId"],
    where: { experimentId, eventName: primaryMetric },
    _count: { _all: true },
  });
  const metricMap = new Map(metricGroups.map((g) => [g.variantId, g._count._all]));

  const controlVariant = variants.find((v) => v.variantKey === controlKey) ?? variants[0];
  const controlAssignments = controlVariant ? (assignMap.get(controlVariant.id) ?? 0) : 0;
  const controlMetric = controlVariant ? (metricMap.get(controlVariant.id) ?? 0) : 0;
  const controlRate = controlAssignments > 0 ? controlMetric / controlAssignments : 0;

  let totalAssignments = 0;
  const rows: VariantResultRow[] = [];

  for (const v of variants) {
    const assignments = assignMap.get(v.id) ?? 0;
    totalAssignments += assignments;
    const primaryMetricCount = metricMap.get(v.id) ?? 0;
    const primaryRate = assignments > 0 ? primaryMetricCount / assignments : 0;
    const liftVsControlPercent =
      v.variantKey === controlKey || controlRate <= 0 ? null : ((primaryRate - controlRate) / controlRate) * 100;

    rows.push({
      variantKey: v.variantKey,
      name: v.name,
      assignments,
      primaryMetricCount,
      primaryRate,
      liftVsControlPercent,
      signalLabel: "needs_more_data",
    });
  }

  let bestKey: string | null = null;
  let bestRate = -1;
  for (const r of rows) {
    if (r.assignments >= MIN_ASSIGNMENTS_PER_ARM && r.primaryRate > bestRate) {
      bestRate = r.primaryRate;
      bestKey = r.variantKey;
    }
  }

  for (const r of rows) {
    const isLeader = bestKey != null && r.variantKey === bestKey;
    r.signalLabel = labelForVariant(r.liftVsControlPercent, r.assignments, totalAssignments, isLeader);
  }

  const overallLabel: ExperimentSignalLabel =
    totalAssignments < MIN_TOTAL_ASSIGNMENTS
      ? "needs_more_data"
      : rows.some((r) => r.signalLabel === "likely_winner")
        ? "likely_winner"
        : rows.some((r) => r.signalLabel === "early_signal")
          ? "early_signal"
          : "needs_more_data";

  const winnerSuggestion =
    overallLabel === "likely_winner" && bestKey
      ? {
          variantKey: bestKey,
          reason:
            "Highest observed primary-metric rate among arms with enough assignments. Not a formal significance test; confirm before shipping.",
        }
      : null;

  return {
    experimentId,
    primaryMetric,
    controlVariantKey: controlKey,
    variants: rows,
    overallLabel,
    winnerSuggestion,
  };
}
