import type { Prisma } from "@prisma/client";
import type { TrustGraphSignalDraft } from "@/lib/trustgraph/domain/types";

export const verificationSignalRepository = {
  async replaceForCase(tx: Prisma.TransactionClient, caseId: string, signals: TrustGraphSignalDraft[]) {
    await tx.verificationSignal.deleteMany({ where: { caseId } });
    for (const s of signals) {
      await tx.verificationSignal.create({
        data: {
          caseId,
          signalCode: s.signalCode,
          signalName: s.signalName,
          category: s.category,
          severity: s.severity,
          status: "open",
          scoreImpact: s.scoreImpact,
          confidence: s.confidence,
          evidence: s.evidence as Prisma.InputJsonValue,
          message: s.message,
        },
      });
    }
  },
};
