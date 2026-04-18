import type { MoatSignal } from "./moat.types";

/**
 * Baseline moat assessment (0–1). Strengths are heuristic defaults for strategy;
 * replace with measured scores as you wire CRM / graph / learning counters.
 */
export function buildMoatSignals(): MoatSignal[] {
  return [
    {
      type: "data",
      strength: 0.55,
      description:
        "Data accumulation: lead history, funnel events, and broker outcomes compound for routing and scoring quality.",
    },
    {
      type: "network_effect",
      strength: 0.5,
      description:
        "Broker network density: more brokers attract more seller/buyer intent in the same metros (liquidity).",
    },
    {
      type: "ai_learning",
      strength: 0.48,
      description:
        "AI improvement loop: Growth Memory + Learning + Autopilot drafts tighten recommendations over time (human-approved).",
    },
    {
      type: "supply_control",
      strength: 0.42,
      description:
        "Lead supply control: platform-owned capture + routing policies shape who gets high-intent demand.",
    },
    {
      type: "brand",
      strength: 0.4,
      description:
        "Brand growth: trust, BNHub, and city-level presence reduce CAC as recognition rises.",
    },
  ];
}

export function moatRecommendations(signals: MoatSignal[]): string[] {
  const weakest = [...signals].sort((a, b) => a.strength - b.strength)[0];
  return [
    `Prioritize lifting "${weakest.type.replace(/_/g, " ")}" first — currently lowest relative strength.`,
    "Instrument measurable counters: leads per city, broker attach rate, repeat broker activity.",
    "Keep AI and pricing changes approval-gated so moat deepens without silent risk.",
  ];
}
