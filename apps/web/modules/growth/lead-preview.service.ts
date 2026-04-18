/**
 * Masked lead preview for broker acquisition + CRM — no PII; additive helpers only.
 */

import { extractLeadCity } from "@/lib/leads/timeline-helpers";

export type LeadPreviewMasked = {
  location: string;
  intent: string;
  shortMessage: string;
};

type LeadLike = {
  message: string;
  dealValue?: number | null;
  estimatedValue?: number | null;
  leadType?: string | null;
  leadSource?: string | null;
  aiExplanation?: unknown;
};

/**
 * Build a masked preview from any lead-shaped row (no DB read).
 */
export function buildLeadPreview(lead: LeadLike): LeadPreviewMasked {
  const city = extractLeadCity({
    aiExplanation: lead.aiExplanation,
    message: lead.message ?? "",
  });
  const intent =
    [lead.leadType, lead.leadSource].filter(Boolean).join(" · ") || "Buyer / platform inquiry";

  const raw = (lead.message ?? "").trim();
  const msg = raw.slice(0, 220);
  const shortMessage = msg.length < raw.length ? `${msg}…` : msg;

  return {
    location: city || "Québec (metro)",
    intent,
    shortMessage: shortMessage || "—",
  };
}
