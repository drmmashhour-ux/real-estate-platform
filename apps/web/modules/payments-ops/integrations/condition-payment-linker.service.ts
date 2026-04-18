import { prisma } from "@/lib/db";
import { logPaymentOpsEvent } from "../payments-ops-audit.service";

/**
 * Links financing/inspection conditions to payment stage metadata — informational.
 */
export async function syncConditionHintsToPayments(dealId: string, actorUserId?: string | null) {
  const [conditions, payments] = await Promise.all([
    prisma.dealClosingCondition.findMany({ where: { dealId } }),
    prisma.lecipmDealPayment.findMany({ where: { dealId } }),
  ]);

  const financingOpen = conditions.some(
    (c) => c.conditionType.toLowerCase().includes("financ") && c.status !== "fulfilled",
  );
  const inspectionOpen = conditions.some(
    (c) => c.conditionType.toLowerCase().includes("inspect") && c.status !== "fulfilled",
  );

  for (const p of payments) {
    await prisma.lecipmDealPayment.update({
      where: { id: p.id },
      data: {
        metadata: {
          ...(p.metadata as object),
          conditionHints: { financingOpen, inspectionOpen, syncedAt: new Date().toISOString() },
        },
      },
    });
  }

  await logPaymentOpsEvent(dealId, "condition_payment_hints_synced", { financingOpen, inspectionOpen }, actorUserId ?? null);
}
