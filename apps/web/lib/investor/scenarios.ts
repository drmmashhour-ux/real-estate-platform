import { prisma } from "@/lib/db";

export async function createInvestorScenario(input: {
  investorAnalysisCaseId: string;
  scenarioName: string;
  monthlyRentCents?: number;
  annualAppreciationRate?: number;
  exitYear?: number;
  saleCostRate?: number;
}) {
  const base = await prisma.investorAnalysisCase.findUnique({
    where: { id: input.investorAnalysisCaseId },
  });

  if (!base) throw new Error("INVESTOR_CASE_NOT_FOUND");

  const years = input.exitYear ?? 5;
  const appreciation = input.annualAppreciationRate ?? 0;
  const saleCostRate = input.saleCostRate ?? 0.05;
  const baseValue = base.purchasePriceCents ?? 0;

  const projectedValueCents = Math.round(baseValue * Math.pow(1 + appreciation, years));

  const saleCosts = Math.round(projectedValueCents * saleCostRate);
  const projectedProfitCents = projectedValueCents - saleCosts - baseValue;

  const projectedROI = baseValue > 0 ? projectedProfitCents / baseValue : 0;

  return prisma.investorScenario.create({
    data: {
      investorAnalysisCaseId: input.investorAnalysisCaseId,
      scenarioName: input.scenarioName,
      monthlyRentCents: input.monthlyRentCents ?? null,
      annualAppreciationRate: input.annualAppreciationRate ?? null,
      exitYear: input.exitYear ?? null,
      saleCostRate: input.saleCostRate ?? null,
      projectedValueCents,
      projectedProfitCents,
      projectedROI,
    },
  });
}
