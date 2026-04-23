import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertNoAutoActionWithoutHumanReview, assertNoGuaranteedOutcomeLanguage } from "@/lib/monitoring/safety";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

function metadataAsRecord(m: Prisma.InputJsonValue | undefined): Record<string, unknown> | null {
  if (m === undefined || m === null) return null;
  if (typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return null;
}

export async function createAlert(data: {
  ownerType: string;
  ownerId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  assertNoGuaranteedOutcomeLanguage(data.title, data.message);
  assertNoAutoActionWithoutHumanReview(metadataAsRecord(data.metadata));
  const row = await prisma.alertCenterItem.create({
    data: {
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      alertType: data.alertType,
      severity: data.severity,
      title: data.title,
      message: data.message,
      referenceType: data.referenceType ?? undefined,
      referenceId: data.referenceId ?? undefined,
      metadata: data.metadata,
    },
  });
  await recordAuditEvent({
    actorUserId: data.ownerId,
    action: "ALERT_CENTER_ALERT_GENERATED",
    payload: { alertId: row.id, alertType: data.alertType },
  });
  return row;
}

export async function listAlerts(ownerType: string, ownerId: string) {
  return prisma.alertCenterItem.findMany({
    where: {
      ownerType,
      ownerId,
      archived: false,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function markAlertRead(id: string, ownerType: string, ownerId: string) {
  return prisma.alertCenterItem.updateMany({
    where: { id, ownerType, ownerId },
    data: { read: true },
  });
}

export async function archiveAlert(id: string, ownerType: string, ownerId: string) {
  return prisma.alertCenterItem.updateMany({
    where: { id, ownerType, ownerId },
    data: { archived: true },
  });
}
