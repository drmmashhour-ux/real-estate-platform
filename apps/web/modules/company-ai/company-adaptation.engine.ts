import type { CompanyAdaptationType, CompanyStrategyDomain } from "@prisma/client";
import { prisma } from "@/lib/db";
import { COMPANY_AI_BOUNDS, applyWeightDeltaCap, clampNumber } from "./company-ai-bounds";
import { logCompanyAiAudit } from "./company-ai-audit.service";
import { routeCompanyAdaptation } from "./company-adaptation-routing.service";
import type { CompanyMetricsSnapshot } from "./company-outcome-aggregator.service";
import { detectCompanyPatterns, type DetectedPattern } from "./company-pattern-detection.engine";
import { upsertPlaybookFromPatterns } from "./company-playbook-memory.service";

function mapSuggestedTypeToEnum(t: string): CompanyAdaptationType {
  switch (t) {
    case "WEIGHT_SHIFT":
      return "WEIGHT_SHIFT";
    case "PRIORITY_SHIFT":
      return "PRIORITY_SHIFT";
    case "SEGMENT_FOCUS_CHANGE":
      return "SEGMENT_FOCUS_CHANGE";
    case "RISK_TIGHTENING":
      return "RISK_TIGHTENING";
    case "RESOURCE_REALLOCATION":
      return "RESOURCE_REALLOCATION";
    default:
      return "EXPERIMENT_RECOMMENDATION";
  }
}

async function rejectionPenaltyFactor(domain: CompanyStrategyDomain): Promise<number> {
  const since = new Date(Date.now() - 30 * 864e5);
  const rejected = await prisma.companyAdaptationEvent.count({
    where: { domain, status: "REJECTED", createdAt: { gte: since } },
  });
  return clampNumber(1 - rejected * COMPANY_AI_BOUNDS.rejectedAdaptationPenalty, 0.25, 1);
}

/**
 * Proposes bounded adaptations from latest metrics + patterns. Does not approve or execute.
 */
export async function generateCompanyAdaptations(): Promise<{
  patterns: DetectedPattern[];
  proposedIds: string[];
}> {
  const latestMonthly = await prisma.companyOutcomeWindow.findFirst({
    where: { periodType: "MONTHLY" },
    orderBy: { periodEnd: "desc" },
  });

  const openProposed = await prisma.companyAdaptationEvent.count({ where: { status: "PROPOSED" } });
  if (openProposed >= 25) {
    const metricsEarly = (latestMonthly?.metricsJson ?? null) as CompanyMetricsSnapshot | null;
    return { patterns: detectCompanyPatterns(metricsEarly), proposedIds: [] };
  }

  const metrics = (latestMonthly?.metricsJson ?? null) as CompanyMetricsSnapshot | null;
  const patterns = detectCompanyPatterns(metrics);
  await upsertPlaybookFromPatterns(patterns.slice(0, 8));

  const proposedIds: string[] = [];
  let n = 0;

  for (const p of patterns) {
    if (n >= COMPANY_AI_BOUNDS.maxAdaptationsPerReview) break;
    if (p.confidence < 0.08) continue;

    const adaptationType = mapSuggestedTypeToEnum(p.suggestedAdaptation.type);
    const domain = p.domains[0] ?? "GROWTH";
    const penalty = await rejectionPenaltyFactor(domain);
    const confidence = clampNumber(p.confidence * penalty, 0, 1);

    const baselineWeight = 1;
    const rawTarget =
      adaptationType === "RISK_TIGHTENING"
        ? baselineWeight - 0.08
        : adaptationType === "EXPERIMENT_RECOMMENDATION"
          ? baselineWeight + 0.04
          : baselineWeight + 0.06;
    const proposedWeight = applyWeightDeltaCap(baselineWeight, rawTarget);

    const route = routeCompanyAdaptation({ adaptationType, domain, confidenceScore: confidence });

    const row = await prisma.companyAdaptationEvent.create({
      data: {
        source: "EVOLUTION",
        adaptationType,
        domain,
        previousStateJson: {
          narrative: "Baseline operating weights before adaptation cycle.",
          weights: { opportunityRanking: baselineWeight },
          route,
        },
        proposedStateJson: {
          narrative: p.suggestedAdaptation.summary,
          weights: { opportunityRanking: proposedWeight },
          expectedEffect: p.suggestedAdaptation.expectedEffect,
          patternId: p.id,
          routing: route,
        },
        rationaleJson: {
          whatChanges: p.suggestedAdaptation.summary,
          why: p.statement,
          expectedEffect: p.suggestedAdaptation.expectedEffect,
          confidence,
          risk: route.requiresHumanApproval
            ? "High-impact or structural — requires explicit approval before rollout systems read weights."
            : "Lower-impact experiment — still visible in dashboard and audit trail.",
          evidence: p.evidence,
        },
        confidenceScore: confidence,
        status: "PROPOSED",
      },
    });

    proposedIds.push(row.id);
    n += 1;

    await logCompanyAiAudit({
      action: "adaptation_proposed",
      payload: {
        adaptationId: row.id,
        patternId: p.id,
        domain,
        adaptationType,
        confidence,
        requiresHumanApproval: route.requiresHumanApproval,
      },
    });

    await logCompanyAiAudit({
      action: "pattern_detected",
      payload: { patternId: p.id, confidence, domains: p.domains, statement: p.statement },
    });
  }

  return { patterns, proposedIds };
}
