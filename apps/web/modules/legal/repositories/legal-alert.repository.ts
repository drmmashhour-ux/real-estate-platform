import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legalAlertsLog } from "../legal-logging";

export async function insertLegalAlertSafe(params: {
  entityType: string;
  entityId: string;
  riskLevel: string;
  title: string;
  detail: string;
  signals?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const row = await prisma.legalAlert.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        riskLevel: params.riskLevel,
        status: "OPEN",
        title: params.title,
        detail: params.detail,
        signals: (params.signals ?? {}) as Prisma.InputJsonValue,
      },
    });
    return row.id;
  } catch (e) {
    legalAlertsLog("legal alert insert failed", { error: String(e) });
    return null;
  }
}

export async function acknowledgeLegalAlertSafe(
  id: string,
  userId: string,
): Promise<boolean> {
  try {
    await prisma.legalAlert.update({
      where: { id },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedByUserId: userId,
      },
    });
    return true;
  } catch (e) {
    legalAlertsLog("ack failed", { error: String(e) });
    return false;
  }
}

export async function resolveLegalAlertSafe(id: string, userId: string): Promise<boolean> {
  try {
    await prisma.legalAlert.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedByUserId: userId,
      },
    });
    return true;
  } catch (e) {
    legalAlertsLog("resolve failed", { error: String(e) });
    return false;
  }
}

export async function dismissLegalAlertSafe(id: string, userId: string): Promise<boolean> {
  try {
    await prisma.legalAlert.update({
      where: { id },
      data: {
        status: "DISMISSED",
        dismissedAt: new Date(),
        dismissedByUserId: userId,
      },
    });
    return true;
  } catch (e) {
    legalAlertsLog("dismiss failed", { error: String(e) });
    return false;
  }
}
