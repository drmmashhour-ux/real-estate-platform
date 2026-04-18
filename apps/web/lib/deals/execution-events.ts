import { logProductEvent } from "@/src/modules/events/event.service";

export async function logDealExecutionEvent(input: {
  eventType:
    | "deal_created"
    | "form_package_selected"
    | "document_prefill_run"
    | "document_issue_detected"
    | "clause_suggestion_generated"
    | "clause_suggestion_approved"
    | "clause_suggestion_rejected"
    | "document_rendered"
    | "export_generated"
    | "review_completed";
  userId: string | null;
  dealId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await logProductEvent({
    eventType: input.eventType,
    userId: input.userId,
    entityType: "deal",
    entityId: input.dealId,
    metadata: { dealId: input.dealId, ...(input.metadata ?? {}) },
  });
}
