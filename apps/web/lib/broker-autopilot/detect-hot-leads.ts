import type { LecipmBrokerCrmLead, LecipmBrokerListingMessage } from "@prisma/client";

const VISIT_RE =
  /visit|tour|showing|see (the )?(property|place|unit|home|condo)|walkthrough|disponible pour visite|visite/i;
const CALLBACK_RE = /call (me|back)|callback|phone|rappel|joindre/i;

/** Heuristic “hot” lead for autopilot prioritization (rule-based). */
export function isHotLeadSignal(input: {
  lead: Pick<LecipmBrokerCrmLead, "priorityLabel">;
  messages: Pick<LecipmBrokerListingMessage, "senderRole" | "body" | "createdAt">[];
  now: Date;
}): boolean {
  const { lead, messages, now } = input;
  if (lead.priorityLabel === "high") return true;
  const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const recent = messages.filter((m) => m.createdAt.getTime() >= dayAgo);
  if (recent.length >= 3) return true;
  const text = messages.map((m) => m.body.toLowerCase()).join("\n");
  if (VISIT_RE.test(text) || CALLBACK_RE.test(text)) return true;
  return false;
}
