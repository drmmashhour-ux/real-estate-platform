import { prisma } from "@/lib/db";

export interface SignatureGateResult {
  canSign: boolean;
  reasons: string[];
}

/**
 * Validates if a draft or deal is ready for signature.
 */
export async function checkSignatureReadiness(entityId: string, entityType: "DRAFT" | "DEAL"): Promise<SignatureGateResult> {
  const reasons: string[] = [];

  // Logic depends on entity type
  if (entityType === "DRAFT") {
    const draft = await (prisma as any).draft.findUnique({
      where: { id: entityId },
      include: {
        answers: true,
        notices: true,
      }
    });

    if (!draft) {
      return { canSign: false, reasons: ["Draft not found"] };
    }

    // 1. Check notices acknowledged
    const unacknowledgedNotices = draft.notices.filter((n: any) => !n.acknowledgedAt);
    if (unacknowledgedNotices.length > 0) {
      reasons.push(`${unacknowledgedNotices.length} notices require acknowledgment.`);
    }

    // 2. Check AI critical issues (assuming we have a flag or status)
    if (draft.aiSafetyStatus === "CRITICAL_ISSUES") {
      reasons.push("Critical compliance issues detected by AI must be resolved.");
    }

    // 3. Check payment status
    if (draft.paymentStatus !== "PAID" && draft.isPaidFeature) {
      reasons.push("Payment required before signature.");
    }
    
    // 4. Form completion
    if (!draft.completedAt) {
      reasons.push("Draft form must be completed.");
    }
  }

  return {
    canSign: reasons.length === 0,
    reasons
  };
}
