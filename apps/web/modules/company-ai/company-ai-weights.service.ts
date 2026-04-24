import { prisma } from "@/lib/db";

/**
 * Soft hints for ranking / portfolio / recommendation systems — only `ROLLED_OUT` + `APPROVED` events.
 * Callers must still respect legal boundary and human approval gates for binding actions.
 */
export async function getApprovedCompanyAdaptationHints(): Promise<
  Array<{
    id: string;
    domain: string;
    adaptationType: string;
    proposedStateJson: unknown;
    confidenceScore: number;
    approvedAt: Date | null;
  }>
> {
  const rows = await prisma.companyAdaptationEvent.findMany({
    where: { status: { in: ["ROLLED_OUT", "APPROVED"] } },
    orderBy: { approvedAt: "desc" },
    take: 24,
    select: {
      id: true,
      domain: true,
      adaptationType: true,
      proposedStateJson: true,
      confidenceScore: true,
      approvedAt: true,
    },
  });
  return rows;
}
