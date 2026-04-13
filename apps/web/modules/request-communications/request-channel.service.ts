/**
 * v1: drafts + logs only unless FEATURE_COORDINATION_LIVE_EMAIL is enabled elsewhere.
 */

export const CHANNEL_COPY = {
  IN_APP: "In-app task / note (visible to authorized deal participants).",
  EMAIL_DRAFT: "Email draft — copy to your mail client or CRM; LECIPM does not send as lender/notary.",
  MANUAL_EXPORT: "Export / copy for your brokerage workflow.",
} as const;
