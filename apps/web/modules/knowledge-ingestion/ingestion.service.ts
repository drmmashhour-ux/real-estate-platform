import { prisma } from "@/lib/db";
import type { IngestionRegisterInput } from "./ingestion.types";

/** Register broker-uploaded reference material for audit and future indexing (no OCR in v1). */
export async function registerDraftingIngestion(input: IngestionRegisterInput & { actorUserId: string }) {
  return prisma.draftingKnowledgeIngestion.create({
    data: {
      sourceType: input.sourceType,
      title: input.title,
      fileUrl: input.fileUrl ?? null,
      status: "indexed",
      metadata: {
        ...(input.metadata ?? {}),
        registeredBy: input.actorUserId,
      } as object,
      brokerScope: input.brokerScope ?? null,
    },
  });
}
