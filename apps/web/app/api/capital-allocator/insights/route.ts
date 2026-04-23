import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildPortfolioInsights } from "@/modules/capital-allocator/capital-portfolio-insight.service";
import type { AllocationPlanResult } from "@/modules/capital-allocator/capital-allocator.types";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const latestPlan = await prisma.capitalAllocationPlan.findFirst({
    where: { scopeId: userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (!latestPlan) {
    return NextResponse.json({ error: "No plan found" }, { status: 404 });
  }

  // Convert DB plan to AllocationPlanResult type
  const planResult: AllocationPlanResult = {
    totalBudget: latestPlan.totalBudget,
    allocatableBudget: latestPlan.allocatableBudget,
    reserveBudget: latestPlan.reserveBudget,
    items: latestPlan.items.map((i) => ({
      listingId: i.listingId,
      listingTitle: (i.metricsJson as any)?.listingTitle ?? i.listingId,
      allocationType: i.allocationType as any,
      priorityScore: i.priorityScore,
      expectedImpactScore: i.expectedImpactScore,
      confidenceScore: i.confidenceScore,
      recommendedAmount: i.recommendedAmount,
      rationale: (i.rationaleJson as string[]) ?? [],
      metrics: (i.metricsJson as any) ?? {},
      allocatedAmount: i.allocatedAmount,
    })),
  };

  const insights = buildPortfolioInsights(planResult);
  return NextResponse.json({ insights });
}
