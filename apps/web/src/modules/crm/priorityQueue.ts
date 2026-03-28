import { prisma } from "@/lib/db";

export type PriorityLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  intentScore: number;
  priorityScore: number;
  executionStage: string;
  nextBestAction: string | null;
  lastActivityAt: Date | null;
  updatedAt: Date;
  shortTermListingId: string | null;
  listingCode: string | null;
};

/**
 * TOP USERS TO ACT ON NOW — sorted by priorityScore DESC, then recency.
 */
export async function getTopPriorityLeads(limit = 20): Promise<PriorityLeadRow[]> {
  const rows = await prisma.lead.findMany({
    where: {
      executionStage: { notIn: ["lost", "closed"] },
    },
    orderBy: [{ priorityScore: "desc" }, { lastActivityAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      intentScore: true,
      priorityScore: true,
      executionStage: true,
      nextBestAction: true,
      lastActivityAt: true,
      updatedAt: true,
      shortTermListingId: true,
      listingCode: true,
    },
  });
  return rows;
}
