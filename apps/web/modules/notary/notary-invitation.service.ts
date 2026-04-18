import { prisma } from "@/lib/db";
import { buildNotaryDealSummary } from "./notary-document.service";

/**
 * Records invitation state and audit. Actual email delivery uses your transactional provider — log stays authoritative.
 */
export async function inviteNotaryToDeal(input: {
  dealId: string;
  notaryId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const notary = await prisma.notary.findFirst({ where: { id: input.notaryId, isActive: true } });
  if (!notary) return { ok: false, message: "Notary not found" };

  const summary = await buildNotaryDealSummary(input.dealId);
  if (!summary) return { ok: false, message: "Deal not found" };

  await prisma.dealNotaryCoordination.upsert({
    where: { dealId: input.dealId },
    create: {
      dealId: input.dealId,
      notaryId: input.notaryId,
      selectedAt: new Date(),
      invitationSentAt: new Date(),
      notaryInviteStatus: "invited",
    },
    update: {
      notaryId: input.notaryId,
      invitationSentAt: new Date(),
      notaryInviteStatus: "invited",
    },
  });

  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      actionKey: "notary_invitation_recorded",
      payload: {
        notaryId: input.notaryId,
        notaryEmailDomain: notary.notaryEmail.split("@")[1] ?? "redacted",
        dealSummaryPipeline: summary.pipelineState,
      },
    },
  });

  return { ok: true };
}
