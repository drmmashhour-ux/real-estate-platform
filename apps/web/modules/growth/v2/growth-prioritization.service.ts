/**
 * Merge opportunities + risks into executable action rows — deterministic ordering.
 */

import type {
  GrowthAction,
  GrowthActionOwnerArea,
  GrowthActionType,
  GrowthOpportunity,
  GrowthOpportunityCategory,
  GrowthRisk,
} from "./growth-engine-v2.types";

const UR = { high: 0, medium: 1, low: 2 } as const;
const IM = { high: 3, medium: 2, low: 1 } as const;
const CF = { high: 3, medium: 2, low: 1 } as const;

export function priorityScoreFromParts(
  urgency: keyof typeof UR,
  impact: keyof typeof IM,
  confidence: keyof typeof CF,
): number {
  return (3 - UR[urgency]) * 1000 + IM[impact] * 100 + CF[confidence] * 10;
}

export function priorityScoreFromRiskSeverity(severity: "low" | "medium" | "high"): number {
  return priorityScoreFromParts(severity, "medium", "medium");
}

function ownerFromCategory(category: GrowthOpportunityCategory): GrowthActionOwnerArea {
  switch (category) {
    case "broker":
      return "broker";
    case "bnhub":
      return "bnhub";
    case "revenue":
      return "revenue";
    case "traffic":
    case "conversion":
      return "growth";
    case "retention":
      return "product";
    default:
      return "ops";
  }
}

function mapTargetSurface(category: GrowthOpportunityCategory): string {
  switch (category) {
    case "bnhub":
      return "/bnhub/checkout";
    case "broker":
      return "/dashboard/broker";
    case "revenue":
      return "/admin/finance";
    case "traffic":
    case "conversion":
      return "/admin/analytics";
    default:
      return "/admin/growth-v2";
  }
}

function actionTypeFromOpp(o: GrowthOpportunity): GrowthActionType {
  if (o.category === "broker") return "fix_followup";
  if (o.category === "conversion" || o.category === "traffic") return "improve_conversion";
  if (o.category === "bnhub") return "review";
  return "review";
}

export function opportunityToGrowthActions(opps: GrowthOpportunity[]): Omit<GrowthAction, "horizon">[] {
  return opps.map((o) => ({
    id: `act-${o.id}`,
    category: o.category,
    title: o.title,
    description: o.recommendedAction,
    ownerArea: ownerFromCategory(o.category),
    priorityScore: priorityScoreFromParts(o.urgency, o.impact, o.confidence),
    targetSurface: mapTargetSurface(o.category),
    actionType: actionTypeFromOpp(o),
    sourceSignals: o.sourceSignals,
  }));
}

export function riskToGrowthActions(risks: GrowthRisk[]): Omit<GrowthAction, "horizon">[] {
  return risks.map((r) => ({
    id: `act-${r.id}`,
    category: r.category,
    title: r.title,
    description: r.recommendedResponse,
    ownerArea: ownerFromCategory(r.category),
    priorityScore: priorityScoreFromRiskSeverity(r.severity),
    targetSurface: mapTargetSurface(r.category),
    actionType: "review" as GrowthActionType,
    sourceSignals: r.sourceSignals,
  }));
}

export function prioritizeGrowthActions(opps: GrowthOpportunity[], risks: GrowthRisk[]): {
  today: GrowthAction[];
  week: GrowthAction[];
} {
  const drafts = [...opportunityToGrowthActions(opps), ...riskToGrowthActions(risks)];
  const sorted = drafts.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.id.localeCompare(b.id);
  });

  const today: GrowthAction[] = sorted.slice(0, 3).map((a) => ({ ...a, horizon: "today" }));
  const week: GrowthAction[] = sorted.slice(3, 8).map((a) => ({ ...a, horizon: "week" }));

  return { today, week };
}
