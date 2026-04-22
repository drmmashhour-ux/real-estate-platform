import { prisma } from "@/lib/db";

/** Sponsor, admin, confirmed investor on deal, or public deal with marketing enabled. */
export async function canViewCapitalDeal(dealId: string, userId: string | null, role: string | null): Promise<boolean> {
  const deal = await prisma.amfCapitalDeal.findUnique({
    where: { id: dealId },
    select: {
      sponsorUserId: true,
      allowsPublicMarketing: true,
    },
  });
  if (!deal) return false;
  if (deal.allowsPublicMarketing) return true;
  if (role === "ADMIN") return true;
  if (userId && deal.sponsorUserId === userId) return true;
  if (!userId) return false;

  const linked = await prisma.amfInvestor.findFirst({
    where: {
      userId,
      investments: { some: { capitalDealId: dealId, status: "CONFIRMED" } },
    },
    select: { id: true },
  });
  return !!linked;
}

export async function canManageCapitalDeal(dealId: string, userId: string, role: string | null): Promise<boolean> {
  if (role === "ADMIN") return true;
  const deal = await prisma.amfCapitalDeal.findUnique({
    where: { id: dealId },
    select: { sponsorUserId: true },
  });
  return !!deal && deal.sponsorUserId === userId;
}
