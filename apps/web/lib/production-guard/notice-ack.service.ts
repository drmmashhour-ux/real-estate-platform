import { prisma } from "@/lib/db";
import { LECIPM_CRITICAL_NOTICE_IDS, isCriticalNoticeId } from "./critical-notices";
import { recordProductionGuardAudit } from "./audit-service";

export async function recordCriticalNoticeAcknowledgment(input: {
  dealId: string;
  userId: string;
  noticeId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isCriticalNoticeId(input.noticeId)) {
    return { ok: false, error: "INVALID_NOTICE_ID" };
  }

  await prisma.lecipmProductionGuardNoticeAck.upsert({
    where: {
      dealId_userId_noticeId: {
        dealId: input.dealId,
        userId: input.userId,
        noticeId: input.noticeId,
      },
    },
    create: {
      dealId: input.dealId,
      userId: input.userId,
      noticeId: input.noticeId,
    },
    update: {
      acknowledgedAt: new Date(),
    },
  });

  await recordProductionGuardAudit({
    dealId: input.dealId,
    actorUserId: input.userId,
    action: "notice_acknowledged",
    entityType: "critical_notice",
    entityId: input.noticeId,
    metadata: { noticeId: input.noticeId },
  });

  return { ok: true };
}

export async function listMissingCriticalNoticeAcks(dealId: string, userId: string): Promise<string[]> {
  const rows = await prisma.lecipmProductionGuardNoticeAck.findMany({
    where: { dealId, userId, noticeId: { in: [...LECIPM_CRITICAL_NOTICE_IDS] } },
    select: { noticeId: true },
  });
  const have = new Set(rows.map((r) => r.noticeId));
  return LECIPM_CRITICAL_NOTICE_IDS.filter((id) => !have.has(id));
}
