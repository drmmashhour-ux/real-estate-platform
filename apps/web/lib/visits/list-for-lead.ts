import { prisma } from "@/lib/db";

export async function listVisitsForLead(leadId: string, brokerUserId: string) {
  const [requests, visits] = await Promise.all([
    prisma.lecipmVisitRequest.findMany({
      where: { leadId, brokerUserId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, listingCode: true } },
        visit: { select: { id: true, status: true, startDateTime: true, endDateTime: true } },
      },
    }),
    prisma.lecipmVisit.findMany({
      where: { leadId, brokerUserId },
      orderBy: { startDateTime: "desc" },
      include: { listing: { select: { id: true, title: true, listingCode: true } } },
    }),
  ]);
  return { requests, visits };
}
