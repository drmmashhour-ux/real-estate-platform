import type { Prisma } from "@prisma/client";
import type { TrustGraphActionDraft } from "@/lib/trustgraph/domain/types";

export const nextBestActionRepository = {
  async replaceForCase(tx: Prisma.TransactionClient, caseId: string, actions: TrustGraphActionDraft[]) {
    await tx.nextBestAction.deleteMany({ where: { caseId } });
    for (const a of actions) {
      await tx.nextBestAction.create({
        data: {
          caseId,
          actionCode: a.actionCode,
          title: a.title,
          description: a.description,
          priority: a.priority,
          actorType: a.actorType,
          status: "pending",
          metadata: (a.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    }
  },
};
