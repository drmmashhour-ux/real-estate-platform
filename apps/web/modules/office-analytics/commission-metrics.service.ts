import { prisma } from "@/lib/db";

export async function commissionCaseMetrics(officeId: string, since: Date) {
  const [open, approved, disputed] = await Promise.all([
    prisma.brokerageCommissionCase.count({
      where: {
        officeId,
        status: { in: ["draft", "calculated", "pending_review"] },
        updatedAt: { gte: since },
      },
    }),
    prisma.brokerageCommissionCase.count({
      where: { officeId, status: "approved", updatedAt: { gte: since } },
    }),
    prisma.brokerageCommissionCase.count({
      where: { officeId, status: "disputed", updatedAt: { gte: since } },
    }),
  ]);
  return { openPipeline: open, approved, disputed };
}
