import { prisma } from "@/lib/db";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";

/**
 * Resolve the guest's signed enforceable short-term contract for BNHub booking money linkage.
 */
export async function resolveGuestEnforceableContractForBooking(bookingId: string): Promise<{
  contractId: string;
  contractType: string;
} | null> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, listingId: true },
  });
  if (!b) return null;

  const row = await prisma.contract.findFirst({
    where: {
      userId: b.guestId,
      type: ENFORCEABLE_CONTRACT_TYPES.SHORT_TERM,
      signed: true,
      OR: [{ listingId: b.listingId }, { fsboListingId: b.listingId }],
    },
    orderBy: { signedAt: "desc" },
    select: { id: true, type: true },
  });

  return row ? { contractId: row.id, contractType: row.type } : null;
}
