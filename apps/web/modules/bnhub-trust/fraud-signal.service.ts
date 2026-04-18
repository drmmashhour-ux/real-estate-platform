import { prisma } from "@/lib/db";
import { BnhubFraudFlagStatus } from "@prisma/client";

export async function countActiveFraudSignalsForListing(listingId: string): Promise<number> {
  return prisma.bnhubFraudFlag.count({
    where: {
      listingId,
      status: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW, BnhubFraudFlagStatus.ESCALATED] },
    },
  });
}
