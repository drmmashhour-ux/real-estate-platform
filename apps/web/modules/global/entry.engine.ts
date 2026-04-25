/**
 * Market entry planning: pilot, early adopters, and feedback loops.
 * Composes existing expansion config with operator-facing narrative — no auto-provisioning.
 */

import { launchCountry } from "@/modules/global-expansion/global-launch.service";
import {
  getCountryConfig,
  marketEntryStrategyFor,
} from "@/modules/global-expansion/global-country.service";

export type PilotLaunchPlan = {
  territoryId: string;
  durationWeeks: number;
  successCriteria: string[];
  checklistNote: string;
};

export type EarlyAdopterPlan = {
  segments: string[];
  onboardingMilestones: string[];
  supportModel: string;
};

export type FeedbackLoopPlan = {
  channels: string[];
  reviewCadence: string;
  coreMetrics: string[];
  productNotes: string;
};

export type MarketEntryBundle = {
  countryCode: string;
  strategySummary: string;
  pilot: PilotLaunchPlan;
  earlyAdopters: EarlyAdopterPlan;
  feedback: FeedbackLoopPlan;
};

const DEFAULT_PILOT_TERRITORY = "mtl-core";

/**
 * Structured entry plan for gating expansion discussions and `/dashboard/global`.
 */
export function buildEntryStrategyPlan(countryCode: string): MarketEntryBundle {
  const c = getCountryConfig(countryCode);
  const strat = marketEntryStrategyFor(countryCode);
  const upper = c?.countryCode ?? countryCode.toUpperCase();
  const pilotCity = c?.supportedCities?.[0] ?? "pilot city";

  return {
    countryCode: upper,
    strategySummary: `${strat.salesApproach} — primary hub: ${strat.primaryHub}; cities: ${strat.entryCities.join(", ") || "TBD"}.`,
    pilot: {
      territoryId: DEFAULT_PILOT_TERRITORY,
      durationWeeks: 8,
      successCriteria: [
        `Sustainable listing or partner pipeline in ${pilotCity}`,
        "NPS or qualitative feedback from first 20 transactions (or dry runs)",
        "Zero unresolved regulatory escalations in pilot window",
      ],
      checklistNote: "Align city playbook owners with `launchCountry` audit lines before expanding spend.",
    },
    earlyAdopters: {
      segments: [
        strat.targetAudience,
        "Broker teams already digital-first",
        "Hosts on BNHub where product is enabled",
      ],
      onboardingMilestones: [
        "Identity + compliance checklist complete",
        "First successful listing or booking path in market",
        "Weekly check-in for first 4 weeks",
      ],
      supportModel: "High-touch CSM for first cohort; deflect to self-serve only after playbooks are stable.",
    },
    feedback: {
      channels: ["in-app", "host/guest support", "quarterly operator review"],
      reviewCadence: "Bi-weekly during pilot, monthly in scaling",
      coreMetrics: [
        "Time-to-first-value by cohort",
        "Regulatory or trust incidents",
        "Revenue and lead proxies vs baseline",
      ],
      productNotes: "Route feature requests through market PM with regulation.engine constraints visible.",
    },
  };
}

/**
 * Runs the existing orchestrated launch sequence (idempotent) and returns the result for UI or audit.
 */
export function runPilotLaunchSequence(countryCode: string, pilotTerritoryId = DEFAULT_PILOT_TERRITORY) {
  return launchCountry(countryCode, pilotTerritoryId);
}

/**
 * One-line summary for dashboards.
 */
export function summarizeFeedbackLoop(countryCode: string): string {
  const b = buildEntryStrategyPlan(countryCode);
  return `Feedback: ${b.feedback.channels.join(", ")} · ${b.feedback.reviewCadence}`;
}
