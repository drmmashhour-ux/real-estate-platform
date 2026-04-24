import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function assertDealAccess(dealId: string, userId: string, role: PlatformRole) {
  if (role === "ADMIN") return;
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { brokerId: true },
  });
  if (!deal) throw new Error("Deal not found.");
  if (deal.brokerId === userId) return;
  throw new Error("Only the assigned broker or an administrator may manage legal documents for this deal.");
}

export async function assertCapitalAccess(capitalDealId: string, userId: string, role: PlatformRole) {
  if (role === "ADMIN") return;
  const cap = await prisma.amfCapitalDeal.findUnique({
    where: { id: capitalDealId },
    select: { sponsorUserId: true },
  });
  if (!cap) throw new Error("Capital deal not found.");
  if (cap.sponsorUserId === userId) return;
  throw new Error("Only the deal sponsor or an administrator may manage investment-domain documents.");
}

/** Read/sign access: assigned broker, buyer, seller, or admin. */
export async function assertDealPartySignAccess(dealId: string, userId: string, role: PlatformRole) {
  if (role === "ADMIN") return;
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { brokerId: true, buyerId: true, sellerId: true },
  });
  if (!deal) throw new Error("Deal not found.");
  if (deal.brokerId === userId || deal.buyerId === userId || deal.sellerId === userId) return;
  throw new Error("Only transaction parties or an administrator may sign this document.");
}

export async function assertLegalArtifactReadAccess(input: {
  dealId: string | null;
  capitalDealId: string | null;
  userId: string;
  role: PlatformRole;
}) {
  if (input.role === "ADMIN") return;
  if (input.dealId) {
    await assertDealPartySignAccess(input.dealId, input.userId, input.role);
    return;
  }
  if (input.capitalDealId) {
    await assertCapitalAccess(input.capitalDealId, input.userId, input.role);
    return;
  }
  throw new Error("Forbidden");
}
