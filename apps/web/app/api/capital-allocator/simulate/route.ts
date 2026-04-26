import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { simulateCapitalScenario } from "@/modules/capital-allocator/capital-scenario.service";
import type { AllocationPlanResult } from "@/modules/capital-allocator/capital-allocator.types";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { additionalBudget, reallocationStrategy } = body;

  const latestPlan = await prisma.capitalAllocationPlan.findFirst({
    where: { scopeId: userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (!latestPlan) {
    return NextResponse.json({ error: "No plan found" }, { status: 404 });
  }

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

  const simulation = simulateCapitalScenario(planResult, {
    additionalBudget: additionalBudget ?? 0,
    reallocationStrategy: reallocationStrategy ?? "balanced",
  });

  return NextResponse.json({ simulation });
}
