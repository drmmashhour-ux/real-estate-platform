import type {
  CityPlaybook,
  LaunchIntegrationSnapshot,
  LaunchStep,
  PlaybookExplainability,
} from "./city-launch.types";

export function explainPlaybookGeneration(
  playbook: CityPlaybook,
  integration: LaunchIntegrationSnapshot
): PlaybookExplainability {
  const primaryDrivers: string[] = [
    `Readiness band ${integration.readinessBand} (${integration.readinessScore}/100) sets timeline ~${playbook.estimatedTimelineWeeks} weeks.`,
    `Dominant hubs from penetration proxy: ${integration.dominantHubs.join(", ")}.`,
    `Competitor pressure ${integration.competitorPressure.toFixed(1)}/10 shapes narrative intensity.`,
  ];

  if (integration.gapsSummary.length) {
    primaryDrivers.push(`First gap responses: ${integration.gapsSummary[0]?.slice(0, 140)}`);
  }

  const cautions: string[] = [
    "Figures mix CRM proxies and seed metrics — validate with field leadership weekly.",
    "Adaptation steps trigger from thresholds; tune metrics in the tracker for honest signals.",
  ];

  if (integration.revenuePredictorNote) {
    primaryDrivers.push(`Revenue Predictor org context: ${integration.revenuePredictorNote.slice(0, 160)}`);
  }

  const aiAssistHooks = [
    "Growth Brain actions → seed campaign briefs & outreach scripts (human approval).",
    "AI Sales Manager → cadences for broker/deal steps (review before send).",
    "Marketing Engine calendar → schedules content sprint assets from PRE-LAUNCH steps.",
    "Lead Engine routing rules → validated in LAUNCH step checklists.",
  ];

  return {
    headline: `${playbook.territoryName}: phased launch aligned to Domination signals + Growth Brain themes.`,
    primaryDrivers,
    cautions,
    aiAssistHooks,
  };
}

export function explainStepExecution(step: LaunchStep, integration: LaunchIntegrationSnapshot): string {
  return (
    `${step.title} supports ${step.assignedHub} in ${step.phaseId.replace(/_/g, " ").toLowerCase()}. ` +
    `Expected impact ${step.expectedImpact} with effort ${step.estimatedEffort}. ` +
    `Success: ${step.successMetric}. Context: ${integration.territoryName} competitor pressure ${integration.competitorPressure.toFixed(1)}/10.`
  );
}
