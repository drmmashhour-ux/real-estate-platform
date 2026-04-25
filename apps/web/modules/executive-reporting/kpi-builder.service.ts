import { prisma } from "@/lib/db";
import type { DataSourceTrace, KpiSection, TracedNumber } from "./executive-report.types";
import { parsePeriodKey, previousPeriodBounds } from "./period-key";

function trace(tables: string[], description: string, partialDataNote?: string): DataSourceTrace {
  return partialDataNote ? { tables, description, partialDataNote } : { tables, description };
}

function num(value: number | null, t: DataSourceTrace): TracedNumber {
  return { value, trace: t };
}

const FAVORABLE = /^(APPROVE|INVEST|COMMIT|BUY|PROCEED)/i;
const UNFAVORABLE = /^(REJECT|DECLINE|DECLINED|PASS|NO_GO|DENY)/i;

export async function buildKpiSection(periodKey: string): Promise<KpiSection> {
  const parsed = parsePeriodKey(periodKey);
  if (!parsed) {
    return emptyKpi(periodKey, "Invalid periodKey (expected YYYY-MM or YYYY-Www).");
  }

  const { startUtc, endUtcExclusive } = parsed;
  const assumptions: string[] = [
    "All counts use UTC half-open windows [start, end).",
    "Pipeline metrics refer to `InvestmentPipelineDeal` / IC workflow, not necessarily transactional `Deal` closings.",
    "Committee favorable rate uses string pattern matching on `recommendation`; atypical labels are excluded from the ratio.",
  ];

  try {
    const [
      leadsCreated,
      pipelineCreated,
      pipelineClosed,
      decisions,
      stacks,
      closedDeals,
      leadsForConversion,
    ] = await Promise.all([
      prisma.lead.count({
        where: { createdAt: { gte: startUtc, lt: endUtcExclusive } },
      }),
      prisma.investmentPipelineDeal.count({
        where: { createdAt: { gte: startUtc, lt: endUtcExclusive } },
      }),
      prisma.investmentPipelineDeal.count({
        where: { closedAt: { gte: startUtc, lt: endUtcExclusive } },
      }),
      prisma.investmentPipelineCommitteeDecision.findMany({
        where: { createdAt: { gte: startUtc, lt: endUtcExclusive } },
        select: { recommendation: true },
      }),
      prisma.investmentPipelineCapitalStack.findMany({
        where: {
          pipelineDeal: { status: "ACTIVE", closedAt: null },
          totalCapitalRequired: { not: null },
        },
        select: { totalCapitalRequired: true },
      }),
      prisma.investmentPipelineDeal.findMany({
        where: { closedAt: { gte: startUtc, lt: endUtcExclusive } },
        select: { createdAt: true, closedAt: true },
      }),
      prisma.lead.findMany({
        where: { createdAt: { gte: startUtc, lt: endUtcExclusive } },
        select: { pipelineStatus: true },
      }),
    ]);

    let favorable = 0;
    let unfavorable = 0;
    for (const d of decisions) {
      const r = d.recommendation.trim();
      if (FAVORABLE.test(r)) favorable += 1;
      else if (UNFAVORABLE.test(r)) unfavorable += 1;
    }
    const denom = favorable + unfavorable;
    const committeeRate = denom > 0 ? favorable / denom : null;

    let pipelineSum = 0;
    for (const s of stacks) {
      if (s.totalCapitalRequired != null) pipelineSum += s.totalCapitalRequired;
    }

    let cycleSum = 0;
    for (const d of closedDeals) {
      if (d.closedAt) {
        cycleSum += (d.closedAt.getTime() - d.createdAt.getTime()) / 86400000;
      }
    }
    const avgCycle = closedDeals.length ? cycleSum / closedDeals.length : null;

    let contacted = 0;
    let won = 0;
    for (const l of leadsForConversion) {
      const ps = (l.pipelineStatus || "").toLowerCase();
      if (ps && ps !== "new") contacted += 1;
      if (ps === "won") won += 1;
    }
    const leadDenom = leadsForConversion.length;
    const contactedRate = leadDenom ? contacted / leadDenom : null;
    const wonRate = leadDenom ? won / leadDenom : null;

    return {
      periodKey,
      range: { startUtc: startUtc.toISOString(), endUtcExclusive: endUtcExclusive.toISOString() },
      leadsCreated: num(
        leadsCreated,
        trace(["Lead"], "Count rows with createdAt in period (CRM / growth leads).")
      ),
      pipelineDealsCreated: num(
        pipelineCreated,
        trace(["InvestmentPipelineDeal"], "New IC pipeline deals opened in period.")
      ),
      pipelineDealsClosedInPeriod: num(
        pipelineClosed,
        trace(
          ["InvestmentPipelineDeal"],
          "Deals with closedAt timestamp in period (operational close marker)."
        )
      ),
      committeeFavorableRate: num(
        committeeRate,
        trace(
          ["InvestmentPipelineCommitteeDecision"],
          "favorable / (favorable + unfavorable) where labels match APPROVE/REJECT-style prefixes.",
          denom < 5 ? "Low decision count in period; interpret ratio cautiously." : undefined
        )
      ),
      pipelineCapitalRequiredSum: num(
        stacks.length ? pipelineSum : null,
        trace(
          ["InvestmentPipelineCapitalStack", "InvestmentPipelineDeal"],
          "Sum of totalCapitalRequired for ACTIVE, non-closed deals with non-null stack totals.",
          stacks.length === 0 ? "No capital stack rows with totals for active deals." : undefined
        )
      ),
      avgPipelineCloseCycleDays: num(
        avgCycle != null ? Math.round(avgCycle * 10) / 10 : null,
        trace(
          ["InvestmentPipelineDeal"],
          "Mean(closedAt - createdAt) in days for deals closed in period.",
          closedDeals.length < 3 ? "Few closed deals; average may be unstable." : undefined
        )
      ),
      leadContactedOrBeyondRate: num(
        contactedRate,
        trace(
          ["Lead"],
          "Among leads created in period, share with pipelineStatus other than 'new'."
        )
      ),
      leadWonAmongCreatedRate: num(
        wonRate,
        trace(
          ["Lead"],
          "Among leads created in period, share with pipelineStatus 'won'."
        )
      ),
      assumptions,
    };
  } catch {
    return emptyKpi(periodKey, "KPI queries failed; stored metrics may be partial.");
  }
}

