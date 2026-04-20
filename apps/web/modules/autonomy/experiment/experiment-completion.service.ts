import { prisma } from "@/lib/db";
import { getOrCreateRuleWeight } from "@/modules/autonomy/learning/rule-weight.service";
import { computeExperimentResults } from "./experiment-analysis.service";

const WEIGHT_DELTA = 0.1;

/**
 * Marks experiment completed, writes latest aggregate result, nudges rule weight from measured uplift (bounded).
 * Does **not** replace randomized trial inference — documented as incremental validation signal only.
 */
export async function completeExperimentAndApplyLearning(experimentId: string) {
  const exp = await prisma.autonomyExperiment.findUnique({
    where: { id: experimentId },
  });

  if (!exp) {
    throw new Error("Experiment not found");
  }

  const n = await prisma.autonomyExperimentOutcome.count({ where: { experimentId } });
  if (n < 1) {
    throw new Error("No experiment outcome rows — record snapshots before completing");
  }

  const result = await computeExperimentResults(experimentId);

  const upliftRevenue = Number(result.upliftRevenue ?? 0);
  const delta = upliftRevenue > 0 ? WEIGHT_DELTA : -WEIGHT_DELTA;

  const rule = await getOrCreateRuleWeight({
    scopeType: exp.scopeType,
    scopeId: exp.scopeId,
    domain: exp.domain,
    signalKey: exp.signalKey,
    actionType: exp.actionType,
  });

  const nextWeight = Math.max(0.5, Math.min(1.5, Number(rule.weight ?? 1) + delta));

  await prisma.autonomyRuleWeight.update({
    where: { id: rule.id },
    data: {
      weight: nextWeight,
      lastOutcomeAt: new Date(),
    },
  });

  await prisma.autonomyExperiment.update({
    where: { id: experimentId },
    data: {
      status: "completed",
      endDate: new Date(),
    },
  });

  await prisma.autonomyLearningLog.create({
    data: {
      scopeType: exp.scopeType,
      scopeId: exp.scopeId,
      eventType: "experiment_completed",
      message:
        "Autonomy holdout experiment closed — rule weight nudged from measured average uplift (internal experiment; not causal proof).",
      meta: {
        experimentId,
        upliftRevenue,
        weightDelta: delta,
        priorWeight: rule.weight,
        nextWeight,
        resultId: result.id,
        confidenceScore: result.confidenceScore,
        sampleSize: result.sampleSize,
      },
    },
  });

  return { experiment: exp, result, ruleWeightId: rule.id, nextWeight };
}
