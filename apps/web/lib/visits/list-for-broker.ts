import { prisma } from "@/lib/db";

export async function listVisitDataForBrokerDashboard(brokerUserId: string) {
  const now = new Date();

  const [pendingRequests, upcomingVisits, pastVisits] = await Promise.all([
    prisma.lecipmVisitRequest.findMany({
      where: { brokerUserId, status: "pending" },
      orderBy: { requestedStart: "asc" },
      include: {
        listing: { select: { id: true, title: true, listingCode: true } },
      },
    }),
    prisma.lecipmVisit.findMany({
      where: { brokerUserId, status: "scheduled", startDateTime: { gte: now } },
      orderBy: { startDateTime: "asc" },
      include: {
        listing: { select: { id: true, title: true, listingCode: true } },
        visitRequest: { select: { id: true, leadId: true } },
      },
    }),
    prisma.lecipmVisit.findMany({
      where: {
        brokerUserId,
        OR: [
          { status: { in: ["completed", "cancelled", "no_show"] } },
          { status: "scheduled", startDateTime: { lt: now } },
        ],
      },
      orderBy: { startDateTime: "desc" },
      take: 80,
      include: {
        listing: { select: { id: true, title: true, listingCode: true } },
        visitRequest: { select: { id: true, leadId: true } },
      },
    }),
  ]);

  return { pendingRequests, upcomingVisits, pastVisits };
}
