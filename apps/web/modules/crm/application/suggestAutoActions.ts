import type { Lead } from "@prisma/client";

export type AutoActionSuggestion = {
  id: string;
  label: string;
  priority: "high" | "medium" | "low";
};

/**
 * Deterministic next-best-action hints for brokers (UI / API).
 */
export function suggestAutoActions(lead: Pick<Lead, "lecipmLeadScore" | "lecipmTrustScore" | "lecipmDealQualityScore" | "lastFollowUpAt" | "highIntent" | "fsboListingId">): AutoActionSuggestion[] {
  const out: AutoActionSuggestion[] = [];

  if ((lead.lecipmLeadScore ?? 0) >= 75 && lead.highIntent) {
    out.push({ id: "call_now", label: "High value + intent — call now", priority: "high" });
  }

  if (lead.fsboListingId && (lead.lecipmTrustScore ?? 100) < 45) {
    out.push({ id: "verify_listing", label: "Low trust listing — verify before proceeding", priority: "high" });
  }

  if ((lead.lecipmDealQualityScore ?? 0) >= 72) {
    out.push({ id: "prioritize_showing", label: "Strong deal signal — prioritize showing", priority: "medium" });
  }

  if (!lead.lastFollowUpAt && (lead.lecipmLeadScore ?? 0) >= 50) {
    out.push({ id: "first_touch", label: "No follow-up logged — schedule first touch", priority: "medium" });
  }

  if (out.length === 0) {
    out.push({ id: "nurture", label: "Keep in nurture sequence", priority: "low" });
  }

  return out;
}
