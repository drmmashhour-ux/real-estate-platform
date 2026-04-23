import { stepId } from "./city-launch-steps.service";

import type {
  AdaptationResult,
  AdaptationSuggestion,
  CityPlaybook,
  LaunchIntegrationSnapshot,
  LaunchPhaseId,
  LaunchStep,
  ProgressSummary,
  TerritoryPerformanceMetrics,
} from "./city-launch.types";

export function adaptCityLaunchPlaybook(input: {
  playbook: CityPlaybook;
  steps: LaunchStep[];
  integration: LaunchIntegrationSnapshot;
  progress: ProgressSummary;
  metrics: TerritoryPerformanceMetrics;
}): AdaptationResult {
  const { playbook, integration, progress, metrics } = input;
  const tid = playbook.territoryId;
  const suggestions: AdaptationSuggestion[] = [];
  const injected: LaunchStep[] = [];
  const metricsDrivers: string[] = [];

  if (metrics.brokersOnboarded < 4 && integration.leadVolumeProxy > 70) {
    suggestions.push({
      id: `${tid}:adapt-brokers`,
      title: "Increase broker outreach cadence",
      rationale:
        "Lead demand exists but bench is thin versus proxy volume — temporary outreach surge before scaling paid demand.",
      suggestedSteps: ["Daily broker intros", "Partner event or lunch-and-learn"],
      urgency: "high",
    });
    injected.push({
      id: stepId(tid, "adapt-broker-blitz"),
      phaseId: "PRE_LAUNCH",
      title: "Adaptation: 10-touch broker outreach blitz",
      description:
        "Two-week sprint: prioritized calls + co-branded invite; log outcomes in CRM for Sales Manager coaching.",
      category: "SALES",
      assignedHub: "BROKER",
      priority: "P0",
      estimatedEffort: "M",
      expectedImpact: "HIGH",
      dependencies: [],
      successMetric: "30 meaningful conversations booked",
      isAdaptation: true,
    });
    metricsDrivers.push("brokersOnboarded_vs_leadVolumeProxy");
  }

  if (integration.supplyDemandRatio < 0.88) {
    suggestions.push({
      id: `${tid}:adapt-supply`,
      title: "Prioritize supply acquisition",
      rationale:
        "Normalized supply/demand proxy is tight — amplify listings + BNHub inventory before adding marketing spend.",
      suggestedSteps: ["Listing recruitment offers", "BNHub host incentive"],
      urgency: "high",
    });
    injected.push({
      id: stepId(tid, "adapt-supply-push"),
      phaseId: "LAUNCH",
      title: "Adaptation: supply rescue package",
      description:
        "Fast-track onboarding for 5 sellers/hosts with bundled marketing boost from marketing engine.",
      category: "SUPPLY",
      assignedHub: "BNHUB",
      priority: "P0",
      estimatedEffort: "L",
      expectedImpact: "HIGH",
      dependencies: [],
      successMetric: "Net new inventory units live within 14 days",
      isAdaptation: true,
    });
    metricsDrivers.push("supplyDemandRatio");
  }

  if (integration.conversionRate < 0.13 && metrics.leadsGenerated > 40) {
    suggestions.push({
      id: `${tid}:adapt-conv`,
      title: "Add conversion diagnostics",
      rationale: "Lead volume adequate but conversion soft — tighten routing + offer-market fit experiments.",
      suggestedSteps: ["Funnel teardown workshop", "Speed-to-lead SLA tightening"],
      urgency: "medium",
    });
    metricsDrivers.push("conversionRate");
  }

  if (
    progress.velocityStepsPerWeek >= 2.5 ||
    (metrics.dealsClosed >= 2 && metrics.bookingsBnhub >= 8)
  ) {
    suggestions.push({
      id: `${tid}:adapt-accelerate`,
      title: "Acceleration window — expand scale motions",
      rationale:
        "Execution velocity or revenue-proxy milestones beat plan — bias budget to BNHub inventory and broker expansion.",
      suggestedSteps: ["Advance SCALE phase items", "Approve discretionary campaign budget"],
      urgency: "medium",
    });
    injected.push({
      id: stepId(tid, "adapt-scale-surge"),
      phaseId: "SCALE",
      title: "Adaptation: pull-forward scale experiments",
      description:
        "Run two parallel scale bets (brokers + BNHub) with weekly kill criteria; coordinate with Revenue Predictor pacing.",
      category: "OPS",
      assignedHub: "BROKER",
      priority: "P1",
      estimatedEffort: "M",
      expectedImpact: "HIGH",
      dependencies: [],
      successMetric: "Two experiments launched with documented outcomes",
      isAdaptation: true,
    });
    metricsDrivers.push("velocity", "dealsClosed", "bookingsBnhub");
  }

  if (integration.competitorPressure >= 7.5) {
    suggestions.push({
      id: `${tid}:adapt-compete`,
      title: "Differentiated narrative vs incumbents",
      rationale:
        "Logged competitor pressure is elevated — pair growth plays with routed-intent + broker collaboration proof.",
      suggestedSteps: ["Case study sprint", "BNHub trust bundle messaging"],
      urgency: "medium",
    });
    metricsDrivers.push("competitorPressure");
  }

  return {
    suggestions,
    injectedSteps: injected,
    metricsDrivers: [...new Set(metricsDrivers)],
  };
}

export function mergeStepsWithAdaptations(base: LaunchStep[], injected: LaunchStep[]): LaunchStep[] {
  const seen = new Set(base.map((s) => s.id));
  const out = [...base];
  for (const s of injected) {
    if (!seen.has(s.id)) {
      out.push(s);
      seen.add(s.id);
    }
  }
  return out;
}

export function inferCurrentPhase(completionPercent: number): LaunchPhaseId {
  if (completionPercent < 18) return "PRE_LAUNCH";
  if (completionPercent < 38) return "LAUNCH";
  if (completionPercent < 58) return "EARLY_TRACTION";
  if (completionPercent < 78) return "SCALE";
  return "DOMINATION";
}
