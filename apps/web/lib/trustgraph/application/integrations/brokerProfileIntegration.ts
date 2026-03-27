import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { createVerificationCase, getLatestCaseForEntity } from "@/lib/trustgraph/application/createVerificationCase";
import { runVerificationPipelineForCase } from "@/lib/trustgraph/application/runVerificationPipeline";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";

export type BrokerTrustBadgeSafeDto = {
  state: "verified" | "pending_review" | "incomplete" | "not_eligible";
  label: string;
  trustScore: number | null;
};

/**
 * Runs broker rules pipeline and updates trust profile (non-blocking for callers).
 */
export async function syncBrokerTrustGraphForUser(args: { userId: string; actorUserId?: string | null }) {
  if (!isTrustGraphEnabled()) return { skipped: true as const };

  let c = await getLatestCaseForEntity("BROKER", args.userId);
  if (!c) {
    c = await createVerificationCase({
      entityType: "BROKER",
      entityId: args.userId,
      createdBy: args.actorUserId ?? args.userId,
    });
  }

  await runVerificationPipelineForCase({
    caseId: c.id,
    actorUserId: args.actorUserId ?? args.userId,
  });

  void recordPlatformEvent({
    eventType: "trustgraph_broker_pipeline_run",
    sourceModule: "trustgraph",
    entityType: "USER",
    entityId: args.userId,
    payload: { caseId: c.id },
  }).catch(() => {});

  return { skipped: false as const, caseId: c.id };
}

/**
 * Safe broker badge state for UI (no internal rule codes or fraud signals).
 */
export async function getBrokerTrustBadgeSafeDto(userId: string): Promise<BrokerTrustBadgeSafeDto> {
  const profile = await prisma.trustProfile.findUnique({
    where: { subjectType_subjectId: { subjectType: "broker", subjectId: userId } },
  });

  const bv = await prisma.brokerVerification.findUnique({
    where: { userId },
    select: { licenseNumber: true, brokerageCompany: true, verificationStatus: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, phone: true },
  });

  const licenseOk = Boolean(bv?.licenseNumber?.trim());
  const brokerageOk = Boolean(bv?.brokerageCompany?.trim());
  const contactOk = Boolean(user?.email?.trim()) && (Boolean(user?.name?.trim()) || Boolean(user?.phone?.trim()));

  if (bv?.verificationStatus === "VERIFIED") {
    return { state: "verified", label: "Verified broker", trustScore: profile?.trustScore ?? null };
  }

  if (!bv && !licenseOk && !brokerageOk) {
    return {
      state: "not_eligible",
      label: "Broker verification not started",
      trustScore: profile?.trustScore ?? null,
    };
  }

  if (!licenseOk || !brokerageOk || !contactOk) {
    return {
      state: "incomplete",
      label: "Complete license, brokerage, and contact details",
      trustScore: profile?.trustScore ?? null,
    };
  }

  return {
    state: "pending_review",
    label: "Verification pending",
    trustScore: profile?.trustScore ?? null,
  };
}
