import { DraftConfidence } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.enums";
import type { GroundedNegotiationDraftContext } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";

const NO_PROMISE =
  "This text does not promise an outcome, acceptance, or savings. It is a discussion aid only until your professional approves.";

/**
 * Deterministic confidence from known signals only.
 */
export function computeDraftConfidence(ctx: GroundedNegotiationDraftContext): DraftConfidence {
  if (ctx.blockingLabels.length > 0 || ctx.contradictionSummaries.length > 0) return DraftConfidence.Low;
  if (ctx.missingFieldLabels.length > 4 || ctx.completenessPercent < 70) return DraftConfidence.Low;
  if (ctx.missingFieldLabels.length > 0 || ctx.completenessPercent < 90 || ctx.warningLabels.length > 3) {
    return DraftConfidence.Medium;
  }
  return DraftConfidence.High;
}

export function uncertaintyPreamble(confidence: DraftConfidence): string {
  if (confidence === DraftConfidence.Low) {
    return "Uncertainty is elevated: key file items are still open. Prefer clarification over aggressive terms until resolved.";
  }
  if (confidence === DraftConfidence.Medium) {
    return "Some items remain open; keep conditions explicit and verify before firming.";
  }
  return "";
}

export function blockersFavorClarification(ctx: GroundedNegotiationDraftContext): boolean {
  return ctx.blockingLabels.length > 0 || ctx.contradictionSummaries.length > 0 || ctx.missingFieldLabels.length > 2;
}

export function appendPolicyFooter(message: string, confidence: DraftConfidence): string {
  const u = uncertaintyPreamble(confidence);
  const parts = [message.trim()];
  if (u) parts.push("", u);
  parts.push("", NO_PROMISE);
  return parts.join("\n");
}
