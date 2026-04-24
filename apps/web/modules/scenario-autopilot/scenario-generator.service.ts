import type { AutopilotLevel, ScenarioInput } from "@/modules/simulation/simulation.types";

import type { CandidateScenario, ScenarioAutopilotDomain, ScenarioRiskLevel } from "./scenario-autopilot.types";

const uid = () => `cnd_${globalThis.crypto?.randomUUID?.() ?? String(Math.random()).slice(2, 12)}`;

function s(p: Partial<ScenarioInput>): ScenarioInput {
  return {
    leadVolumeMultiplier: p.leadVolumeMultiplier ?? 1,
    responseSpeedChange: p.responseSpeedChange ?? 0,
    pricingAdjustment: p.pricingAdjustment ?? 0,
    marketingBoost: p.marketingBoost ?? 0,
    trustThresholdChange: p.trustThresholdChange ?? 0,
    autopilotLevel: (p.autopilotLevel ?? 0) as AutopilotLevel,
    regionKey: p.regionKey ?? null,
  };
}

/**
 * Produces a diverse, explainable set of candidate scenarios (no I/O, no production side effects).
 */
export function generateCandidateScenarios(_seed?: string): CandidateScenario[] {
  const c: CandidateScenario[] = [
    {
      id: uid(),
      domain: "marketing",
      title: "Moderate marketing intensity + demand lift",
      parameters: s({ leadVolumeMultiplier: 1.15, marketingBoost: 0.25, autopilotLevel: 1 }),
      expectedTargets: ["Top-of-funnel volume", "Brand impressions"],
      riskLevel: "medium" as ScenarioRiskLevel,
      reversible: true,
      requiresHighTierApproval: true,
      effortScore: 0.4,
      generatorRationale: "Blends demand multiplier with marketing boost — watch dispute/trust if conversion spikes.",
    },
    {
      id: uid(),
      domain: "lead_routing",
      title: "Faster first-response routing (SLA-tight)",
      parameters: s({ responseSpeedChange: -0.25, leadVolumeMultiplier: 1.05, autopilotLevel: 1 }),
      expectedTargets: ["Speed-to-lead", "Hot lead assignment"],
      riskLevel: "low",
      reversible: true,
      requiresHighTierApproval: false,
      effortScore: 0.35,
      generatorRationale: "Prioritises response time — lower governance risk, upside on conversion.",
    },
    {
      id: uid(),
      domain: "follow_up_timing",
      title: "Accelerated follow-up cadence (assistant-heavy)",
      parameters: s({ responseSpeedChange: -0.15, marketingBoost: 0.1, autopilotLevel: 2 }),
      expectedTargets: ["CRM nudges", "Assistant drafts"],
      riskLevel: "low",
      reversible: true,
      requiresHighTierApproval: false,
      effortScore: 0.3,
      generatorRationale: "Raises autopilot to absorb cadence; monitor workload and exceptions.",
    },
    {
      id: uid(),
      domain: "booking_confirmation",
      title: "Stricter visit confirmation + buffer",
      parameters: s({ responseSpeedChange: -0.1, trustThresholdChange: 1, autopilotLevel: 1 }),
      expectedTargets: ["No-shows", "Calendar reliability"],
      riskLevel: "low",
      reversible: true,
      requiresHighTierApproval: false,
      effortScore: 0.25,
      generatorRationale: "Nudges trust band up slightly while tightening comms to protect visits.",
    },
    {
      id: uid(),
      domain: "no_show_reminders",
      title: "Extra reminder tier before visits",
      parameters: s({ responseSpeedChange: -0.2, marketingBoost: 0.05, autopilotLevel: 1 }),
      expectedTargets: ["Show rate", "Visit pipeline"],
      riskLevel: "low",
      reversible: true,
      requiresHighTierApproval: false,
      effortScore: 0.2,
      generatorRationale: "Simulates more proactive reminders — often reversible template changes.",
    },
    {
      id: uid(),
      domain: "trust_threshold",
      title: "Stricter marketplace trust gate",
      parameters: s({ trustThresholdChange: 4, leadVolumeMultiplier: 0.95, pricingAdjustment: 0 }),
      expectedTargets: ["Trust score mix", "Dispute rate"],
      riskLevel: "high",
      reversible: true,
      requiresHighTierApproval: true,
      effortScore: 0.55,
      generatorRationale: "May reduce top-of-funnel but lowers dispute risk — requires product/legal alignment.",
    },
    {
      id: uid(),
      domain: "territory_pacing",
      title: "Slower expansion pacing (defensive)",
      parameters: s({ leadVolumeMultiplier: 0.9, marketingBoost: 0.15, autopilotLevel: 1 }),
      expectedTargets: ["CAC", "Region burn"],
      riskLevel: "medium",
      reversible: true,
      requiresHighTierApproval: true,
      effortScore: 0.5,
      generatorRationale: "Dampen volume while keeping small marketing test budget — expansion safety.",
    },
  ];

  c.push(
    {
      id: uid(),
      domain: "broker_prioritization",
      title: "High-intent lead prioritization shift",
      parameters: s({ leadVolumeMultiplier: 1.1, responseSpeedChange: -0.2, autopilotLevel: 2 }),
      expectedTargets: ["Broker time allocation", "Close rate on priority tier"],
      riskLevel: "medium",
      reversible: true,
      requiresHighTierApproval: true,
      effortScore: 0.45,
      generatorRationale: "Favors routing to faster brokers — can skew fairness; review with ops.",
    },
    {
      id: uid(),
      domain: "content_cadence",
      title: "Higher content cadence with capped spend",
      parameters: s({ marketingBoost: 0.4, leadVolumeMultiplier: 1.08, pricingAdjustment: 0.02 }),
      expectedTargets: ["Organic + paid touchpoints", "In-market recall"],
      riskLevel: "high",
      reversible: true,
      requiresHighTierApproval: true,
      effortScore: 0.5,
      generatorRationale: "Pricing and visibility adjacent — high-tier approval in production.",
    },
  );

  c.push({
    id: uid(),
    domain: "marketing",
    title: "Aggressive growth push (higher risk)",
    parameters: s({
      leadVolumeMultiplier: 1.45,
      marketingBoost: 0.6,
      pricingAdjustment: 0.08,
      autopilotLevel: 2,
    }),
    expectedTargets: ["Pipeline $", "Share of voice"],
    riskLevel: "critical",
    reversible: false,
    requiresHighTierApproval: true,
    effortScore: 0.85,
    generatorRationale: "Largest upside with pricing + volume — not reversible in all subsystems; approval mandatory.",
  });

  return c;
}
