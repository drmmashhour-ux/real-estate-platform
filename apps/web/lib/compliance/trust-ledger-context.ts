import { prisma } from "@/lib/db";

export type TrustLedgerOwner = { ownerType: string; ownerId: string };

export async function trustLedgerOwnerFromDeposit(depositId: string): Promise<TrustLedgerOwner | null> {
  const d = await prisma.trustDeposit.findUnique({
    where: { id: depositId },
    select: {
      trustAccountProfile: { select: { ownerType: true, ownerId: true } },
    },
  });
  const p = d?.trustAccountProfile;
  if (!p) return null;
  return { ownerType: p.ownerType, ownerId: p.ownerId };
}
