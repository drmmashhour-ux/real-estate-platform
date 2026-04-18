import type { NegotiationEngineOutput } from "@/modules/negotiation-copilot/negotiation.types";
import { flagNegotiationRisks } from "@/modules/negotiation-copilot/negotiation-risk.service";

export function mapEngineRisks(outputs: NegotiationEngineOutput[]) {
  return flagNegotiationRisks(outputs);
}
