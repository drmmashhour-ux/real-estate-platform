/**
 * Strategic insight synthesis — **advisory only**; all statements trace to `signals` / internal metrics.
 */
import { generateStrategicRecommendations } from "@/modules/ai-ceo/ai-ceo.engine";
import type {
  AiCeoInsightsPackage,
  AiCeoPrioritizedSet,
  AiCeoRecommendationDraft,
  AiCeoSignalRef,
  AiCeoStrategicAlert,
  AiCeoStrategicContext,
  AiCeoStrategicInsightBlock,
  AiCeoStrategicInsights,
} from "@/modules/ai-ceo/ai-ceo.types";
import { prioritizeRecommendations } from "@/modules/ai-ceo/prioritization.engine";
import { buildStrategicContext } from "@/modules/ai-ceo/context.builder";

function sig(id: string, label: string, value: string | number | boolean | null, source: string): AiCeoSignalRef {
  return { id, label, value, source };
}

/**
 * Rule-based alerts from internal series only (thresholds are explicit, not inferred from “market”).
 */
export function detectStrategicAlerts(context: AiCeoStrategicContext): AiCeoStrategicAlert[] {
  const alerts: AiCeoStrategicAlert[] = [];

  const mom = context.revenueInternal.monthOverMonth;
  if (mom != null && mom < -0.05) {
    alerts.push({
      type: "REVENUE_DROP",
      severity: mom < -0.12 ? "critical" : "high",
      title: "Internal MRR snapshot downtrend",
      message: `Latest vs prior revenue snapshot: ~${(mom * 100).toFixed(1)}% change (platform MRR rows only).`,
      reasoning:
        "Computed as (latest MRR − previous MRR) / previous MRR from `revenueSnapshot` — not audited accounting.",
      signals: [
        sig("rev.mom", "Month-over-month MRR proxy", mom, "revenue_snapshot"),
        sig("rev.latest", "Latest MRR", context.revenueInternal.mrrLatest, "revenue_snapshot"),
      ],
    });
  }

  const conv = context.revenue?.conversionProxy;
  const leads = context.lecipm.seniorLeads30d ?? 0;
  if (conv != null && conv < 0.04 && leads >= 15) {
    alerts.push({
      type: "CONVERSION_WEAK",
      severity: "medium",
      title: "Low conversion proxy with meaningful lead volume",
      message:
        "Executive snapshot conversion proxy is below 4% while LECIPM lead volume (30d) is at least 15 — worth validating funnel instrumentation.",
      reasoning:
        "Uses `executive_snapshot.platformMetrics` conversion proxy plus `seniorLead` 30d count — correlation is operational, not causal proof.",
      signals: [
        sig("exec.conv", "Conversion proxy", conv, "executive_snapshot.platformMetrics"),
        sig("lecipm.leads30d", "Senior leads 30d", leads, "senior_lead"),
      ],
    });
  }

  const churnBrokers = context.lecipm.churnInactiveBrokersApprox ?? 0;
  if (churnBrokers >= 40) {
    alerts.push({
      type: "CHURN_SIGNAL",
      severity: churnBrokers >= 120 ? "high" : "medium",
      title: "Elevated inactive broker proxy",
      message: `${churnBrokers} brokers appear inactive (platform heuristic) — retention workflows may need review.`,
      reasoning:
        "Figure comes from `gatherMarketSignals` broker activity window — definition is internal, not industry churn rate.",
      signals: [sig("lecipm.churnBrokers", "Inactive broker proxy", churnBrokers, "gatherMarketSignals")],
    });
  }

  const risk = (context.executive?.riskLevel ?? "").toLowerCase();
  if (risk === "high" || risk === "critical") {
    alerts.push({
      type: "EXECUTIVE_RISK",
      severity: risk === "critical" ? "critical" : "high",
      title: "Executive snapshot risk band elevated",
      message: `Latest stored executive assessment: **${risk}**.`,
      reasoning: "Pulled from `executive_snapshot.riskLevel` — requires human interpretation; not a market forecast.",
      signals: [sig("exec.risk", "Executive risk level", risk, "executive_snapshot")],
    });
  }

  const age = context.executive?.snapshotAgeHours;
  if (age != null && age > 72) {
    alerts.push({
      type: "DATA_STALE",
      severity: "medium",
      title: "Executive financial fusion snapshot is aging",
      message: `Last executive snapshot is ~${age.toFixed(0)}h old — refresh cadence may be delayed.`,
      reasoning: "Age = now − `executive_snapshot.snapshotDate`; stale data widens blind spots for strategic review.",
      signals: [sig("exec.snapshot_age_h", "Snapshot age (hours)", age, "executive_snapshot")],
    });
  }

  return alerts;
}

