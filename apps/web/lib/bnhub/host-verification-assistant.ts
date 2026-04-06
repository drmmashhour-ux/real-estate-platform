import type { ModerationRequirement } from "@/lib/bnhub/moderation-requirements";

/**
 * Human-readable copy for hosts (positioned as automated assistant guidance).
 * No external LLM call — deterministic from checklist rows.
 */
export function formatAssistantChecklistMessage(
  listingTitle: string,
  requirements: ModerationRequirement[]
): string {
  const gaps = requirements.filter((r) => r.status !== "complete");
  if (gaps.length === 0) {
    return `Your listing “${listingTitle}” looks complete against our verification checklist. You can submit for review.`;
  }
  const lines = gaps.map((r) => {
    const state = r.status === "missing" ? "Still needed" : "Please improve";
    return `• ${state}: ${r.label}${r.hint ? ` — ${r.hint}` : ""}`;
  });
  return [
    `Listing: “${listingTitle}”`,
    "",
    "Here is what our verification assistant found before your listing can be approved:",
    "",
    ...lines,
    "",
    "Open your listing editor to upload documents, add photos, and complete identity verification where required.",
  ].join("\n");
}

export function formatAssistantApprovalMessage(params: {
  listingTitle: string;
  listingCode: string;
  internalId: string;
}): string {
  return [
    `Your stay “${params.listingTitle}” has been approved.`,
    "",
    `Host reference code (use for support & payouts): ${params.listingCode}`,
    `Internal listing ID (banking / wire references): ${params.internalId}`,
    "",
    "When you contact us or reconcile transfers, quote the host reference code above.",
  ].join("\n");
}
