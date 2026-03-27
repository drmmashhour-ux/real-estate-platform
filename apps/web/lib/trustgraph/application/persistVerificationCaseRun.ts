import type { Prisma } from "@prisma/client";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import {
  collectNextBestActionsFromRuleResults,
  flattenSignalsFromRuleResults,
} from "@/lib/trustgraph/application/generateNextBestActions";
import { buildDeterministicCaseSummary } from "@/lib/trustgraph/infrastructure/services/caseSummaryService";
import { trustScoringService, type TrustScoringOutcome } from "@/lib/trustgraph/infrastructure/services/trustScoringService";
import { nextBestActionRepository } from "@/lib/trustgraph/infrastructure/repositories/nextBestActionRepository";
import { trustProfileRepository } from "@/lib/trustgraph/infrastructure/repositories/trustProfileRepository";
import { verificationRuleResultRepository } from "@/lib/trustgraph/infrastructure/repositories/verificationRuleResultRepository";
import { verificationSignalRepository } from "@/lib/trustgraph/infrastructure/repositories/verificationSignalRepository";

export type TrustProfilePersistTarget =
  | { kind: "listing"; listingId: string }
  | { kind: "broker"; userId: string }
  | { kind: "host"; hostId: string }
  | { kind: "guestUser"; userId: string }
  | { kind: "none" };

/**
 * Persists rule results, signals, actions, case row, and trust profile (transaction body).
 */
export async function persistVerificationCaseRun(
  tx: Prisma.TransactionClient,
  args: {
    caseId: string;
    results: RuleEvaluationResult[];
    trustProfile: TrustProfilePersistTarget;
  }
): Promise<TrustScoringOutcome> {
  const { caseId, results, trustProfile } = args;
  const outcome = trustScoringService.computeOutcome(results);
  const { overallScore, trustLevel, readinessLevel } = outcome;

  await verificationRuleResultRepository.replaceForCase(tx, caseId, results);

  const signalDrafts = flattenSignalsFromRuleResults(results);
  await verificationSignalRepository.replaceForCase(tx, caseId, signalDrafts);

  const actionDrafts = collectNextBestActionsFromRuleResults(results);
  await nextBestActionRepository.replaceForCase(tx, caseId, actionDrafts);

  const caseRow = await tx.verificationCase.findUnique({
    where: { id: caseId },
  });
  if (!caseRow) throw new Error("case missing");

  const summary = buildDeterministicCaseSummary({
    caseRow: {
      overallScore,
      trustLevel,
      readinessLevel,
      entityType: caseRow.entityType,
      entityId: caseRow.entityId,
    },
    ruleResults: results,
    signals: signalDrafts.map((s) => ({
      signalCode: s.signalCode,
      message: s.message,
      severity: s.severity,
      category: s.category,
    })),
  });

  const nextStatus =
    readinessLevel === "action_required"
      ? "needs_info"
      : caseRow.status === "approved" || caseRow.status === "rejected" || caseRow.status === "escalated"
        ? caseRow.status
        : "pending";

  await tx.verificationCase.update({
    where: { id: caseId },
    data: {
      overallScore,
      trustLevel,
      readinessLevel,
      scoreBreakdown: outcome.scoreBreakdown as Prisma.InputJsonValue,
      summary: {
        version: TRUSTGRAPH_RULE_VERSION,
        ...summary,
        ruleCount: results.length,
      } as Prisma.InputJsonValue,
      explanation: summary.explanation,
      status: nextStatus,
    },
  });

  if (trustProfile.kind === "listing") {
    await trustProfileRepository.upsertForFsboListing(tx, {
      listingId: trustProfile.listingId,
      caseId,
      overallScore,
      trustLevel,
      readinessLevel,
      results,
    });
  } else if (trustProfile.kind === "broker") {
    await trustProfileRepository.upsertForBrokerUser(tx, {
      userId: trustProfile.userId,
      caseId,
      overallScore,
      trustLevel,
      readinessLevel,
      results,
    });
  } else if (trustProfile.kind === "host") {
    await trustProfileRepository.upsertForBnhubHost(tx, {
      hostId: trustProfile.hostId,
      caseId,
      overallScore,
      trustLevel,
      readinessLevel,
      results,
    });
  } else if (trustProfile.kind === "guestUser") {
    await trustProfileRepository.upsertForGuestUser(tx, {
      userId: trustProfile.userId,
      caseId,
      overallScore,
      trustLevel,
      readinessLevel,
      results,
    });
  }

  return outcome;
}
