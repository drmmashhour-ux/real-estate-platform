import type { NegotiationEngineOutput } from "@/modules/negotiation-copilot/negotiation.types";

export type NegotiationScenario = {
  scenarioId: string;
  title: string;
  summary: string;
  ppToCpChanges: string[];
  pros: string[];
  cons: string[];
  riskNotes: string[];
  recommendedUseCase: string;
  brokerApprovalRequired: true;
  sourceEngine: NegotiationEngineOutput["suggestionType"];
  confidence: number;
  riskLevel: NegotiationEngineOutput["riskLevel"];
};

export type NegotiationAutopilotResult = {
  disclaimer: string;
  scenarios: NegotiationScenario[];
  engineOutputs: NegotiationEngineOutput[];
  riskFlags: unknown[];
};
