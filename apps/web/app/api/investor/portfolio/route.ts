import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** GET — list scenarios for current user */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.portfolioScenario.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { items: true },
  });
  return NextResponse.json({ scenarios: rows, label: "estimate" });
}

type SaveBody = {
  title: string;
  scenarioKind?: string;
  investorProfileId?: string | null;
  totalBudgetCents?: number;
  totalDownPaymentCents?: number;
  projectedMonthlyCashFlowCents?: number;
  projectedAnnualCashFlowCents?: number;
  projectedAverageRoiPercent?: number;
  projectedAverageCapRate?: number;
  projectedRiskLevel?: string | null;
  projectedDiversificationScore?: number | null;
  insightsJson?: unknown;
  items: Array<{
    listingId: string;
    purchasePriceCents: number;
    estimatedRentCents?: number | null;
    projectedRoiPercent?: number | null;
    projectedCapRate?: number | null;
    projectedCashFlowCents?: number | null;
    city?: string | null;
    propertyType?: string | null;
    riskLevel?: string | null;
    marketTrend?: string | null;
    fitScore?: number | null;
    strengthSummary?: string | null;
  }>;
};

/** POST — save scenario */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as SaveBody | null;
  if (!body?.title || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "title and items required" }, { status: 400 });
  }

  const shareToken = randomUUID().replace(/-/g, "").slice(0, 32);

  const scenario = await prisma.portfolioScenario.create({
    data: {
      userId,
      investorProfileId: body.investorProfileId ?? undefined,
      title: body.title.slice(0, 200),
      scenarioKind: body.scenarioKind ?? "custom",
      totalBudgetCents: body.totalBudgetCents ?? 0,
      totalDownPaymentCents: body.totalDownPaymentCents ?? 0,
      projectedMonthlyCashFlowCents: body.projectedMonthlyCashFlowCents ?? 0,
      projectedAnnualCashFlowCents: body.projectedAnnualCashFlowCents ?? 0,
      projectedAverageRoiPercent: body.projectedAverageRoiPercent ?? 0,
      projectedAverageCapRate: body.projectedAverageCapRate ?? 0,
      projectedRiskLevel: body.projectedRiskLevel ?? null,
      projectedDiversificationScore: body.projectedDiversificationScore ?? null,
      insightsJson: body.insightsJson ?? undefined,
      shareToken,
      items: {
        create: body.items.map((it) => ({
          listingId: it.listingId,
          purchasePriceCents: it.purchasePriceCents,
          estimatedRentCents: it.estimatedRentCents ?? null,
          projectedRoiPercent: it.projectedRoiPercent ?? null,
          projectedCapRate: it.projectedCapRate ?? null,
          projectedCashFlowCents: it.projectedCashFlowCents ?? null,
          city: it.city ?? null,
          propertyType: it.propertyType ?? "Residential",
          riskLevel: it.riskLevel ?? null,
          marketTrend: it.marketTrend ?? null,
          fitScore: it.fitScore ?? null,
          strengthSummary: it.strengthSummary?.slice(0, 4000) ?? null,
        })),
      },
    },
    include: { items: true },
  });

  void prisma.toolUsageEvent
    .create({
      data: {
        toolKey: "investor_portfolio",
        eventType: "scenario_saved",
        userId,
        payloadJson: { scenarioId: scenario.id },
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true, scenario, shareUrl: `/invest/portfolio?share=${shareToken}`, label: "estimate" });
}
