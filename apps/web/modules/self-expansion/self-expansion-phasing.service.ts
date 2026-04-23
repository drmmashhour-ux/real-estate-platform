import type {
  ExpansionPhaseId,
  ExpansionRecommendationActionBand,
  PhasePlanResult,
  TerritoryExpansionProfile,
} from "@/modules/self-expansion/self-expansion.types";

function phaseFromSignals(
  band: ExpansionRecommendationActionBand,
  readinessBand: string,
  completionPercent?: number
): ExpansionPhaseId {
  if (band === "PAUSE") return "DISCOVERY";
  if (band === "WATCH") return "DISCOVERY";
  if (band === "PREPARE") return "PREPARE";
  if (band === "ENTER") return readinessBand === "PRIORITY" ? "LAUNCH" : "TEST";
  if (band === "SCALE") {
    if (completionPercent != null && completionPercent > 72) return "DOMINATE";
    return "EXPAND";
  }
  return "PREPARE";
}

export function buildPhasePlan(params: {
  territory: TerritoryExpansionProfile;
  actionBand: ExpansionRecommendationActionBand;
  playbookCompletionPercent?: number | null;
}): PhasePlanResult {
  const { territory: p, actionBand, playbookCompletionPercent } = params;
  const phase = phaseFromSignals(actionBand, p.readinessBand, playbookCompletionPercent ?? undefined);

  const phaseGoals: string[] = [];
  const phaseBlockers: string[] = [];
  const exitCriteria: string[] = [];

  switch (phase) {
    case "DISCOVERY":
      phaseGoals.push("Validate demand proxies and regulatory configuration");
      phaseBlockers.push(...p.regulatoryReadinessFlags.slice(0, 2));
      exitCriteria.push("Readiness band ≥ EMERGING with documented counsel review for flags");
      break;
    case "PREPARE":
      phaseGoals.push("Stand up routing, collateral, and broker BNHub linkage");
      phaseBlockers.push(
        p.brokerDensity < 30 ? "Thin broker bench — recruit before paid marketing" : "Instrumentation gaps on attribution"
      );
      exitCriteria.push("Playbook PREPARE steps cleared or waived with audit");
      break;
    case "TEST":
      phaseGoals.push("Limited cohort launch with weekly KPI review");
      exitCriteria.push("Two consecutive weeks hitting leading-indicator targets");
      break;
    case "LAUNCH":
      phaseGoals.push("Public GTM with approval-gated spend");
      phaseBlockers.push(p.competitorPressure > 8 ? "Competitor pressure high — pair offense with differentiation" : "Watch cash recovery cadence");
      exitCriteria.push("Revenue / pipeline milestones hit (configurable)");
      break;
    case "EXPAND":
      phaseGoals.push("Deepen supply + repeat usage");
      exitCriteria.push("Retention + repeat booking thresholds (config per territory)");
      break;
    case "DOMINATE":
      phaseGoals.push("Sustain market leadership with compliance-first automation");
      exitCriteria.push("Domination score stable ±5 pts for 30d");
      break;
    default:
      break;
  }

  return {
    territoryId: p.territoryId,
    currentSuggestedPhase: phase,
    phaseGoals,
    phaseBlockers,
    exitCriteria,
  };
}
