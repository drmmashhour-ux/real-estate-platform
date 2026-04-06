import type { AiSuggestionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function createAiSuggestionRow(input: {
  listingId?: string | null;
  hostId?: string | null;
  type: AiSuggestionType;
  title: string;
  description: string;
  payload?: Prisma.InputJsonValue;
  confidenceScore?: number | null;
}) {
  return prisma.aiSuggestion.create({
    data: {
      listingId: input.listingId ?? undefined,
      hostId: input.hostId ?? undefined,
      type: input.type,
      title: input.title,
      description: input.description,
      payload: input.payload,
      confidenceScore: input.confidenceScore ?? undefined,
    },
  });
}
