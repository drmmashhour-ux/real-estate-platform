import { logProductEvent } from "@/src/modules/events/event.service";
import type { ProductEventName } from "@/src/modules/events/event.constants";

export type ContractEngineEvent =
  | "contract_engine_form_loaded"
  | "prefill_run"
  | "validation_run"
  | "suggestion_generated"
  | "document_version_created"
  | "draft_exported";

export async function logContractEngineEvent(
  event: ContractEngineEvent,
  userId: string | null,
  dealId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await logProductEvent({
    eventType: `contract_engine_${event}` as ProductEventName,
    userId,
    entityType: "deal",
    entityId: dealId,
    metadata: { contractEngine: true, event, dealId, ...(metadata ?? {}) },
  });
}
