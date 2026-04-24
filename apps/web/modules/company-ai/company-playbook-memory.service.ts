import type { CompanyStrategyDomain } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logCompanyAiAudit } from "./company-ai-audit.service";
import { clampNumber } from "./company-ai-bounds";
import type { DetectedPattern } from "./company-pattern-detection.engine";

/** Updates rolling strategy memory from detected patterns (bounded score moves). */
export async function upsertPlaybookFromPatterns(patterns: DetectedPattern[]): Promise<void> {
  for (const p of patterns) {
    for (const domain of p.domains) {
      const key = `pattern:${p.id}`;
      const delta = clampNumber(p.confidence * 0.08, -0.12, 0.12);
      const existing = await prisma.companyStrategyMemory.findUnique({
        where: { domain_strategyKey: { domain, strategyKey: key } },
      });
      const pos = p.confidence >= 0.55 ? 1 : 0;
      const neg = p.confidence < 0.35 ? 1 : 0;
      const neu = pos || neg ? 0 : 1;

      if (!existing) {
        await prisma.companyStrategyMemory.create({
          data: {
            domain,
            strategyKey: key,
            timesApplied: 1,
            positiveOutcomes: pos,
            negativeOutcomes: neg,
            neutralOutcomes: neu,
            score: delta,
            lastOutcomeAt: new Date(),
          },
        });
      } else {
        await prisma.companyStrategyMemory.update({
          where: { id: existing.id },
          data: {
            timesApplied: { increment: 1 },
            positiveOutcomes: { increment: pos },
            negativeOutcomes: { increment: neg },
            neutralOutcomes: { increment: neu },
            score: clampNumber(existing.score + delta, -1, 1),
            lastOutcomeAt: new Date(),
          },
        });
      }

      await logCompanyAiAudit({
        action: "playbook_memory_updated",
        payload: { domain, strategyKey: key, patternId: p.id, confidence: p.confidence },
      });
    }
  }
}

export async function loadTopPlaybookRules(limit = 12) {
  return prisma.companyStrategyMemory.findMany({
    orderBy: [{ score: "desc" }, { timesApplied: "desc" }],
    take: limit,
  });
}

export async function loadWeakPlaybookRules(limit = 8) {
  return prisma.companyStrategyMemory.findMany({
    where: { score: { lt: 0 } },
    orderBy: { score: "asc" },
    take: limit,
  });
}

export async function penalizeDomainAfterRejection(domain: CompanyStrategyDomain): Promise<void> {
  await prisma.companyStrategyMemory.updateMany({
    where: { domain, score: { gt: -0.99 } },
    data: { score: { decrement: 0.05 } },
  });
}
