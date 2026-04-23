import { adaptCityLaunchPlaybook, inferCurrentPhase, mergeStepsWithAdaptations } from "./city-launch-adaptation.service";
import { explainPlaybookGeneration } from "./city-launch-explainability.service";
import { gatherLaunchIntegrationSnapshot } from "./city-launch-integration.service";
import { buildCityPlaybookFromIntegration } from "./city-launch-playbook.service";
import {
  buildProgressSummary,
  getTerritoryMetrics,
  patchTerritoryMetrics,
  upsertStepRecord,
} from "./city-launch-progress.service";

import type {
  CityLaunchAlert,
  CityLaunchFullView,
  CityPlaybook,
  LaunchIntegrationSnapshot,
  LaunchPhaseId,
  ProgressSummary,
  StepStatus,
  TerritoryPerformanceMetrics,
} from "./city-launch.types";

export function buildCityLaunchFullView(territoryId: string): CityLaunchFullView | null {
  const integration = gatherLaunchIntegrationSnapshot(territoryId);
  if (!integration) return null;

  const { playbook, steps: baseSteps } = buildCityPlaybookFromIntegration(integration);
  const metrics = getTerritoryMetrics(territoryId);
  const progressDraft = buildProgressSummary(territoryId, baseSteps);
  const adaptation = adaptCityLaunchPlaybook({
    playbook,
    steps: baseSteps,
    integration,
    progress: progressDraft,
    metrics,
  });
  const mergedSteps = mergeStepsWithAdaptations(baseSteps, adaptation.injectedSteps);
  const progress = buildProgressSummary(territoryId, mergedSteps);
  const currentPhaseId = inferCurrentPhase(progress.completionPercent);
  const alerts = buildCityLaunchAlerts({
    playbook,
    integration,
    progress,
    metrics,
    currentPhaseId,
  });

  return {
    playbook,
    steps: mergedSteps,
    integration,
    progress,
    metrics,
    adaptation,
    alerts,
    explainability: explainPlaybookGeneration(playbook, integration),
    currentPhaseId,
  };
}

function buildCityLaunchAlerts(input: {
  playbook: CityPlaybook;
  integration: LaunchIntegrationSnapshot;
  progress: ProgressSummary;
  metrics: TerritoryPerformanceMetrics;
  currentPhaseId: LaunchPhaseId;
}): CityLaunchAlert[] {
  const alerts: CityLaunchAlert[] = [];
  const { playbook, integration, progress, metrics, currentPhaseId } = input;

  if (progress.velocityStepsPerWeek < 0.4 && progress.completionPercent > 8 && progress.completionPercent < 92) {
    alerts.push({
      id: `${playbook.territoryId}:velocity`,
      kind: "phase_delayed",
      title: "Execution velocity is low",
      body: "Steps completed per week below threshold — review blockers and narrow parallel work.",
      severity: "watch",
      territoryId: playbook.territoryId,
    });
  }

  if (metrics.leadsGenerated < 30 && currentPhaseId !== "PRE_LAUNCH" && currentPhaseId !== "LAUNCH") {
    alerts.push({
      id: `${playbook.territoryId}:leads`,
      kind: "milestone_at_risk",
      title: "Lead milestone may miss plan",
      body: "Lead count still modest for current phase — tighten capture + routing.",
      severity: "important",
      territoryId: playbook.territoryId,
    });
  }

  if (progress.velocityStepsPerWeek >= 3) {
    alerts.push({
      id: `${playbook.territoryId}:traction`,
      kind: "traction_strong",
      title: "Strong traction — consider acceleration",
      body: "High completion velocity; consider pulling forward SCALE bets if supply supports.",
      severity: "info",
      territoryId: playbook.territoryId,
    });
  }

  if (
    metrics.dealsClosed >= 3 &&
    metrics.bookingsBnhub >= 12 &&
    integration.readinessBand === "PRIORITY"
  ) {
    alerts.push({
      id: `${playbook.territoryId}:accelerate`,
      kind: "accelerate_window",
      title: "Window to accelerate",
      body: "Deal + booking proxies healthy in a PRIORITY territory — bias budget to inventory + brokers.",
      severity: "info",
      territoryId: playbook.territoryId,
    });
  }

  if (progress.blockedCount >= 2) {
    alerts.push({
      id: `${playbook.territoryId}:blocked`,
      kind: "blocker_chain",
      title: "Multiple blocked steps",
      body: "Several steps blocked — exec triage to unblock dependencies.",
      severity: "important",
      territoryId: playbook.territoryId,
    });
  }

  return alerts.slice(0, 12);
}

export function updateLaunchStep(
  territoryId: string,
  stepId: string,
  payload: {
    status: StepStatus;
    assignedTo?: string;
    notes?: string;
    resultNotes?: string;
  }
) {
  return upsertStepRecord(territoryId, {
    stepId,
    status: payload.status,
    assignedTo: payload.assignedTo,
    notes: payload.notes ?? payload.resultNotes,
    resultNotes: payload.resultNotes ?? payload.notes,
  });
}

export function updatePerformanceMetrics(
  territoryId: string,
  patch: Partial<Omit<TerritoryPerformanceMetrics, "updatedAtIso">>
) {
  return patchTerritoryMetrics(territoryId, patch);
}

export { gatherLaunchIntegrationSnapshot } from "./city-launch-integration.service";
export { generateCityPlaybook, buildCityPlaybookFromIntegration } from "./city-launch-playbook.service";
export {
  resetCityLaunchProgressForTests,
  getTerritoryMetrics,
  patchTerritoryMetrics,
  buildProgressSummary,
} from "./city-launch-progress.service";
