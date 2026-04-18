/**
 * Maps CRM pipeline labels to nurture stages — uses existing `Lead.pipelineStatus` values.
 */
export type NurtureStage =
  | "new"
  | "contacted"
  | "warm"
  | "qualified"
  | "ready"
  | "converted"
  | "lost"
  | "reengage";

export function mapPipelineToNurtureStage(pipelineStatus: string): NurtureStage {
  const p = pipelineStatus.toLowerCase();
  if (p === "won" || p === "converted") return "converted";
  if (p === "lost") return "lost";
  if (p === "qualified" || p === "meeting" || p === "negotiation") return "qualified";
  if (p === "contacted" || p === "follow_up") return "contacted";
  if (p === "new") return "new";
  return "warm";
}

export function suggestNextNurtureAction(stage: NurtureStage): string {
  switch (stage) {
    case "new":
      return "Send an intro that references the listing or intent; propose a 10-minute call window.";
    case "contacted":
      return "Confirm timeline and budget range; log outcome in CRM notes.";
    case "warm":
      return "Share one relevant comparable or BNHub stay detail — avoid generic blasts.";
    case "qualified":
      return "Move to a structured next step (showing, underwriting, or host onboarding checklist).";
    case "ready":
      return "Prepare documents and platform links; confirm compliance gates.";
    case "converted":
      return "Capture learnings and ask for referral when appropriate.";
    case "lost":
      return "Close the loop politely; tag reason for reporting.";
    case "reengage":
      return "Send a value update (price change, new photos) — drafts require human review.";
    default:
      return "Review lead details and choose a single next step.";
  }
}
