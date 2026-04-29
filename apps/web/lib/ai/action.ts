import "server-only";

import { prisma } from "@/lib/db";

export type ActionType = "approve" | "flag" | "block" | "escalate";

export async function executeAction(
  queueItemId: string,
  action: ActionType,
  opts?: { riskScore?: number; performedBy?: string }
): Promise<{ ok: boolean; message?: string }> {
  const item = await prisma.aiQueueItem.findUnique({ where: { id: queueItemId } });
  if (!item) {
    return { ok: false, message: "Queue item not found" };
  }

  const prev =
    item.details && typeof item.details === "object" && item.details !== null && !Array.isArray(item.details)
      ? ({ ...(item.details as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const merged: Record<string, unknown> = {
    ...prev,
    lastAction: action,
    performedBy: opts?.performedBy ?? "system",
    at: new Date().toISOString(),
  };
  if (opts?.riskScore !== undefined) merged.appliedRiskScore = opts.riskScore;

  const nextStatus =
    action === "approve"
      ? "approved"
      : action === "flag"
        ? "flagged"
        : action === "block"
          ? "rejected"
          : "flagged";

  await prisma.aiQueueItem.update({
    where: { id: queueItemId },
    data: {
      status: nextStatus,
      details: merged as object,
      ...(action === "approve" && opts?.riskScore !== undefined ? { riskScore: Math.round(opts.riskScore) } : {}),
    },
  });

  return { ok: true };
}
