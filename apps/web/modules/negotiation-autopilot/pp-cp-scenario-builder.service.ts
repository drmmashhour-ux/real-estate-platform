import { randomUUID } from "crypto";
import type { NegotiationEngineOutput } from "@/modules/negotiation-copilot/negotiation.types";
import type { NegotiationScenario } from "./negotiation-autopilot.types";

/**
 * Turns engine outputs into broker-reviewable scenarios — no new legal content beyond engine payloads.
 */
export function buildScenariosFromEngineOutputs(outputs: NegotiationEngineOutput[]): NegotiationScenario[] {
  return outputs.map((o) => ({
    scenarioId: randomUUID(),
    title: o.title,
    summary: o.summary,
    ppToCpChanges: [o.payload.recommendedMove, ...o.payload.rationale.slice(0, 2)],
    pros: o.payload.rationale,
    cons: o.payload.tradeoffs,
    riskNotes: o.payload.riskNotes,
    recommendedUseCase: o.impactEstimate,
    brokerApprovalRequired: true,
    sourceEngine: o.suggestionType,
    confidence: o.confidence,
    riskLevel: o.riskLevel,
  }));
}