function draftToActionBlock(d: AiCeoRecommendationDraft): AiCeoStrategicInsightBlock {
  return {
    title: d.title,
    summary: d.summary,
    reasoning: [
      d.explanation.whyItMatters,
      d.explanation.confidenceRationale,
      d.explanation.dataBasisNote,
    ].join(" "),
    signals: d.signalsUsed,
  };
}

/**
 * Derive narrative buckets from recommendation drafts (no new “facts”).
 */
function composeStrategicNarratives(
  drafts: AiCeoRecommendationDraft[],
  prioritized: AiCeoPrioritizedSet,
): AiCeoStrategicInsights {
  const top = [...prioritized.topPriorities, ...prioritized.quickWins].slice(0, 8);

  const keyInsights = top.map((d) => `${d.title}: ${d.summary}`);

  const risks = drafts
    .filter((d) => d.category === "risk")
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 6)
    .map(draftToActionBlock);

  const opportunities = drafts
    .filter((d) => d.category === "growth" || d.category === "expansion")
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 6)
    .map(draftToActionBlock);

  const recommendedActions = prioritized.topPriorities.slice(0, 8).map(draftToActionBlock);

  return {
    keyInsights,
    risks,
    opportunities,
    recommendedActions,
  };
}

/**
 * Phase 2 — `generateStrategicInsights(context)` (spec): insights, risks, opportunities, recommended actions.
 */
export function generateStrategicInsights(context: AiCeoStrategicContext): AiCeoStrategicInsights {
  const drafts = generateStrategicRecommendations(context);
  return composeStrategicNarratives(drafts, prioritizeRecommendations(drafts));
}

/** Convenience: build context + run engine in one call. */
export async function generateStrategicInsightsFromLiveContext(): Promise<{
  context: AiCeoStrategicContext;
  drafts: AiCeoRecommendationDraft[];
  prioritized: AiCeoPrioritizedSet;
  insights: AiCeoStrategicInsights;
}> {
  const context = await buildStrategicContext();
  const drafts = generateStrategicRecommendations(context);
  const prioritized = prioritizeRecommendations(drafts);
  return {
    context,
    drafts,
    prioritized,
    insights: composeStrategicNarratives(drafts, prioritized),
  };
}

function composeSummary(
  context: AiCeoStrategicContext,
  insights: AiCeoStrategicInsights,
  alerts: AiCeoStrategicAlert[],
): string {
  const warn = context.coverage.thinDataWarnings.length;
  const alertN = alerts.filter((a) => a.severity === "critical" || a.severity === "high").length;
  const pri = insights.keyInsights[0] ?? "No prioritized initiatives crossed engine thresholds.";
  return [
    `Strategic review (${context.generatedAt.slice(0, 10)}) — internal metrics only.`,
    warn > 0 ? `Data quality: ${warn} coverage warning(s).` : "Data quality: core snapshots present.",
    alertN > 0 ? `Active alerts (high/critical): ${alertN}.` : "No high/critical rule-based alerts.",
    `Top narrative: ${pri}`,
    "All items are advisory; critical execution remains human-gated.",
  ].join(" ");
}

/** Full package for API + dashboard. */
export async function buildAiCeoInsightsPackage(): Promise<AiCeoInsightsPackage> {
  const context = await buildStrategicContext();
  const drafts = generateStrategicRecommendations(context);
  const prioritized = prioritizeRecommendations(drafts);
  const strategicInsights = composeStrategicNarratives(drafts, prioritized);
  const alerts = detectStrategicAlerts(context);
  const topPriorities = [...prioritized.topPriorities, ...prioritized.quickWins].slice(0, 3);

  return {
    summary: composeSummary(context, strategicInsights, alerts),
    topPriorities,
    alerts,
    strategicInsights,
    prioritized,
    contextMeta: {
      generatedAt: context.generatedAt,
      thinDataWarnings: context.coverage.thinDataWarnings,
      lecipm: context.lecipm as unknown as Record<string, unknown>,
      bnhub: context.bnhub as unknown as Record<string, unknown>,
      revenueInternal: context.revenueInternal as unknown as Record<string, unknown>,
    },
  };
}
