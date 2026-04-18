import type { NegotiationEngineOutput } from "./negotiation.types";

/** Flags suggestions that materially weaken buyer position on price/deposit heuristics. */
export function guardConcessions(output: NegotiationEngineOutput): { ok: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (output.suggestionType === "counter_offer" && output.payload.rationale.some((r) => r.toLowerCase().includes("firm"))) {
    warnings.push("Counter-offer language may be interpreted as ultimatum — align with brokerage tone.");
  }
  return { ok: true, warnings };
}
