import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { AutoDraftingActionType } from "@prisma/client";
import type { StandardDraftOutput } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";

export async function recordAutoDraftingEvent(args: {
  documentId: string;
  sectionKey?: string | null;
  actionType: AutoDraftingActionType;
  createdBy: string;
  inputPayload: Record<string, unknown>;
  output: StandardDraftOutput | Record<string, unknown>;
}) {
  return prisma.autoDraftingEvent.create({
    data: {
      documentId: args.documentId,
      sectionKey: args.sectionKey ?? null,
      actionType: args.actionType,
      createdBy: args.createdBy,
      inputPayload: args.inputPayload as Prisma.InputJsonValue,
      outputPayload: args.output as unknown as Prisma.InputJsonValue,
    },
  });
}
