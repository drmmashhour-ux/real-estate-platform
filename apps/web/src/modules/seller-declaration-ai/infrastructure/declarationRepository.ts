import { prisma } from "@/lib/db";
import type { DeclarationAiEventInput } from "@/src/modules/seller-declaration-ai/domain/declaration.types";
import { DeclarationDraftStatus } from "@/src/modules/seller-declaration-ai/domain/declaration.enums";
import { Prisma } from "@prisma/client";

export async function getOrCreateDeclarationDraft(args: { listingId: string; sellerUserId?: string | null; adminUserId?: string | null }) {
  const existing = await prisma.sellerDeclarationDraft.findFirst({ where: { listingId: args.listingId }, orderBy: { updatedAt: "desc" } });
  if (existing) return existing;
  return prisma.sellerDeclarationDraft.create({
    data: {
      listingId: args.listingId,
      sellerUserId: args.sellerUserId ?? null,
      adminUserId: args.adminUserId ?? null,
      status: DeclarationDraftStatus.DRAFT,
      draftPayload: {} as Prisma.InputJsonValue,
    },
  });
}

export async function saveDeclarationDraftRow(args: {
  draftId?: string;
  listingId: string;
  sellerUserId?: string | null;
  adminUserId?: string | null;
  status?: DeclarationDraftStatus;
  draftPayload: Record<string, unknown>;
  validationSummary?: Record<string, unknown> | null;
  aiSummary?: Record<string, unknown> | null;
}) {
  if (args.draftId) {
    return prisma.sellerDeclarationDraft.update({
      where: { id: args.draftId },
      data: {
        draftPayload: args.draftPayload as Prisma.InputJsonValue,
        validationSummary: args.validationSummary as Prisma.InputJsonValue | undefined,
        aiSummary: args.aiSummary as Prisma.InputJsonValue | undefined,
        status: args.status ?? undefined,
        adminUserId: args.adminUserId ?? undefined,
      },
    });
  }
  return prisma.sellerDeclarationDraft.create({
    data: {
      listingId: args.listingId,
      sellerUserId: args.sellerUserId ?? null,
      adminUserId: args.adminUserId ?? null,
      status: args.status ?? DeclarationDraftStatus.DRAFT,
      draftPayload: args.draftPayload as Prisma.InputJsonValue,
      validationSummary: args.validationSummary as Prisma.InputJsonValue | undefined,
      aiSummary: args.aiSummary as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createDeclarationAiEvent(input: DeclarationAiEventInput) {
  return prisma.sellerDeclarationAiEvent.create({
    data: {
      draftId: input.draftId,
      sectionKey: input.sectionKey,
      actionType: input.actionType,
      promptContext: input.promptContext as Prisma.InputJsonValue,
      output: input.output as Prisma.InputJsonValue,
    },
  });
}

export async function getDeclarationReviewData(draftId: string) {
  return prisma.sellerDeclarationDraft.findUnique({
    where: { id: draftId },
    include: { aiEvents: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
}
