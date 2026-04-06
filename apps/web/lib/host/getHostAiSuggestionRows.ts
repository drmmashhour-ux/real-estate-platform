import { AiSuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type HostAiSuggestionRow = {
  id: string;
  type: string;
  title: string;
  description: string;
  confidenceScore: number | null;
  listingId: string | null;
  status: string;
  createdAt: Date;
};

export async function getHostAiSuggestionRows(hostId: string, take = 20): Promise<HostAiSuggestionRow[]> {
  return prisma.aiSuggestion.findMany({
    where: { hostId, status: AiSuggestionStatus.PENDING },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      confidenceScore: true,
      listingId: true,
      status: true,
      createdAt: true,
    },
  });
}
