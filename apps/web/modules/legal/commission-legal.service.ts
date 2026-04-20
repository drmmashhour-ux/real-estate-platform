/**
 * Deterministic commission / payout discrepancy signals — audit-only.
 */

import { prisma } from "@/lib/db";
import { insertCommissionLegalEventSafe } from "./repositories/commission-legal-event.repository";
import { insertLegalAlertSafe } from "./repositories/legal-alert.repository";
import { legalAuditLog } from "./legal-logging";
import { logLegalAction } from "./legal-audit.service";

export async function evaluateCommissionLegalSignalsSafe(params?: {
  brokerUserId?: string;
  limit?: number;
}): Promise<{ eventsCreated: number }> {
  let eventsCreated = 0;
  const lim = Math.min(params?.limit ?? 25, 100);

  try {
    const payouts = await prisma.brokerPayout.findMany({
      where: params?.brokerUserId ? { brokerId: params.brokerUserId } : undefined,
      orderBy: { updatedAt: "desc" },
      take: lim,
      select: {
        id: true,
        brokerId: true,
        status: true,
        totalAmountCents: true,
        approvedAt: true,
        paidAt: true,
        notes: true,
        failureReason: true,
      },
    });

    for (const p of payouts) {
      let reason: string | null = null;
      let detail = "";

      if (p.status === "FAILED" || p.status === "CANCELLED") {
        reason = "payout_terminal_status";
        detail = `Payout ${p.id} status=${p.status} cents=${p.totalAmountCents} failure=${p.failureReason ?? "n/a"}`;
      }

      if (!reason) continue;

      const id = await insertCommissionLegalEventSafe({
        entityType: "BROKER_PAYOUT",
        entityId: p.id,
        reasonKey: reason,
        severity: "MEDIUM",
        detail,
        metadata: { brokerId: p.brokerId, status: p.status },
      });
      if (id) {
        eventsCreated += 1;
        await insertLegalAlertSafe({
          entityType: "BROKER_PAYOUT",
          entityId: p.id,
          riskLevel: "MEDIUM",
          title: "Commission payout review",
          detail,
          signals: { reasonKey: reason },
        });
        await logLegalAction({
          entityType: "BROKER_PAYOUT",
          entityId: p.id,
          action: "COMMISSION_LEGAL_SIGNAL",
          actorId: null,
          actorType: "SYSTEM",
          metadata: { reasonKey: reason },
        });
      }
    }
  } catch (e) {
    legalAuditLog("commission evaluation scan failed", { error: String(e) });
  }

  return { eventsCreated };
}
