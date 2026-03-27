import type { LegalAssistantContext } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.types";

export function suggestNextActions(ctx: LegalAssistantContext) {
  const out: string[] = [];
  if (ctx.validation.missingFields.length) out.push("Complete required missing fields.");
  if (ctx.validation.contradictionFlags.length) out.push("Resolve contradiction flags before approval.");
  if (!out.length && ctx.status === "in_review") out.push("Proceed to approve when internal review confirms no external blockers.");
  if (!out.length && ["approved", "finalized"].includes(ctx.status)) out.push("Prepare/export and confirm signature readiness.");
  if (!out.length) out.push("Review section-level details and document timeline.");
  return out;
}