function emptyKpi(periodKey: string, note: string): KpiSection {
  const z = trace([], note);
  const nullNum = (): TracedNumber => ({ value: null, trace: z });
  return {
    periodKey,
    range: { startUtc: "", endUtcExclusive: "" },
    leadsCreated: nullNum(),
    pipelineDealsCreated: nullNum(),
    pipelineDealsClosedInPeriod: nullNum(),
    committeeFavorableRate: nullNum(),
    pipelineCapitalRequiredSum: nullNum(),
    avgPipelineCloseCycleDays: nullNum(),
    leadContactedOrBeyondRate: nullNum(),
    leadWonAmongCreatedRate: nullNum(),
    assumptions: [note],
  };
}

/** Optional: compare raw counts vs previous period for dashboards */
export async function kpiPeriodComparisonCounts(periodKey: string): Promise<{
  leadsDelta: number | null;
  pipelineCreatedDelta: number | null;
} | null> {
  const parsed = parsePeriodKey(periodKey);
  if (!parsed) return null;
  const prev = previousPeriodBounds(parsed);
  try {
    const [curLeads, prevLeads, curP, prevP] = await Promise.all([
      prisma.lead.count({
        where: { createdAt: { gte: parsed.startUtc, lt: parsed.endUtcExclusive } },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: prev.startUtc, lt: prev.endUtcExclusive } },
      }),
      prisma.investmentPipelineDeal.count({
        where: { createdAt: { gte: parsed.startUtc, lt: parsed.endUtcExclusive } },
      }),
      prisma.investmentPipelineDeal.count({
        where: { createdAt: { gte: prev.startUtc, lt: prev.endUtcExclusive } },
      }),
    ]);
    return { leadsDelta: curLeads - prevLeads, pipelineCreatedDelta: curP - prevP };
  } catch {
    return null;
  }
}
