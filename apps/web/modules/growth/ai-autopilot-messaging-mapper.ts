import type { AiMessagingAssistInput } from "./ai-autopilot-messaging.types";

/** Map a CRM `Lead` row (subset) to messaging-assist input — read-only; does not mutate. */
export function leadRowToMessagingInput(
  row: {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    listingId: string | null;
    listingCode: string | null;
    aiScore: number | null;
    aiPriority: string | null;
    aiTags: unknown;
    createdAt: Date;
  },
  closingContext?: { closingStage?: string | null; followUpDraftHint?: string | null },
): AiMessagingAssistInput {
  return {
    leadId: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    listingId: row.listingId,
    listingCode: row.listingCode,
    aiScore: row.aiScore,
    aiPriority: row.aiPriority,
    aiTags: row.aiTags,
    createdAt: row.createdAt,
    closingStage: closingContext?.closingStage ?? undefined,
    followUpDraftHint: closingContext?.followUpDraftHint ?? undefined,
  };
}
