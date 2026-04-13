import { findAutopilotActionForBroker } from "@/lib/broker-autopilot/access";

/**
 * Prepares execution: returns thread + draft for the broker composer.
 * Does not send messages (MVP: broker sends via existing CRM message API).
 */
export async function prepareExecuteAutopilotAction(actionId: string, brokerUserId: string, isAdmin: boolean) {
  const action = await findAutopilotActionForBroker(actionId, brokerUserId, isAdmin);
  if (!action) throw new Error("Not found");
  if (action.status !== "approved" && action.status !== "queued") {
    throw new Error("Approve this action before opening the composer");
  }

  const threadId = action.lead.threadId ?? action.threadId;
  if (!threadId) throw new Error("No messaging thread for this lead");

  return {
    leadId: action.leadId,
    threadId,
    draftMessage: action.draftMessage ?? "",
    title: action.title,
    actionType: action.actionType,
  };
}
