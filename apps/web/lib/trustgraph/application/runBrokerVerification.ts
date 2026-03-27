import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { persistVerificationCaseRun } from "@/lib/trustgraph/application/persistVerificationCaseRun";
import { collectBrokerVerificationResults } from "@/lib/trustgraph/infrastructure/rules/listingRulesRegistry";
import { buildBrokerVerificationContextFromUser } from "@/lib/trustgraph/infrastructure/services/evidenceBuilder";

/** Broker profile rules for `VerificationEntityType.BROKER` cases (`entityId` = user id). */
export async function runBrokerVerification(args: {
  caseId: string;
  userId: string;
  actorUserId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      brokerVerifications: true,
    },
  });
  if (!user) return { ok: false, error: "User not found" };

  const bv = user.brokerVerifications[0] ?? null;
  const ctx = buildBrokerVerificationContextFromUser(user, bv);
  const results = collectBrokerVerificationResults(ctx);

  const outcome = await prisma.$transaction(async (tx) => {
    return persistVerificationCaseRun(tx, {
      caseId: args.caseId,
      results,
      trustProfile: { kind: "broker", userId: args.userId },
    });
  });

  void recordPlatformEvent({
    eventType: "trustgraph_pipeline_run",
    sourceModule: "trustgraph",
    entityType: "VERIFICATION_CASE",
    entityId: args.caseId,
    payload: {
      mode: "broker",
      brokerUserId: args.userId,
      overallScore: outcome.overallScore,
      trustLevel: outcome.trustLevel,
      readinessLevel: outcome.readinessLevel,
      actorUserId: args.actorUserId ?? null,
    },
  }).catch(() => {});

  return { ok: true };
}
