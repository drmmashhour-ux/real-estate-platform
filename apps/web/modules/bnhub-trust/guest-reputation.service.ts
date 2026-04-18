import { prisma } from "@/lib/db";

/** Guest-side BNHub profile signals when present — no synthetic reputation. */
export async function getGuestBnhubProfile(guestUserId: string) {
  return prisma.bnhubGuestProfile.findUnique({
    where: { userId: guestUserId },
    select: { id: true, trustScore: true, updatedAt: true },
  });
}
