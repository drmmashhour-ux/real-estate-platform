import type { Prisma } from "@prisma/client";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export const verificationRuleResultRepository = {
  async replaceForCase(tx: Prisma.TransactionClient, caseId: string, results: RuleEvaluationResult[]) {
    await tx.verificationRuleResult.deleteMany({ where: { caseId } });
    for (const r of results) {
      await tx.verificationRuleResult.create({
        data: {
          caseId,
          ruleCode: r.ruleCode,
          ruleVersion: r.ruleVersion,
          passed: r.passed,
          scoreDelta: r.scoreDelta,
          confidence: r.confidence,
          details: r.details as Prisma.InputJsonValue,
        },
      });
    }
  },
};
