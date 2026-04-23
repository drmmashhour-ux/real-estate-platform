import { prisma } from "@/lib/db";
import { computePropertyScore, classifyProperty } from "@/lib/investor/ranking";
import { computeRiskLevel } from "@/lib/investor/risk";

export async function rankPortfolioProperties(portfolioId: string) {
  const properties = await prisma.portfolioProperty.findMany({
    where: { portfolioId },
  });

  for (const p of properties) {
    const cf = p.monthlyCashflowCents ?? 0;
    const d = p.dscr ?? 0;
    const riskLevel = computeRiskLevel(d, cf);

    const score = computePropertyScore({
      capRate: p.capRate,
      roi: p.roiPercent,
      cashflow: cf,
      dscr: d,
      neighborhoodScore: p.neighborhoodScore,
      risk: riskLevel === "high" ? 20 : riskLevel === "medium" ? 10 : 0,
    });

    await prisma.portfolioProperty.update({
      where: { id: p.id },
      data: {
        rankingScore: score,
        rankingLabel: classifyProperty(score),
        riskLevel,
      },
    });
  }
}
