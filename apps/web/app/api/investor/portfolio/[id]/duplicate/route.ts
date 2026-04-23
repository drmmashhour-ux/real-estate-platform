import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const src = await prisma.portfolioScenario.findFirst({
    where: { id, userId },
    include: { items: true },
  });
  if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shareToken = randomUUID().replace(/-/g, "").slice(0, 32);

  const scenario = await prisma.portfolioScenario.create({
    data: {
      userId,
      investorProfileId: src.investorProfileId,
      title: `${src.title} (copy)`.slice(0, 200),
      strategy: src.strategy,
      scenarioKind: src.scenarioKind,
      totalBudgetCents: src.totalBudgetCents,
      totalDownPaymentCents: src.totalDownPaymentCents,
      projectedMonthlyCashFlowCents: src.projectedMonthlyCashFlowCents,
      projectedAnnualCashFlowCents: src.projectedAnnualCashFlowCents,
      projectedAverageRoiPercent: src.projectedAverageRoiPercent,
      projectedAverageCapRate: src.projectedAverageCapRate,
      projectedRiskLevel: src.projectedRiskLevel,
      projectedDiversificationScore: src.projectedDiversificationScore,
      insightsJson: src.insightsJson ?? undefined,
      shareToken,
      items: {
        create: src.items.map((it) => ({
          listingId: it.listingId,
          purchasePriceCents: it.purchasePriceCents,
          estimatedRentCents: it.estimatedRentCents,
          projectedRoiPercent: it.projectedRoiPercent,
          projectedCapRate: it.projectedCapRate,
          projectedCashFlowCents: it.projectedCashFlowCents,
          city: it.city,
          propertyType: it.propertyType,
          riskLevel: it.riskLevel,
          marketTrend: it.marketTrend,
          fitScore: it.fitScore,
          strengthSummary: it.strengthSummary,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ ok: true, scenario, label: "estimate" });
}
