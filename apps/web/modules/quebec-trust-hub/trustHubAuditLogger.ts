import { prisma } from "@/lib/db";

export async function logTrustHubEvent(args: {
  draftId: string;
  userId?: string;
  eventKey: "trust_score_calculated" | "trust_badge_granted" | "safer_choice_generated" | "clause_explained" | "protection_mode_enabled" | "broker_assist_requested";
  payload?: any;
}) {
  const { draftId, userId, eventKey, payload } = args;

  // Use existing TurboDraftAuditLog if possible, or a specialized one
  await prisma.turboDraftAuditLog.create({
    data: {
      draftId,
      userId,
      eventKey,
      severity: "INFO",
      payloadJson: payload || {},
    },
  });
}
