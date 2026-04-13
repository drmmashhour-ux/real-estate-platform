import type { LecipmBrokerCrmLead } from "@prisma/client";

export function isFollowUpOverdue(lead: Pick<LecipmBrokerCrmLead, "nextFollowUpAt" | "status">, now: Date): boolean {
  if (lead.status === "closed" || lead.status === "lost") return false;
  if (!lead.nextFollowUpAt) return false;
  return lead.nextFollowUpAt.getTime() < now.getTime();
}

export function isFollowUpDueToday(
  lead: Pick<LecipmBrokerCrmLead, "nextFollowUpAt" | "status">,
  now: Date
): boolean {
  if (lead.status === "closed" || lead.status === "lost") return false;
  if (!lead.nextFollowUpAt) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const t = lead.nextFollowUpAt.getTime();
  return t >= start.getTime() && t < end.getTime();
}
