import { prisma } from "@/lib/db";

export type RefundReadinessResult = {
  ready: boolean;
  blockers: string[];
};

export async function evaluateRefundReadiness(dealId: string, paymentId: string): Promise<RefundReadinessResult> {
  const blockers: string[] = [];
  const pay = await prisma.lecipmDealPayment.findFirst({
    where: { id: paymentId, dealId },
  });
  if (!pay) return { ready: false, blockers: ["Payment not found"] };

  if (!["confirmed", "held", "release_pending"].includes(pay.status)) {
    blockers.push("Refund workflows expect funds previously confirmed or held — check status.");
  }

  if (pay.status === "refunded" || pay.status === "cancelled") {
    blockers.push("Payment already terminal for refunds.");
  }

  return { ready: blockers.length === 0, blockers };
}
