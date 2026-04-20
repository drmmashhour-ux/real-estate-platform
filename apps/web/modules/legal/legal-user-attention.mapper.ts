import type { LegalIntelligenceSignal } from "./legal-intelligence.types";

export type UserLegalAttentionItem = {
  kind: "document_status" | "requirements" | "upload_activity" | "listing_review";
  title: string;
  detail: string;
  suggestedNextStep: string;
};

export type UserLegalAttentionOptions = {
  /** When true (gated by `FEATURE_LEGAL_FRAUD_ENGINE_V1`), include additional neutral verification prompts. */
  expandedMapping?: boolean;
};

/**
 * Maps internal signals to user-facing, non-accusatory guidance only.
 */
export function toUserSafeAttentionItems(
  signals: LegalIntelligenceSignal[],
  opts?: UserLegalAttentionOptions,
): UserLegalAttentionItem[] {
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
        if (opts?.expandedMapping) {
          const ex = expandedCase(s, kinds);
          if (ex) out.push(ex);
        }
        break;
    }
  }

  return out;
}

function expandedCase(
  s: LegalIntelligenceSignal,
  kinds: Set<string>,
): UserLegalAttentionItem | null {
  switch (s.signalType) {
    case "duplicate_document":
      if (kinds.has("dup-doc")) return null;
      kinds.add("dup-doc");
      return {
        kind: "upload_activity",
        title: "Verification may need a closer look",
        detail: "A submitted item may need manual verification to confirm it matches the checklist for this listing.",
        suggestedNextStep: "Review the checklist, then re-upload or replace the file if anything looks inconsistent.",
      };
    case "duplicate_identity":
      if (kinds.has("dup-id")) return null;
      kinds.add("dup-id");
      return {
        kind: "upload_activity",
        title: "Identity documents may need confirmation",
        detail:
          "We may need to confirm identity details match the listing profile. This is a routine verification step.",
        suggestedNextStep: "Upload the clearest available copies of the requested identity documents.",
      };
    case "metadata_anomaly":
      if (kinds.has("meta")) return null;
      kinds.add("meta");
      return {
        kind: "upload_activity",
        title: "Please check your file details",
        detail:
          "A file detail did not match our usual checks — it can often be resolved by exporting a fresh copy from the original source.",
        suggestedNextStep: "Re-save or re-export the document, then upload again with a simple file name.",
      };
    case "cross_entity_conflict":
      if (kinds.has("cross")) return null;
      kinds.add("cross");
      return {
        kind: "listing_review",
        title: "We may need additional context",
        detail:
          "Something in the submission pattern looks similar to another file on file — we may ask for clarification to keep records accurate.",
        suggestedNextStep: "If prompted, reply with the short clarification request in your seller inbox.",
      };
    case "high_rejection_rate":
      if (kinds.has("high-rej")) return null;
      kinds.add("high-rej");
      return {
        kind: "document_status",
        title: "A previous submission pattern requires review",
        detail:
          "Several recent uploads needed changes. This is common when requirements are tight — nothing is finalized until you confirm the next upload.",
        suggestedNextStep: "Please review and resubmit the requested documents using the reviewer notes as a guide.",
      };
    case "high_risk_submission_burst":
      if (kinds.has("burst")) return null;
      kinds.add("burst");
      return {
        kind: "upload_activity",
        title: "Uploads arrived in quick succession",
        detail:
          "Multiple files were submitted close together — we may process them slightly out of order. You can pause until you see the next request.",
        suggestedNextStep: "Wait for the latest reviewer note before uploading additional versions.",
      };
    case "mismatched_actor_workflow":
      if (kinds.has("actor")) return null;
      kinds.add("actor");
      return {
        kind: "requirements",
        title: "Please confirm who is submitting",
        detail:
          "The current step does not match the expected participant for this workflow. This is usually a quick account or role check.",
        suggestedNextStep: "Sign in with the seller account tied to this listing or ask the listing owner to continue the step.",
      };
    default:
      return null;
  }
}
