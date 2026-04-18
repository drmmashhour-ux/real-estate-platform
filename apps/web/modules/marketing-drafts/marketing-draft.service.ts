import type { ListingMarketingContentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MarketingDraftPayload } from "./marketing-draft.types";

export async function listMarketingDrafts(listingId: string, brokerId: string) {
  return prisma.listingMarketingDraft.findMany({
    where: { listingId, brokerId },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });
}

export async function createMarketingDraft(input: {
  listingId: string;
  brokerId: string;
  payload: MarketingDraftPayload;
  status?: ListingMarketingContentStatus;
}): Promise<{ id: string }> {
  const row = await prisma.listingMarketingDraft.create({
    data: {
      listingId: input.listingId,
      brokerId: input.brokerId,
      draftType: input.payload.draftType,
      channel: input.payload.channel,
      title: input.payload.title ?? null,
      subject: input.payload.subject ?? null,
      body: input.payload.body,
      status: input.status ?? "draft",
      metadata: (input.payload.metadata ?? {}) as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return row;
}

export async function updateDraftStatus(input: {
  draftId: string;
  listingId: string;
  brokerId: string;
  status: ListingMarketingContentStatus;
}): Promise<boolean> {
  const res = await prisma.listingMarketingDraft.updateMany({
    where: { id: input.draftId, listingId: input.listingId, brokerId: input.brokerId },
    data: { status: input.status },
  });
  return res.count > 0;
}

export async function persistSuggestions(input: {
  listingId: string;
  brokerId: string;
  items: { suggestionType: string; title: string; summary: string; payload: Record<string, unknown>; confidence: number }[];
}) {
  if (input.items.length === 0) return;
  await prisma.listingMarketingSuggestion.createMany({
    data: input.items.map((i) => ({
      listingId: input.listingId,
      brokerId: input.brokerId,
      suggestionType: i.suggestionType,
      title: i.title,
      summary: i.summary,
      payload: i.payload as Prisma.InputJsonValue,
      confidence: i.confidence,
      status: "ready_for_review",
    })),
  });
}
