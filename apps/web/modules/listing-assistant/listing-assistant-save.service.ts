import { prisma } from "@/lib/db";
import { recordListingAssistantVersion } from "@/modules/listing-assistant/listing-version.service";
import type { ListingAssistantContentSnapshot } from "@/modules/listing-assistant/listing-version.types";

/**
 * Persists AI/broker text into `Listing.assistantDraftContent` only — **never** toggles marketplace publish flags.
 */
export async function saveListingAssistantDraftToCrm(params: {
  listingId: string;
  content: ListingAssistantContentSnapshot;
  actorUserId: string;
  source: "AI_ASSISTANT" | "BROKER_MANUAL";
}): Promise<void> {
  await prisma.listing.update({
    where: { id: params.listingId },
    data: {
      assistantDraftContent: params.content as object,
      assistantDraftSource: params.source,
      assistantDraftUpdatedAt: new Date(),
    },
  });

  await recordListingAssistantVersion({
    listingId: params.listingId,
    phase: "SAVED_DRAFT",
    content: params.content,
    source: params.source,
    actorUserId: params.actorUserId,
  });
}
