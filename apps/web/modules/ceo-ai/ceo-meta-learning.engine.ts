import { prisma } from "@/lib/db";

export class CeoMetaLearningEngine {
  /**
   * Aggregates past CEO decisions into reusable patterns.
   */
  static async updateCeoStrategyPatterns() {
    const outcomes = await prisma.ceoDecisionOutcome.findMany({
      include: {
        memory: true,
      },
    });

    for (const outcome of outcomes) {
      const patternKey = `${outcome.memory.decisionType}_${outcome.memory.domain}`;
      const fingerprint = outcome.memory.contextFingerprint;

      const existing = await prisma.ceoStrategyPattern.findUnique({
        where: { patternKey: `${patternKey}_${fingerprint}` },
      });

      if (existing) {
        await prisma.ceoStrategyPattern.update({
          where: { id: existing.id },
          data: {
            timesUsed: existing.timesUsed + 1,
            positiveCount: outcome.resultLabel === "POSITIVE" ? existing.positiveCount + 1 : existing.positiveCount,
            neutralCount: outcome.resultLabel === "NEUTRAL" ? existing.neutralCount + 1 : existing.neutralCount,
            negativeCount: outcome.resultLabel === "NEGATIVE" ? existing.negativeCount + 1 : existing.negativeCount,
            score: this.calculateScore(existing, outcome.resultLabel),
          },
        });
      } else {
        await prisma.ceoStrategyPattern.create({
          data: {
            patternKey: `${patternKey}_${fingerprint}`,
            domain: outcome.memory.domain,
            contextFingerprint: fingerprint,
            timesUsed: 1,
            positiveCount: outcome.resultLabel === "POSITIVE" ? 1 : 0,
            neutralCount: outcome.resultLabel === "NEUTRAL" ? 1 : 0,
            negativeCount: outcome.resultLabel === "NEGATIVE" ? 1 : 0,
            score: outcome.resultLabel === "POSITIVE" ? 1 : outcome.resultLabel === "NEGATIVE" ? -1 : 0,
          },
        });
      }
    }
  }

  private static calculateScore(existing: any, resultLabel: string): number {
    let delta = 0;
    if (resultLabel === "POSITIVE") delta = 1;
    else if (resultLabel === "NEGATIVE") delta = -1;

    const newScore = existing.score + delta;
    // Bounded score to avoid runaway reinforcement
    return Math.max(-10, Math.min(10, newScore));
  }
}
