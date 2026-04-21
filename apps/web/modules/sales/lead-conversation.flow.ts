/**
 * Conversation flow: maps activity to the next script (1–5) in the linear funnel.
 */

import type { SalesScriptId } from "./message-generator";

export type LeadConversationTrigger =
  | "lead_created"
  | "email_opened"
  | "no_response_24h"
  | "property_viewed"
  | "time_delay"
  | "click";

export function suggestedScriptForTrigger(args: {
  trigger: LeadConversationTrigger;
  lastDeliveredScriptId?: SalesScriptId;
}): SalesScriptId {
  const last = args.lastDeliveredScriptId;

  switch (args.trigger) {
    case "lead_created":
      return 1;
    case "email_opened":
      return last != null && last >= 2 ? (Math.min(5, last + 1) as SalesScriptId) : 2;
    case "property_viewed":
      return last != null && last >= 3 ? 4 : 3;
    case "no_response_24h":
      return last != null && last >= 4 ? 5 : 4;
    case "time_delay":
      return last != null && last >= 3 ? 4 : 3;
    case "click":
      return 5;
    default: {
      const x: never = args.trigger;
      return x;
    }
  }
}
