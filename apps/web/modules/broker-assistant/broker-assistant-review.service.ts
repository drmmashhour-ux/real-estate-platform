import type { BrokerAssistantReviewDecision, BrokerAssistantReviewRecord } from "@/modules/broker-assistant/broker-assistant.types";

const decisions = new Map<string, BrokerAssistantReviewRecord>();

export function recordBrokerAssistantReview(input: {
  outputId: string;
  brokerUserId: string;
  decision: BrokerAssistantReviewDecision;
  notes?: string;
}): BrokerAssistantReviewRecord {
  const row: BrokerAssistantReviewRecord = {
    outputId: input.outputId,
    brokerUserId: input.brokerUserId,
    decision: input.decision,
    decidedAt: new Date().toISOString(),
    notes: input.notes,
  };
  decisions.set(input.outputId, row);
  return row;
}

export function getBrokerAssistantReview(outputId: string): BrokerAssistantReviewRecord | undefined {
  return decisions.get(outputId);
}
