import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateCapitalAllocationPlan } from "./capital-allocator.service";

export async function generateAndStoreCapitalPlan(params: {
  scopeType: string;
  scopeId: string;
  totalBudget: number;
  reservePct?: number;
  periodLabel?: string;
  notes?: string;
}) {
  const result = await generateCapitalAllocationPlan(params);

  const plan = await prisma.capitalAllocationPlan.create({
    data: {
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      totalBudget: result.totalBudget,
      allocatableBudget: result.allocatableBudget,
      reserveBudget: result.reserveBudget,
      periodLabel: params.periodLabel ?? "monthly",
      notes: params.notes ?? null,
      status: "draft",
      items: {
        create: result.items.map((item) => ({
          listingId: item.listingId,
          allocationType: item.allocationType,
          allocatedAmount: item.allocatedAmount,
          recommendedAmount: item.recommendedAmount,
          priorityScore: item.priorityScore,
          expectedImpactScore: item.expectedImpactScore,
          confidenceScore: item.confidenceScore,
          rationaleJson: item.rationale as unknown as Prisma.InputJsonValue,
          metricsJson: item.metrics as unknown as Prisma.InputJsonValue,
          status: "recommended",
        })),
      },
    },
    include: {
      items: true,
    },
  });

  await prisma.capitalAllocationLog.create({
    data: {
      planId: plan.id,
      eventType: "generated",
      message: "Capital allocation plan generated from BNHub listing KPIs and internal recommendation/outcome signals.",
      meta: {
        totalBudget: result.totalBudget,
        reserveBudget: result.reserveBudget,
        itemCount: result.items.length,
      } as Prisma.InputJsonValue,
    },
  });

  return plan;
}
