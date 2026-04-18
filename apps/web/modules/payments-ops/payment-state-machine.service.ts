import type { LecipmPaymentRecordStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appendLedgerEntry } from "./payment-ledger.service";
import { logPaymentOpsEvent } from "./payments-ops-audit.service";

const ALLOWED: Partial<Record<LecipmPaymentRecordStatus, LecipmPaymentRecordStatus[]>> = {
  /** Broker may attest confirmation from draft when evidence is recorded (manual trust workflows). */
  draft: ["requested", "cancelled", "confirmed"],
  requested: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["awaiting_confirmation", "confirmed", "failed", "cancelled"],
  awaiting_confirmation: ["confirmed", "failed", "cancelled"],
  confirmed: ["held", "release_pending", "refund_pending"],
  held: ["release_pending", "refund_pending"],
  release_pending: ["released", "held"],
  released: [],
  refund_pending: ["refunded", "confirmed"],
  refunded: [],
  failed: ["requested"],
  cancelled: [],
};

export function canTransition(from: LecipmPaymentRecordStatus, to: LecipmPaymentRecordStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export async function transitionPaymentStatus(input: {
  paymentId: string;
  dealId: string;
  to: LecipmPaymentRecordStatus;
  actorUserId?: string | null;
  ledgerDescription?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const pay = await prisma.lecipmDealPayment.findFirst({
    where: { id: input.paymentId, dealId: input.dealId },
  });
  if (!pay) return { ok: false, message: "Payment not found" };
  if (!canTransition(pay.status, input.to)) {
    return { ok: false, message: `Invalid transition ${pay.status} → ${input.to}` };
  }

  const now = new Date();
  const data: Parameters<typeof prisma.lecipmDealPayment.update>[0]["data"] = {
    status: input.to,
    updatedAt: now,
  };
  if (input.to === "awaiting_payment" && !pay.requestedAt) data.requestedAt = now;
  if (input.to === "awaiting_confirmation" && !pay.receivedAt) data.receivedAt = now;
  if (input.to === "confirmed") data.confirmedAt = now;
  if (input.to === "released") data.releasedAt = now;
  if (input.to === "refunded") data.refundedAt = now;

  await prisma.lecipmDealPayment.update({
    where: { id: input.paymentId },
    data,
  });

  await appendLedgerEntry({
    dealId: input.dealId,
    paymentId: input.paymentId,
    entryKind: mapStatusToLedger(input.to),
    amountCents: pay.amountCents,
    description: input.ledgerDescription ?? `Status → ${input.to}`,
    actorUserId: input.actorUserId,
    auditActionKey: `payment_status_${input.to}`,
  });

  await logPaymentOpsEvent(input.dealId, "payment_state_transition", { paymentId: input.paymentId, to: input.to }, input.actorUserId);

  return { ok: true };
}

function mapStatusToLedger(to: LecipmPaymentRecordStatus): import("@prisma/client").LecipmLedgerEntryKind {
  switch (to) {
    case "requested":
      return "request_created";
    case "awaiting_confirmation":
      return "payment_received";
    case "confirmed":
      return "payment_confirmed";
    case "held":
      return "held_in_trust";
    case "released":
    case "release_pending":
      return "released_to_notary_or_closing";
    case "refunded":
    case "refund_pending":
      return "refunded";
    case "failed":
      return "failure";
    default:
      return "adjustment";
  }
}
