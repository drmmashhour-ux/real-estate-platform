import type {
  LecipmBrokerCrmLead,
  LecipmBrokerListingMessage,
  LecipmBrokerAutopilotActionType,
} from "@prisma/client";

export type AutopilotCandidate = {
  actionType: LecipmBrokerAutopilotActionType;
  title: string;
  reason: string;
  reasonBucket: string;
  scheduledFor?: Date;
};

const VISIT_RE =
  /visit|tour|showing|see (the )?(property|place|unit|home|condo)|walkthrough|disponible pour visite|visite/i;
const CALLBACK_RE = /call (me|back)|callback|phone|rappel|joindre/i;
const INTENT_RE =
  /ready to (buy|make an offer)|pre-?approved|mortgage|financing|serious (buyer|offer)|timeline|soon/i;

function inboundRole(role: string) {
  return role === "customer" || role === "guest";
}

function brokerRole(role: string) {
  return role === "broker" || role === "admin";
}

/**
 * Rule-based signals for autopilot (no LLM). Used by scan + hot detection.
 */
export function evaluateLeadAutopilotRules(input: {
  lead: Pick<LecipmBrokerCrmLead, "status" | "nextFollowUpAt" | "priorityLabel">;
  messages: Pick<LecipmBrokerListingMessage, "senderRole" | "body" | "createdAt">[];
  now: Date;
  autoSuggestVisits: boolean;
}): AutopilotCandidate[] {
  const { lead, messages, now, autoSuggestVisits } = input;
  const out: AutopilotCandidate[] = [];
  const sorted = [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const texts = sorted.map((m) => m.body.toLowerCase()).join("\n");

  if (lead.status === "closed" || lead.status === "lost") {
    return [];
  }

  // 1) Calendar follow-up
  if (lead.nextFollowUpAt && lead.nextFollowUpAt.getTime() <= now.getTime()) {
    out.push({
      actionType: "follow_up_due",
      title: "Follow up now",
      reason: "The scheduled follow-up time has passed or is due.",
      reasonBucket: "followup_calendar",
      scheduledFor: lead.nextFollowUpAt,
    });
  }

  // 2) Reply now — last message inbound, no broker reply after it
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    if (inboundRole(last.senderRole)) {
      const brokerAfter = sorted.some((m) => m.createdAt > last.createdAt && brokerRole(m.senderRole));
      if (!brokerAfter) {
        out.push({
          actionType: "reply_now",
          title: "Reply suggested",
          reason: "The lead wrote in and there is no broker reply after their latest message.",
          reasonBucket: "inbound_no_reply",
        });
      }
    }
  }

  // 3) Visit scheduling suggestion
  if (autoSuggestVisits && VISIT_RE.test(texts) && lead.status !== "visit_scheduled") {
    out.push({
      actionType: "schedule_visit",
      title: "Visit recommended",
      reason: "The conversation mentions a visit or tour — offer times when you reply.",
      reasonBucket: "visit_request",
    });
  }

  // 4) Mark qualified hint
  if ((INTENT_RE.test(texts) || CALLBACK_RE.test(texts)) && lead.status === "new") {
    out.push({
      actionType: "mark_qualified",
      title: "Consider marking as qualified",
      reason: "Strong interest or callback intent appeared in the thread.",
      reasonBucket: "intent_qualified_hint",
    });
  }

  // 5) Re-engage — qualified (or active negotiation) stale
  const lastAt = sorted.length ? sorted[sorted.length - 1].createdAt.getTime() : 0;
  const staleMs = 48 * 60 * 60 * 1000;
  if (
    (lead.status === "qualified" || lead.status === "contacted") &&
    lastAt > 0 &&
    now.getTime() - lastAt > staleMs
  ) {
    out.push({
      actionType: "reengage_lead",
      title: "Re-engage this lead",
      reason: "No thread activity for more than 48 hours while the lead is still active.",
      reasonBucket: "qualified_stale",
    });
  }

  // 6) Suggest closing as lost — repeated broker outreach, little/no customer engagement
  const brokerMsgs = sorted.filter((m) => brokerRole(m.senderRole));
  const customerMsgs = sorted.filter((m) => inboundRole(m.senderRole));
  const lastCustomer = [...sorted].reverse().find((m) => inboundRole(m.senderRole));
  const lastOverall = sorted.length ? sorted[sorted.length - 1] : null;
  if (
    brokerMsgs.length >= 3 &&
    lastCustomer &&
    lastOverall &&
    brokerRole(lastOverall.senderRole) &&
    lastOverall.createdAt.getTime() - lastCustomer.createdAt.getTime() > 72 * 60 * 60 * 1000 &&
    customerMsgs.length <= 2
  ) {
    out.push({
      actionType: "close_lost",
      title: "Consider closing as lost",
      reason:
        "Several broker messages with limited lead responses — it may be time to close or pause this lead.",
      reasonBucket: "ghosted_lead",
    });
  }

  return dedupeCandidatesByBucket(out);
}

function dedupeCandidatesByBucket(candidates: AutopilotCandidate[]): AutopilotCandidate[] {
  const seen = new Set<string>();
  const res: AutopilotCandidate[] = [];
  for (const c of candidates) {
    if (seen.has(c.reasonBucket)) continue;
    seen.add(c.reasonBucket);
    res.push(c);
  }
  return res;
}
