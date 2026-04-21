import { prisma } from "@/lib/db";
import type { ClosingPipelineSummary } from "@/modules/closing/closing.types";
import { checklistItemCountsForClosing } from "@/modules/closing/closing.types";
import { evaluateFinalClosingReadiness } from "@/modules/closing/closing-orchestrator";

export async function getClosingPipelineSummaryForUser(userId: string): Promise<ClosingPipelineSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const where =
    user?.role === "ADMIN" ?
      {}
    : {
        OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
      };

  const deals = await prisma.deal.findMany({
    where,
    select: {
      id: true,
      dealCode: true,
      listingId: true,
      status: true,
      lecipmDealClosing: {
        select: {
          status: true,
          readinessStatus: true,
          closingDate: true,
        },
      },
    },
    take: 150,
    orderBy: { updatedAt: "desc" },
  });

  const inClosing = deals.filter(
    (d) => d.lecipmDealClosing && ["IN_PROGRESS", "READY_TO_CLOSE"].includes(d.lecipmDealClosing.status),
  );

  let readyToClose = 0;
  let blockedClosings = 0;
  let missingDocumentsCount = 0;
  let pendingSignaturesCount = 0;
  let checklistCompleteWeight = 0;
  let checklistTotalWeight = 0;
  const dealsAtRisk: ClosingPipelineSummary["dealsAtRisk"] = [];

  for (const d of inClosing) {
    const r = await evaluateFinalClosingReadiness(d.id);
    if (r.readinessStatus === "READY") readyToClose += 1;
    if (r.blockers.length > 0) {
      blockedClosings += 1;
      if (r.readinessStatus === "NOT_READY") {
        dealsAtRisk.push({
          dealId: d.id,
          title: d.dealCode ?? d.id.slice(0, 8),
          reason: r.blockers[0] ?? "Blocked",
        });
      }
    }

    const docs = await prisma.dealClosingDocument.findMany({
      where: { dealId: d.id },
      select: { required: true, status: true },
    });
    missingDocumentsCount += docs.filter((x) => x.required && x.status !== "VERIFIED").length;

    const pendingSigs = await prisma.dealClosingSignature.count({
      where: { dealId: d.id, required: true, status: { not: "SIGNED" } },
    });
    pendingSignaturesCount += pendingSigs;

    const items = await prisma.dealClosingChecklist.findMany({
      where: { dealId: d.id },
      select: { status: true, priority: true },
    });
    const applicable = items.filter((i) => checklistItemCountsForClosing(i.priority));
    checklistTotalWeight += Math.max(applicable.length, 1) * 3;
    checklistCompleteWeight += applicable.filter((i) => i.status === "COMPLETE").length * 3;
  }

  const checklistCompletionRate =
    checklistTotalWeight === 0 ? 0 : Math.round((checklistCompleteWeight / checklistTotalWeight) * 100);

  return {
    totalClosingDeals: inClosing.length,
    readyToClose,
    blockedClosings,
    missingDocumentsCount,
    pendingSignaturesCount,
    checklistCompletionRate,
    dealsAtRisk,
  };
}
