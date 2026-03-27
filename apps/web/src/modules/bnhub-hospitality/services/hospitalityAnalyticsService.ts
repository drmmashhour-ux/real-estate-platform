import { prisma } from "@/lib/db";

export async function getHospitalityRevenueStats(listingId?: string) {
  const where = listingId ? { listingId } : {};
  const lines = await prisma.bnhubBookingService.findMany({
    where: { ...where, status: { in: ["CONFIRMED", "COMPLETED", "IN_PROGRESS"] } },
    select: { totalPriceCents: true },
  });
  const total = lines.reduce((s, l) => s + l.totalPriceCents, 0);
  return { lineCount: lines.length, totalAddOnCents: total };
}

export async function getTopServices(take = 10) {
  return prisma.bnhubBookingService.groupBy({
    by: ["serviceId"],
    _sum: { totalPriceCents: true },
    _count: { id: true },
    orderBy: { _sum: { totalPriceCents: "desc" } },
    take,
  });
}

export async function getTopBundles(take = 10) {
  return prisma.bnhubBookingBundle.groupBy({
    by: ["bundleId"],
    _sum: { totalPriceCents: true },
    _count: { id: true },
    orderBy: { _sum: { totalPriceCents: "desc" } },
    take,
  });
}

export async function getMembershipConversionStats() {
  const [plans, members] = await Promise.all([
    prisma.bnhubMembershipPlan.count({ where: { isActive: true } }),
    prisma.bnhubUserMembership.count({ where: { membershipStatus: "ACTIVE" } }),
  ]);
  return { activePlans: plans, activeMemberships: members };
}

export async function getConciergeAcceptanceStats() {
  const escalated = await prisma.bnhubConciergeSession.count({ where: { sessionStatus: "ESCALATED" } });
  const closed = await prisma.bnhubConciergeSession.count({ where: { sessionStatus: "CLOSED" } });
  return { escalated, closed };
}
