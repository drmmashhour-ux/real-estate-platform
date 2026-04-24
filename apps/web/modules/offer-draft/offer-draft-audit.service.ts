import { prisma } from "@/lib/db";

export type OfferAiAuditAction = "draft_generated" | "field_modified_by_broker" | "draft_approved" | "offer_sent";

export async function recordOfferDraftAudit(input: {
  dealId: string;
  offerDraftId: string;
  actorUserId?: string | null;
  action: OfferAiAuditAction;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.offerDraftAuditLog.create({
      data: {
        dealId: input.dealId,
        offerDraftId: input.offerDraftId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        metadata: { source: "offer-ai", ...(input.metadata ?? {}) },
      },
    });
  } catch {
    // non-fatal
  }
}
