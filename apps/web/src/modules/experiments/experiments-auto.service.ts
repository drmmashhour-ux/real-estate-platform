import { growthV3Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { aggregateExperimentMetrics } from "./metric-evaluator.service";
import { evaluateExperimentGuardrails } from "./experiment-guardrails";

/**
 * Suggests experiments and evaluates running ones — never mutates variants without human approval.
 */
export async function suggestAutoExperiments(): Promise<{ created: number }> {
  if (!growthV3Flags.experimentsAutoV1) return { created: 0 };

  const hypotheses = [
    {
      hypothesis: "Test primary CTA label on city SEO pages (Browse vs See listings).",
      experimentKind: "cta_copy",
    },
    {
      hypothesis: "Test ranking weight emphasis on freshness vs trust for BNHub browse.",
      experimentKind: "ranking_weights",
    },
  ];

  let created = 0;
  for (const h of hypotheses) {
    const exists = await prisma.growthExperimentSuggestion.findFirst({
      where: { hypothesis: h.hypothesis, status: "suggested" },
    });
    if (exists) continue;
    await prisma.growthExperimentSuggestion.create({
      data: {
        hypothesis: h.hypothesis,
        experimentKind: h.experimentKind,
        status: "suggested",
        metadataJson: { source: "experiments_auto_v1", createdAt: new Date().toISOString() },
      },
    });
    created += 1;
  }
  return { created };
}

export async function evaluateRunningExperimentsAuto(): Promise<{ snapshots: number; warnings: string[] }> {
  if (!growthV3Flags.experimentsAutoV1) return { snapshots: 0, warnings: [] };

  const running = await prisma.experiment.findMany({
    where: { status: "running" },
    select: { id: true, startAt: true },
    take: 20,
  });

  let snapshots = 0;
  const warnings: string[] = [];
  for (const exp of running) {
    const since = exp.startAt ?? new Date(Date.now() - 14 * 86400000);
    const metrics = await aggregateExperimentMetrics(exp.id, since);
    const g = evaluateExperimentGuardrails(metrics);
    warnings.push(...g.map((w) => `${exp.id}:${w}`));
    await prisma.experimentResultSnapshot.create({
      data: {
        experimentId: exp.id,
        periodStart: since,
        periodEnd: new Date(),
        metricsJson: metrics,
        guardrailWarningsJson: g,
      },
    });
    snapshots += 1;
  }

  return { snapshots, warnings };
}
