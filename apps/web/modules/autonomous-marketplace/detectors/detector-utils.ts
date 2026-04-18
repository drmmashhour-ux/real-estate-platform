import { randomUUID } from "crypto";
import type { ActionType, DomainTarget, Opportunity, ProposedAction, RiskLevel } from "../types/domain.types";

export function makeProposedAction(input: {
  type: ActionType;
  target: DomainTarget;
  detectorId: string;
  opportunityId: string;
  confidence: number;
  risk: RiskLevel;
  title: string;
  explanation: string;
  humanReadableSummary: string;
  metadata?: Record<string, unknown>;
}): ProposedAction {
  return {
    id: `pa-${randomUUID()}`,
    type: input.type,
    target: input.target,
    confidence: input.confidence,
    risk: input.risk,
    title: input.title,
    explanation: input.explanation,
    humanReadableSummary: input.humanReadableSummary,
    metadata: input.metadata ?? {},
    suggestedAt: new Date().toISOString(),
    sourceDetectorId: input.detectorId,
    opportunityId: input.opportunityId,
  };
}

export function makeOpportunity(input: {
  detectorId: string;
  title: string;
  explanation: string;
  confidence: number;
  risk: RiskLevel;
  evidence: Record<string, unknown>;
  actions: ProposedAction[];
}): Opportunity {
  return {
    id: `opp-${randomUUID()}`,
    detectorId: input.detectorId,
    title: input.title,
    explanation: input.explanation,
    confidence: input.confidence,
    risk: input.risk,
    evidence: input.evidence,
    proposedActions: input.actions,
    createdAt: new Date().toISOString(),
  };
}
