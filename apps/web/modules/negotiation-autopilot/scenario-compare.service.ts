import type { NegotiationScenario } from "./negotiation-autopilot.types";

export function compareScenarios(a: NegotiationScenario, b: NegotiationScenario): { summary: string } {
  return {
    summary: `“${a.title}” vs “${b.title}” — compare risk notes and tradeoffs before proposing either.`,
  };
}
