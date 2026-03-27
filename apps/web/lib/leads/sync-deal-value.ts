import type { Prisma } from "@prisma/client";
import { extractEvaluationSnapshot } from "@/lib/leads/timeline-helpers";
import { estimateBrokerCommissionDollars } from "@/lib/leads/commission";

export function dealValueFromLead(lead: {
  dealValue: number | null;
  aiExplanation: Prisma.JsonValue | null;
}): number | null {
  if (lead.dealValue != null && lead.dealValue > 0) return lead.dealValue;
  const snap = extractEvaluationSnapshot(lead.aiExplanation);
  const v = snap?.estimate;
  return v != null && v > 0 ? v : null;
}

export function commissionForLead(lead: {
  dealValue: number | null;
  aiExplanation: Prisma.JsonValue | null;
}): number | null {
  return estimateBrokerCommissionDollars(dealValueFromLead(lead));
}
