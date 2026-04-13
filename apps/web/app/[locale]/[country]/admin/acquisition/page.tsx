import { prisma } from "@/lib/db";
import { AcquisitionBoardClient } from "./acquisition-board-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAcquisitionPage() {
  const leads = await prisma.listingAcquisitionLead.findMany({
    orderBy: { updatedAt: "desc" },
    take: 500,
    include: {
      assignedTo: { select: { email: true, name: true } },
      linkedFsboListing: { select: { id: true, listingCode: true, status: true } },
      linkedShortTermListing: { select: { id: true, listingCode: true, listingStatus: true } },
    },
  });

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);

  const [newToday, awaitingAssets, readyForReview, publishedWeek] = await Promise.all([
    prisma.listingAcquisitionLead.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.listingAcquisitionLead.count({ where: { intakeStatus: "AWAITING_ASSETS" } }),
    prisma.listingAcquisitionLead.count({ where: { intakeStatus: "READY_FOR_REVIEW" } }),
    prisma.listingAcquisitionLead.count({
      where: { intakeStatus: "PUBLISHED", updatedAt: { gte: weekStart } },
    }),
  ]);

  const serialized = JSON.parse(JSON.stringify(leads)) as Parameters<typeof AcquisitionBoardClient>[0]["initialLeads"];

  return (
    <AcquisitionBoardClient
      initialLeads={serialized}
      metrics={{
        newToday,
        awaitingAssets,
        readyForReview,
        publishedThisWeek: publishedWeek,
      }}
    />
  );
}
