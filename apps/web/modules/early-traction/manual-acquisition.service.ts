import { prisma } from "@/lib/db";

export type ManualAcquisitionPipeline = {
  generatedAt: string;
  hostPipelineOpen: number;
  hostPipelineByStatus: { status: string; count: number }[];
  investorContactsOpen: number;
  nextActions: string[];
  disclaimers: string[];
};

/**
 * Operational queues that support manual acquisition (not automated spam).
 */
export async function buildManualAcquisitionSnapshot(): Promise<ManualAcquisitionPipeline> {
  const [statusGroups, investorTotal] = await Promise.all([
    prisma.bnhubHostPipelineEntry.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.bnhubInvestorContact.count(),
  ]);

  const terminal = new Set(["converted", "lost", "closed", "won"]);
  const hostPipelineOpen = statusGroups
    .filter((s) => !terminal.has(s.status.toLowerCase()))
    .reduce((a, s) => a + s._count._all, 0);

  const hostPipelineByStatus = statusGroups.map((s) => ({
    status: s.status,
    count: s._count._all,
  }));

  const nextActions: string[] = [
    "Review BNHub host pipeline rows in admin CRM before bulk outreach.",
    "Sync investor contact status after real conversations (no fabricated conversion).",
  ];

  return {
    generatedAt: new Date().toISOString(),
    hostPipelineOpen,
    hostPipelineByStatus,
    investorContactsOpen: investorTotal,
    nextActions,
    disclaimers: [
      "Pipeline counts are internal CRM rows; they do not imply revenue or signed hosts until deals exist.",
    ],
  };
}
