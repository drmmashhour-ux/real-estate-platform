import { prisma } from "@/lib/db";
import { LECIPM_CRITICAL_NOTICE_IDS, isCriticalNoticeId } from "./critical-notices";
import { recordProductionGuardAudit } from "./audit-service";

export type NoticeAckOptions = {
  /**
   * UI must use an explicit control (checkbox). Server records proof — never trust `true` from AI text alone.
   * @default "ui_checkbox"
   */
  acknowledgmentSource?: "ui_checkbox" | "api_confirmed";
};

export async function recordCriticalNoticeAcknowledgment(
  input: {
    dealId: string;
    userId: string;
    noticeId: string;
  } & NoticeAckOptions,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isCriticalNoticeId(input.noticeId)) {
    return { ok: false, error: "INVALID_NOTICE_ID" };
  }
  if (input.acknowledgmentSource === "api_confirmed" && process.env.PRODUCTION_MODE === "true") {
    return { ok: false, error: "ACK_SOURCE_NOT_ALLOWED_IN_PRODUCTION" };
  }

  const now = new Date();
  const source = input.acknowledgmentSource ?? "ui_checkbox";

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
      acknowledgedAt: now,
    },
    update: {
      acknowledgedAt: now,
    },
  });

  await recordProductionGuardAudit({
    dealId: input.dealId,
    actorUserId: input.userId,
    action: "notice_acknowledged",
    entityType: "critical_notice",
    entityId: input.noticeId,
    metadata: {
      noticeId: input.noticeId,
      acknowledgedAtIso: now.toISOString(),
      acknowledgmentSource: source,
    },
  });

  return { ok: true };
}

/**
 * When a critical notice is rendered in the client, log it for compliance (separate from acceptance).
 */
export async function recordCriticalNoticeShown(input: {
  dealId: string;
  userId: string;
  noticeId: string;
}): Promise<void> {
  if (!isCriticalNoticeId(input.noticeId)) return;
  await recordProductionGuardAudit({
    dealId: input.dealId,
    actorUserId: input.userId,
    action: "notice_shown",
    entityType: "critical_notice",
    entityId: input.noticeId,
    metadata: { noticeId: input.noticeId, shownAtIso: new Date().toISOString() },
  });
}

export async function listMissingCriticalNoticeAcks(dealId: string, userId: string): Promise<string[]> {
  const rows = await prisma.lecipmProductionGuardNoticeAck.findMany({
    where: { dealId, userId, noticeId: { in: [...LECIPM_CRITICAL_NOTICE_IDS] } },
    select: { noticeId: true },
  });
  const have = new Set(rows.map((r) => r.noticeId));
  return LECIPM_CRITICAL_NOTICE_IDS.filter((id) => !have.has(id));
}
