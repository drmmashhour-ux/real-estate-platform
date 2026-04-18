import { prisma } from "@/lib/db";
import { logPaymentOpsEvent } from "@/modules/payments-ops/payments-ops-audit.service";
import type { PaymentReminderKind } from "./payment-automation.types";

/**
 * Records reminder intent — actual email/SMS uses your notification layer.
 */
export async function recordReminderIntent(input: {
  dealId: string;
  kind: PaymentReminderKind;
  target: "buyer" | "broker" | "seller";
  payload?: Record<string, unknown>;
  actorUserId?: string | null;
}) {
  await logPaymentOpsEvent(
    input.dealId,
    `payment_reminder_${input.kind}`,
    { target: input.target, ...input.payload },
    input.actorUserId ?? null,
  );
  return { recorded: true as const };
}

export async function listPendingConfirmations(dealId: string) {
  return prisma.lecipmDealPayment.findMany({
    where: { dealId, status: { in: ["awaiting_confirmation", "awaiting_payment"] } },
  });
}
