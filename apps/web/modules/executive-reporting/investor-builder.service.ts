import { prisma } from "@/lib/db";
import type { DataSourceTrace, InvestorSection, TracedNumber } from "./executive-report.types";
import { parsePeriodKey } from "./period-key";

function trace(tables: string[], description: string, partialDataNote?: string): DataSourceTrace {
  return partialDataNote ? { tables, description, partialDataNote } : { tables, description };
}

function num(value: number | null, t: DataSourceTrace): TracedNumber {
  return { value, trace: t };
}

export async function buildInvestorSection(periodKey: string): Promise<InvestorSection> {
  const parsed = parsePeriodKey(periodKey);
  const assumptions: string[] = [
    "`expectedROI` is a stored field on `InvestmentOpportunity` snapshots, not a performance guarantee.",
    "Capital stack sums aggregate engineering inputs; currency and completeness are not validated here.",
  ];

  if (!parsed) {
    return emptyInvestor(assumptions, "Invalid periodKey.");
  }

  const { startUtc, endUtcExclusive } = parsed;

  try {
    const [opps, stacks] = await Promise.all([
      prisma.investmentOpportunity.findMany({
        where: { createdAt: { gte: startUtc, lt: endUtcExclusive } },
        select: { expectedROI: true, riskLevel: true, recommendedInvestmentMajor: true },
      }),
      prisma.investmentPipelineCapitalStack.findMany({
        where: { pipelineDeal: { status: "ACTIVE", closedAt: null } },
        select: {
          totalCapitalRequired: true,
          seniorDebtTarget: true,
          mezzanineTarget: true,
          preferredEquityTarget: true,
          commonEquityTarget: true,
        },
      }),
    ]);

    const riskLevelCounts: Record<string, number> = {};
    let roiSum = 0;
    for (const o of opps) {
      riskLevelCounts[o.riskLevel] = (riskLevelCounts[o.riskLevel] ?? 0) + 1;
      roiSum += o.expectedROI;
    }
    const meanRoi = opps.length ? roiSum / opps.length : null;

    let totalCapital = 0;
    let senior = 0;
    let mezz = 0;
    let pref = 0;
    let common = 0;
    let withAny = 0;
    for (const s of stacks) {
      const has =
        s.totalCapitalRequired != null ||
        s.seniorDebtTarget != null ||
        s.mezzanineTarget != null ||
        s.preferredEquityTarget != null ||
        s.commonEquityTarget != null;
      if (!has) continue;
      withAny += 1;
      if (s.totalCapitalRequired != null) totalCapital += s.totalCapitalRequired;
      if (s.seniorDebtTarget != null) senior += s.seniorDebtTarget;
      if (s.mezzanineTarget != null) mezz += s.mezzanineTarget;
      if (s.preferredEquityTarget != null) pref += s.preferredEquityTarget;
      if (s.commonEquityTarget != null) common += s.commonEquityTarget;
    }

    const expansionNotes: string[] = [];
    const highRisk = riskLevelCounts["HIGH"] ?? 0;
    const lowRisk = riskLevelCounts["LOW"] ?? 0;
    if (opps.length && highRisk > lowRisk) {
      expansionNotes.push(
        `Period opportunity snapshots skew toward HIGH risk (${highRisk} vs LOW ${lowRisk}); review concentration before scaling.`
      );
    }
    if (withAny === 0) {
      expansionNotes.push("No active capital stack rows with numeric targets; expansion sizing is not summarized from stacks.");
    }

    return {
      opportunityCountInPeriod: num(
        opps.length,
        trace(["InvestmentOpportunity"], "Rows created in reporting period.")
      ),
      meanExpectedRoiPercent: num(
        meanRoi != null ? Math.round(meanRoi * 100) / 100 : null,
        trace(
          ["InvestmentOpportunity"],
          "Unweighted mean of expectedROI for opportunities created in period.",
          opps.length < 5 ? "Few opportunity rows; mean may be noisy." : undefined
        )
      ),
      riskLevelCounts,
      capitalStackTotals: {
        totalCapitalRequiredSum: withAny ? totalCapital : null,
        seniorDebtSum: withAny ? senior : null,
        mezzanineSum: withAny ? mezz : null,
        preferredEquitySum: withAny ? pref : null,
        commonEquitySum: withAny ? common : null,
        dealsWithStack: withAny,
        trace: trace(
          ["InvestmentPipelineCapitalStack", "InvestmentPipelineDeal"],
          "Sums of stack targets for ACTIVE non-closed pipeline deals (partial rows included when any target is non-null)."
        ),
      },
      expansionNotes,
      assumptions,
    };
  } catch {
    return emptyInvestor(assumptions, "Investor section queries failed.");
  }
}

function emptyInvestor(assumptions: string[], err: string): InvestorSection {
  const z = trace([], err);
  return {
    opportunityCountInPeriod: { value: null, trace: z },
    meanExpectedRoiPercent: { value: null, trace: z },
    riskLevelCounts: {},
    capitalStackTotals: {
      totalCapitalRequiredSum: null,
      seniorDebtSum: null,
      mezzanineSum: null,
      preferredEquitySum: null,
      commonEquitySum: null,
      dealsWithStack: 0,
      trace: z,
    },
    expansionNotes: [],
    assumptions: [...assumptions, err],
  };
}
