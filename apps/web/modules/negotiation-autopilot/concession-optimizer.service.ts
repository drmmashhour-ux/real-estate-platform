import type { NegotiationEngineOutput } from "@/modules/negotiation-copilot/negotiation.types";

/** Surfaces concession-related outputs only — no optimization beyond ordering by confidence. */
export function listConcessionStrategies(outputs: NegotiationEngineOutput[]): NegotiationEngineOutput[] {
  const keys = new Set([
    "counter_offer",
    "deposit_adjustment",
    "concession_bundle",
    "occupancy_adjustment",
    "financing_adjustment",
    "inspection_adjustment",
  ]);
  return outputs.filter((o) => keys.has(o.suggestionType)).sort((a, b) => b.confidence - a.confidence);
}
