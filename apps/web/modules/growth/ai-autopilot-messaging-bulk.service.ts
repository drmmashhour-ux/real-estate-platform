/**
 * Bulk deterministic drafts for admin views — no DB writes here.
 */

import { logInfo } from "@/lib/logger";
import type { AiMessagingAssistInput, AiMessagingAssistResult } from "./ai-autopilot-messaging.types";
import { buildLeadReplyDraft } from "./ai-autopilot-messaging-assist.service";
import { recordDraftsGenerated } from "./ai-autopilot-messaging-monitoring.service";

export function buildReplyDraftsForLeads(leads: AiMessagingAssistInput[]): AiMessagingAssistResult[] {
  const out: AiMessagingAssistResult[] = [];
  let high = 0;
  for (const lead of leads) {
    const d = buildLeadReplyDraft(lead, { logEach: false });
    if (d) {
      out.push(d);
      if (lead.aiPriority === "high") high += 1;
    }
  }
  if (out.length > 0) {
    recordDraftsGenerated(out.length, { highPriority: high });
    logInfo("[autopilot:messaging]", {
      event: "bulk_drafts",
      count: out.length,
      highPriority: high,
    });
  }
  return out;
}
