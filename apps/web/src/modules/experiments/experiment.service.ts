import { prisma } from "@/lib/db";
import { aggregateExperimentMetrics } from "./metric-evaluator.service";
import { evaluateExperimentGuardrails } from "./experiment-guardrails";

export { getOrCreateExperimentAssignment } from "./assignment.service";

export async function snapshotExperimentResults(experimentId: string): Promise<{ id: string } | null> {
  const exp = await prisma.experiment.findUnique({ where: { id: experimentId } });
  if (!exp) return null;
  const since = exp.startAt ?? new Date(Date.now() - 14 * 86400000);
  const metrics = await aggregateExperimentMetrics(experimentId, since);
  const guardrails = evaluateExperimentGuardrails(metrics);
  const snap = await prisma.experimentResultSnapshot.create({
    data: {
      experimentId,
      periodStart: since,
      periodEnd: new Date(),
      metricsJson: metrics,
      guardrailWarningsJson: guardrails,
    },
  });
  return { id: snap.id };
}
