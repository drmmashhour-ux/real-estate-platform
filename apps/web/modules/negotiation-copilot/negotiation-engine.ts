import type { CanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { runAllStrategies } from "./negotiation-strategies.service";
import type { NegotiationEngineOutput } from "./negotiation.types";
import { flagNegotiationRisks } from "./negotiation-risk.service";

export function runNegotiationEngine(input: {
  ppMap: Record<string, unknown>;
  deal: CanonicalDealShape;
  daysOnMarket?: number | null;
}): { outputs: NegotiationEngineOutput[]; riskFlags: ReturnType<typeof flagNegotiationRisks> } {
  const outputs = runAllStrategies(input);
  const riskFlags = flagNegotiationRisks(outputs);
  return { outputs, riskFlags };
}
