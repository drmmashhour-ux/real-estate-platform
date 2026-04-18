import type { LecipmPaymentConfirmationKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { transitionPaymentStatus } from "./payment-state-machine.service";
import { logPaymentOpsEvent } from "./payments-ops-audit.service";

/**
 * Records broker-authorized confirmation with evidence — never auto-confirms without actor.
 */
export async function recordManualConfirmation(input: {
  dealId: string;
  paymentId: string;
  confirmedById: string;
  confirmationType: LecipmPaymentConfirmationKind;
  evidence: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const pay = await prisma.lecipmDealPayment.findFirst({
    where: { id: input.paymentId, dealId: input.dealId },
  });
  if (!pay) return { ok: false, message: "Payment not found" };

  await prisma.lecipmPaymentConfirmation.create({
    data: {
      dealPaymentId: input.paymentId,
      confirmationType: input.confirmationType,
      confirmedById: input.confirmedById,
      evidence: input.evidence as object,
    },
  });

  const t = await transitionPaymentStatus({
    paymentId: input.paymentId,
    dealId: input.dealId,
    to: "confirmed",
    actorUserId: input.confirmedById,
    ledgerDescription: `Confirmed (${input.confirmationType}); evidence keys: ${Object.keys(input.evidence).join(", ")}`,
  });
  if (!t.ok) {
    await logPaymentOpsEvent(
      input.dealId,
      "payment_confirmation_transition_failed",
      { paymentId: input.paymentId, priorStatus: pay.status, message: t.message },
      input.confirmedById,
    );
    return { ok: false, message: t.message };
  }

  await logPaymentOpsEvent(input.dealId, "payment_confirmed_manual", { paymentId: input.paymentId }, input.confirmedById);

  if (pay.paymentKind === "deposit") {
    const deal = await prisma.deal.findUnique({ where: { id: input.dealId }, select: { executionMetadata: true } });
    const meta = (deal?.executionMetadata ?? {}) as Record<string, unknown>;
    await prisma.deal.update({
      where: { id: input.dealId },
      data: {
        executionMetadata: {
          ...meta,
          depositConfirmed: true,
          depositConfirmedAt: new Date().toISOString(),
        } as object,
      },
    });
  }

  return { ok: true };
}
