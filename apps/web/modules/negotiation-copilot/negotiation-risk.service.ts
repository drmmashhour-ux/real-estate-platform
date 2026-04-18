import type { NegotiationEngineOutput } from "./negotiation.types";

export type NegotiationRiskFlag = { code: string; message: string; severity: "warn" | "info" };

export function flagNegotiationRisks(outputs: NegotiationEngineOutput[]): NegotiationRiskFlag[] {
  const flags: NegotiationRiskFlag[] = [];
  for (const o of outputs) {
    if (o.riskLevel === "high") {
      flags.push({
        code: "high_impact_suggestion",
        severity: "warn",
        message: `High-impact: ${o.title} — ensure client instructions before any draft.`,
      });
    }
  }
  return flags;
}
