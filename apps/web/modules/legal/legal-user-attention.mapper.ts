import type { LegalIntelligenceSignal } from "./legal-intelligence.types";

export type UserLegalAttentionItem = {
  kind: "document_status" | "requirements" | "upload_activity" | "listing_review";
  title: string;
  detail: string;
  suggestedNextStep: string;
};

/**
 * Maps internal signals to user-facing, non-accusatory guidance only.
 */
export function toUserSafeAttentionItems(signals: LegalIntelligenceSignal[]): UserLegalAttentionItem[] {
  const out: UserLegalAttentionItem[] = [];
  const kinds = new Set<string>();

  for (const s of signals) {
    switch (s.signalType) {
      case "missing_required_cluster":
        if (!kinds.has("missing")) {
          kinds.add("missing");
          out.push({
            kind: "requirements",
            title: "Complete required documents",
            detail:
              "Some mandatory document slots are still incomplete for this listing. Finish uploads so verification can proceed.",
            suggestedNextStep: "Open your seller checklist and upload the remaining required items.",
          });
        }
        break;
      case "suspicious_resubmission_pattern":
        if (!kinds.has("resubmit")) {
          kinds.add("resubmit");
          out.push({
            kind: "upload_activity",
            title: "Review recent uploads",
            detail:
              "We noticed repeated upload activity on this listing. Double-check file types and naming against the checklist.",
            suggestedNextStep: "Replace or correct files per the rejection notes, then resubmit once ready.",
          });
        }
        break;
      case "review_delay_risk":
        if (!kinds.has("delay")) {
          kinds.add("delay");
          out.push({
            kind: "listing_review",
            title: "Review may be queued",
            detail:
              "Some items have been waiting for internal review longer than usual. No action may be needed on your side.",
            suggestedNextStep: "If everything is uploaded, allow a short time for processing or contact support with your listing code.",
          });
        }
        break;
      default:
        break;
    }
  }

  return out;
}
