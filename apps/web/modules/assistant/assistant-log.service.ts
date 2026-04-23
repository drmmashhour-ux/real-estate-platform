import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import type { AssistantActionType } from "./assistant.types";

/**
 * Durable log for broker assistant executions (lead timeline + server log).
 */
export async function logBrokerAssistantExecution(input: {
  leadId: string | null;
  dealId: string | null;
  brokerUserId: string;
  actionType: AssistantActionType;
  success: boolean;
  resultSummary: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const base = {
    actionType: input.actionType,
    success: input.success,
    result: input.resultSummary,
    dealId: input.dealId,
    actorId: input.brokerUserId,
    ...input.payload,
  };
  if (input.leadId) {
    await appendLeadTimelineEvent(input.leadId, "BROKER_ASSISTANT_EXEC", base);
  } else {
    console.log("[assistant] execution (no lead timeline)", base);
  }
}

export function logAssistantLearning(input: { actionType: AssistantActionType; accepted: boolean; leadId?: string }): void {
  void input;
  // Future: weight model from timeline aggregates — keep hook explicit.
}
