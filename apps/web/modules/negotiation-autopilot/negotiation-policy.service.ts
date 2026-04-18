import { assertBrokerDriven } from "@/modules/negotiation-copilot/negotiation-policy.service";
import type { NegotiationAutopilotResult } from "./negotiation-autopilot.types";

export function applyNegotiationGuards(result: NegotiationAutopilotResult): NegotiationAutopilotResult {
  assertBrokerDriven();
  return result;
}
