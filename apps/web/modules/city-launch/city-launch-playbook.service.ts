import { gatherLaunchIntegrationSnapshot } from "./city-launch-integration.service";
import { buildLaunchStepsForPlaybook } from "./city-launch-steps.service";

import type { HubType } from "@/modules/market-domination/market-domination.types";

import type {
  CityPlaybook,
  LaunchIntegrationSnapshot,
  LaunchPhaseId,
  PlaybookPhase,
} from "./city-launch.types";

function timelineWeeksFromReadiness(band: string): number {
  switch (band) {
    case "NOT_READY":
      return 20;
    case "EMERGING":
      return 16;
    case "READY":
      return 12;
    case "PRIORITY":
      return 8;
    default:
      return 14;
}

function priorityHubsFromIntegration(integration: LaunchIntegrationSnapshot): HubType[] {
  const fromDom = integration.dominantHubs.slice(0, 4);
  if (fromDom.length >= 3) return fromDom;
  return [...new Set([...fromDom, "BROKER", "BNHUB", "BUYER"])].slice(0, 4);
}

function targetSegments(integration: LaunchIntegrationSnapshot): string[] {
  const segs = new Set<string>();
  if (integration.leadVolumeProxy > 80) segs.add("High-intent buyers");
  if (integration.competitorPressure > 6) segs.add("Broker partners (differentiated wins)");
  segs.add("Local sellers & FSBO-adjacent");
  if (integration.dominantHubs.includes("BNHUB")) segs.add("Short-stay travelers & hosts");
  if (integration.dominantHubs.includes("INVESTOR")) segs.add("Investors & deal scouts");
  return [...segs].slice(0, 6);
}

function strategySummary(integration: LaunchIntegrationSnapshot, hubs: HubType[]): string {
  const gapHint =
    integration.gapsSummary[0]?.slice(0, 120) ?? "No critical gap lines surfaced in snapshot.";
  return (
    `${integration.territoryName}: push ${hubs.slice(0, 2).join(" + ")} first while securing supply for ` +
    `demand signals (readiness ${integration.readinessBand}, pressure ${integration.competitorPressure.toFixed(1)}/10). ` +
    `Growth Brain themes: ${integration.growthOpportunityTitles.slice(0, 2).join("; ") || "general efficiency plays"}. ` +
    `Gap focus: ${gapHint}`
  );
}

function phaseDefinitions(): PlaybookPhase[] {
  return [
    {
      id: "PRE_LAUNCH",
      label: "Pre-launch",
      objectives: [
        "Broker target list + messaging clarity",
        "Localized capture surface live",
        "Supply & ops routing understood",
      ],
      actions: [
        "Prospect brokers and schedule intros",
        "Ship landing + analytics",
        "Queue week-one content",
      ],
      successMetrics: ["Approved broker target list", "Landing deployed", "Routing doc signed"],
      estimatedWeeksSpan: 3,
    },
    {
      id: "LAUNCH",
      label: "Launch",
      objectives: ["First revenue-capable cohort", "Supply visible", "Lead capture proven"],
      actions: ["Broker onboarding sprint", "Listings batch", "Campaign activation"],
      successMetrics: ["5 brokers active", "10 listings live", "Lead attribution clean"],
      estimatedWeeksSpan: 4,
    },
    {
      id: "EARLY_TRACTION",
      label: "Early traction",
      objectives: ["Pipeline density", "Proof stories", "BNHub momentum"],
      actions: ["Lead gen discipline", "Deal desk cadence", "BNHub promos"],
      successMetrics: ["50 SQLs", "3 wins", "First stay/booking milestones"],
      estimatedWeeksSpan: 6,
    },
    {
      id: "SCALE",
      label: "Scale",
      objectives: ["Network effects", "Inventory depth", "Investor lane optional"],
      actions: ["Broker expansion", "BNHub supply programs", "Investor programming"],
      successMetrics: ["Broker count growth", "Inventory up", "Investor pipeline stages"],
      estimatedWeeksSpan: 8,
    },
    {
      id: "DOMINATION",
      label: "Domination",
      objectives: ["Sustainable conversion advantage", "Organic leadership", "Retention"],
      actions: ["CRO experiments", "SEO cluster ownership", "Lifecycle retention"],
      successMetrics: ["Conversion lift", "SEO share-of-voice", "Repeat usage"],
      estimatedWeeksSpan: 10,
    },
  ];
}

/** Generates structured playbook + steps from live integration inputs. */
export function buildCityPlaybookFromIntegration(
  integration: LaunchIntegrationSnapshot
): { playbook: CityPlaybook; steps: ReturnType<typeof buildLaunchStepsForPlaybook> } {
  const priorityHubs = priorityHubsFromIntegration(integration);
  const estimatedTimelineWeeks = timelineWeeksFromReadiness(integration.readinessBand);
  const segments = targetSegments(integration);

  const playbook: CityPlaybook = {
    territoryId: integration.territoryId,
    territoryName: integration.territoryName,
    generatedAtIso: new Date().toISOString(),
    launchStrategySummary: strategySummary(integration, priorityHubs),
    priorityHubs,
    targetSegments: segments,
    estimatedTimelineWeeks,
    phases: phaseDefinitions(),
  };

  const steps = buildLaunchStepsForPlaybook(playbook, integration);
  return { playbook, steps };
}

/** Spec entrypoint: territory-scoped playbook generation. */
export function generateCityPlaybook(territoryId: string) {
  const integration = gatherLaunchIntegrationSnapshot(territoryId);
  if (!integration) return null;
  return buildCityPlaybookFromIntegration(integration);
}

export function phaseOrderIndex(id: LaunchPhaseId): number {
  return ["PRE_LAUNCH", "LAUNCH", "EARLY_TRACTION", "SCALE", "DOMINATION"].indexOf(id);
}
