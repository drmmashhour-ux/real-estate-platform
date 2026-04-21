import { prisma } from "@/lib/db";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { findDealForParticipant } from "@/lib/deals/execution-access";

export async function findDealForClosingAccess(
  dealId: string,
  userId: string,
  role: string | null | undefined,
) {
  if (role === "ADMIN") {
    return prisma.deal.findUnique({ where: { id: dealId } });
  }
  return findDealForParticipant(dealId, userId);
}

export function canVerifyClosingDocument(
  userId: string,
  role: string | null | undefined,
  deal: { brokerId: string | null },
): boolean {
  return canMutateExecution(userId, role, deal);
}

export function canConfirmClosing(
  userId: string,
  role: string | null | undefined,
  deal: { brokerId: string | null },
): boolean {
  return canMutateExecution(userId, role, deal);
}

/** Upload to closing room: parties + broker + admin. */
export function canUploadClosingDocument(
  userId: string,
  role: string | null | undefined,
  deal: { buyerId: string; sellerId: string; brokerId: string | null },
): boolean {
  if (role === "ADMIN") return true;
  if (canMutateExecution(userId, role, deal)) return true;
  return deal.buyerId === userId || deal.sellerId === userId;
}
