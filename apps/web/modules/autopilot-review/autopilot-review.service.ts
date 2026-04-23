import { prisma } from "@/lib/db";

/** Structured review bundle for operator UI / audit exports. */
export type AutopilotReviewBundle = {
  sourceSystem: string;
  inputSummary: string;
  policy: {
    ruleId: string;
    outcome: string;
    riskLevel: string;
    confidence: number;
    explanationText: string;
  };
  execution: {
    id: string;
    createdAt: string;
    actorType: string;
    actorUserId: string | null;
    rollbackEligible: boolean;
    rolledBackAt: string | null;
  };
  outcome: {
    window: string | null;
    baseline: unknown;
    after: unknown;
    delta: unknown;
    confidence: number | null;
  };
};

function summarizePayload(label: string, payload: unknown): string {
  if (payload == null) return `${label}: (none)`;
  try {
    const s = JSON.stringify(payload);
    return `${label}: ${s.length > 600 ? `${s.slice(0, 597)}…` : s}`;
  } catch {
    return `${label}: (unserializable)`;
  }
}

export async function getExecutionReviewDetail(executionId: string) {
  const row = await prisma.lecipmFullAutopilotExecution.findUnique({
    where: { id: executionId },
  });
  if (!row) return null;

  const platform =
    row.platformActionId ?
      await prisma.platformAutopilotAction.findUnique({
        where: { id: row.platformActionId },
        include: { decisions: { orderBy: { createdAt: "desc" }, take: 20 } },
      })
    : null;

  const detail = row.explanationDetail as { detail?: string } | null;
  const reviewBundle: AutopilotReviewBundle = {
    sourceSystem: row.sourceSystem,
    inputSummary: [
      summarizePayload("Candidate", row.candidatePayload),
      summarizePayload("Executed", row.executedPayload),
    ].join("\n"),
    policy: {
      ruleId: row.policyRuleId,
      outcome: row.decisionOutcome,
      riskLevel: row.riskLevel,
      confidence: row.confidence,
      explanationText: detail?.detail ?? row.explanation,
    },
    execution: {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      actorType: row.actorType,
      actorUserId: row.actorUserId,
      rollbackEligible: row.rollbackEligible,
      rolledBackAt: row.rolledBackAt?.toISOString() ?? null,
    },
    outcome: {
      window: row.outcomeWindow,
      baseline: row.baselineBeforeJson,
      after: row.resultAfterJson,
      delta: row.outcomeDeltaJson,
      confidence: row.outcomeConfidence,
    },
  };

  return {
    execution: row,
    platformAutopilotAction: platform,
    reviewHints: {
      sourceSystem: row.sourceSystem,
      policyRuleId: row.policyRuleId,
      decisionOutcome: row.decisionOutcome,
      rollbackEligible: row.rollbackEligible,
    },
    reviewBundle,
  };
}
