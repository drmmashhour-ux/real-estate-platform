/**
 * Escrow: release host payout when hold window has passed.
 * Payments created with payoutHoldReason "escrow_window" and hostPayoutReleasedAt set
 * become eligible for payout when hostPayoutReleasedAt <= now.
 */

import { prisma } from "@/lib/db";

/**
 * Release escrow hold for payments whose release time has passed and are held only for escrow.
 * Does not release payments held for fraud_investigation or dispute.
 * Returns the number of payments updated.
 */
export async function releaseEscrowPayoutsDue(): Promise<number> {
  const now = new Date();
  const result = await prisma.payment.updateMany({
    where: {
      payoutHoldReason: "escrow_window",
      hostPayoutReleasedAt: { lte: now },
      status: "COMPLETED",
    },
    data: {
      payoutHoldReason: null,
    },
  });
  return result.count;
}
