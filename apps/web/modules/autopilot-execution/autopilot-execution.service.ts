/**
 * Entry point for all LECIPM autopilot candidates — coordinates policy, logging, queue, and bounded execute.
 */
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getDomainMatrixRow } from "@/modules/autopilot-governance/autopilot-domain-matrix.service";
import { getAutopilotDecision } from "@/modules/autopilot-governance/full-autopilot-decision.service";
import { buildAutopilotExplanation } from "@/modules/autopilot-governance/full-autopilot-explainability.service";

import type { AutopilotCandidateContext, AutopilotOrchestrationResult } from "./autopilot-execution.types";
import { createFullAutopilotExecutionRow, linkExecutionToPlatformAction } from "./autopilot-execution-log.service";
import { persistAutomaticExecution, persistQueuedApproval } from "./autopilot-execution-runner.service";

export async function submitAutopilotCandidate(
  candidate: AutopilotCandidateContext
): Promise<AutopilotOrchestrationResult | { error: string }> {
  const decision = await getAutopilotDecision({
    domain: candidate.domain,
    actionType: candidate.actionType,
    context: candidate.policyContext,
  });

  if ("error" in decision) {
    return { error: decision.error };
  }

  const matrix = getDomainMatrixRow(candidate.domain);
  const expl = buildAutopilotExplanation(candidate.domain, candidate.actionType, {
    outcome: decision.outcome,
    policyRuleId: decision.policyRuleId,
    riskLevel: decision.riskLevel,
    confidence: decision.confidence,
    reason: decision.reason,
  });

  const explanationText = [expl.headline, expl.detail, expl.advisoryNote].join("\n\n");

  const detailJson =
    {
      headline: expl.headline,
      detail: expl.detail,
      advisoryNote: expl.advisoryNote,
      policyRuleId: expl.policyRuleId,
    } as unknown as Prisma.InputJsonValue;

  const exec = await createFullAutopilotExecutionRow({
    domain: candidate.domain,
    actionType: candidate.actionType,
    sourceSystem: candidate.sourceSystem,
    policyRuleId: decision.policyRuleId,
    decisionOutcome: decision.outcome,
    riskLevel: decision.riskLevel,
    confidence: decision.confidence,
    explanation: explanationText,
    explanationDetail: detailJson,
    candidatePayload: candidate.candidatePayload as Prisma.InputJsonValue | undefined,
    rollbackEligible:
      !!matrix?.supportsRollback &&
      decision.outcome === "ALLOW_AUTOMATIC",
  });

  if (decision.outcome === "BLOCK") {
    return {
      executionId: exec.id,
      outcome: "BLOCK",
      policyRuleId: decision.policyRuleId,
      explanation: decision.reason,
      platformActionId: null,
    };
  }

  if (decision.outcome === "REQUIRE_APPROVAL") {
    const paId = await persistQueuedApproval({
      domain: candidate.domain,
      actionType: candidate.actionType,
      title: candidate.title,
      summary: candidate.summary,
      candidatePayload: candidate.candidatePayload,
      riskLevel: decision.riskLevel,
      fingerprint: candidate.fingerprint,
      subjectUserId: candidate.subjectUserId ?? undefined,
      sourceSystem: candidate.sourceSystem,
    });
    await linkExecutionToPlatformAction(exec.id, paId);
    return {
      executionId: exec.id,
      outcome: "REQUIRE_APPROVAL",
      platformActionId: paId,
      policyRuleId: decision.policyRuleId,
      explanation: decision.reason,
    };
  }

  const paId = await persistAutomaticExecution({
    domain: candidate.domain,
    actionType: candidate.actionType,
    title: candidate.title,
    summary: candidate.summary,
    candidatePayload: candidate.candidatePayload,
    riskLevel: decision.riskLevel,
    fingerprint: candidate.fingerprint,
    subjectUserId: candidate.subjectUserId ?? undefined,
    sourceSystem: candidate.sourceSystem,
  });

  await prisma.lecipmFullAutopilotExecution.update({
    where: { id: exec.id },
    data: {
      platformActionId: paId,
      executedPayload: (
        process.env.LECIPM_AUTOPILOT_EXECUTE === "true" ?
          candidate.candidatePayload
        : { simulated: true, mirrored: candidate.candidatePayload ?? null }
      ) as Prisma.InputJsonValue,
    },
  });

  return {
    executionId: exec.id,
    outcome: "ALLOW_AUTOMATIC",
    platformActionId: paId,
    policyRuleId: decision.policyRuleId,
    explanation: decision.reason,
  };
}
