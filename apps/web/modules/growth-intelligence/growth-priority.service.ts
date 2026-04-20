import {
  GROWTH_HIGH_SCORE_MIN,
  GROWTH_MEDIUM_SCORE_MIN,
  GROWTH_PRIORITY_WEIGHTS,
  GROWTH_URGENT_SCORE_MIN,
} from "./growth.config";
import type {
  GrowthOpportunity,
  GrowthPriorityLevel,
  GrowthPriorityScore,
  GrowthSignalType,
} from "./growth.types";

function severityNumeric(s: string): number {
  if (s === "critical") return 100;
  if (s === "warning") return 70;
  return 40;
}

function clamp0100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseSignalType(opportunity: GrowthOpportunity): GrowthSignalType | undefined {
  const raw = opportunity.metadata.signalType;
  return typeof raw === "string" ? (raw as GrowthSignalType) : undefined;
}

export function scoreGrowthOpportunity(opportunity: GrowthOpportunity): GrowthPriorityScore {
  const sev = severityNumeric(opportunity.severity);
  const sigType = parseSignalType(opportunity);

  const revenueRelevance =
    opportunity.opportunityType === "promote_region" || opportunity.opportunityType === "promote_listing_cluster"
      ? 75
      : opportunity.opportunityType === "create_programmatic_page_brief"
        ? 68
        : sigType === "trend_reversal"
          ? 72
          : 55;

  const trafficConversionImpact =
    opportunity.opportunityType === "improve_cta" ||
    opportunity.opportunityType === "create_content_brief" ||
    (sigType != null && ["low_conversion_page", "lead_form_dropoff"].includes(sigType))
      ? 72
      : sigType === "high_intent_search_opportunity"
        ? 68
        : 50;

  const trustComplianceLeverage =
    opportunity.opportunityType === "recommend_trust_upgrade"
      ? 85
      : opportunity.entityType === "fsbo_listing"
        ? 62
        : 45;

  const regionalStrategicValue =
    opportunity.region || opportunity.opportunityType === "promote_region" ? 70 : 35;

  const easeOfExecution =
    opportunity.opportunityType === "recommend_campaign_review" ||
    opportunity.opportunityType === "recommend_seo_refresh"
      ? 80
      : opportunity.opportunityType === "recommend_reactivation_strategy"
        ? 70
        : 55;

  const repeatability =
    opportunity.opportunityType === "create_programmatic_page_brief" ? 78 : 60;

  const missedOpportunitySeverity = sev;

  let timelinePersistence = 35;
  if (typeof opportunity.metadata.timelinePersistenceScore === "number") {
    timelinePersistence = clamp0100(opportunity.metadata.timelinePersistenceScore as number);
  } else if (sigType === "stalled_funnel" || sigType === "repeat_dropoff_pattern") {
    timelinePersistence = 78;
  } else if (sigType === "trend_reversal") {
    timelinePersistence = 72;
  } else if (opportunity.metadata.timelineDerived === true) {
    timelinePersistence = 65;
  }

  let worseningIndicator = 30;
  if (typeof opportunity.metadata.worseningScore === "number") {
    worseningIndicator = clamp0100(opportunity.metadata.worseningScore as number);
  } else if (sigType === "trend_reversal") {
    worseningIndicator = 82;
  } else if (sigType === "repeat_dropoff_pattern") {
    worseningIndicator = 58;
  } else if (sigType === "stalled_funnel") {
    worseningIndicator = 42;
  }

  let trustLeverageUnused = 48;
  if (
    opportunity.opportunityType === "recommend_trust_upgrade" ||
    sigType === "trust_conversion_opportunity"
  ) {
    trustLeverageUnused = 86;
  } else if (opportunity.entityType === "fsbo_listing") {
    trustLeverageUnused = 58;
  }

  const W = GROWTH_PRIORITY_WEIGHTS;
  const raw =
    revenueRelevance * W.revenueRelevance +
    trafficConversionImpact * W.trafficConversionImpact +
    trustComplianceLeverage * W.trustComplianceLeverage +
    regionalStrategicValue * W.regionalStrategicValue +
    easeOfExecution * W.easeOfExecution +
    repeatability * W.repeatability +
    missedOpportunitySeverity * W.missedOpportunitySeverity +
    timelinePersistence * W.timelinePersistence +
    worseningIndicator * W.worseningIndicator +
    trustLeverageUnused * W.trustLeverageUnused;

  const weightSum =
    W.revenueRelevance +
    W.trafficConversionImpact +
    W.trustComplianceLeverage +
    W.regionalStrategicValue +
    W.easeOfExecution +
    W.repeatability +
    W.missedOpportunitySeverity +
    W.timelinePersistence +
    W.worseningIndicator +
    W.trustLeverageUnused;

  const totalScore = Math.round(Math.min(100, (raw / (100 * weightSum)) * 100));

  let level: GrowthPriorityLevel = "low";
  if (totalScore >= GROWTH_URGENT_SCORE_MIN) level = "urgent";
  else if (totalScore >= GROWTH_HIGH_SCORE_MIN) level = "high";
  else if (totalScore >= GROWTH_MEDIUM_SCORE_MIN) level = "medium";

  const reasons = [
    `severity_weight=${sev}`,
    `opportunity_type=${opportunity.opportunityType}`,
    `signal_type=${sigType ?? "n/a"}`,
    `timelinePersistence=${timelinePersistence}`,
    `worseningIndicator=${worseningIndicator}`,
    `trustLeverageUnused=${trustLeverageUnused}`,
    `composite=${totalScore}`,
  ];

  return {
    opportunityId: opportunity.id,
    totalScore,
    level,
    reasons,
    components: {
      revenueRelevance,
      trafficConversionImpact,
      trustComplianceLeverage,
      regionalStrategicValue,
      easeOfExecution,
      repeatability,
      missedOpportunitySeverity,
      timelinePersistence,
      worseningIndicator,
      trustLeverageUnused,
    },
  };
}

export function prioritizeGrowthOpportunities(opportunities: GrowthOpportunity[]): GrowthOpportunity[] {
  const scored = opportunities.map((o) => ({ o, s: scoreGrowthOpportunity(o).totalScore }));
  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.o);
}

export function buildGrowthPrioritySummary(opportunities: GrowthOpportunity[]): GrowthPriorityScore[] {
  return opportunities.map((o) => scoreGrowthOpportunity(o)).sort((a, b) => b.totalScore - a.totalScore);
}
