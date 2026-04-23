import { prisma } from "@/lib/db";
import { evaluateCeoDecisionOutcome } from "./ceo-outcome-evaluator.service";
import { aiCeoLog } from "../ai-ceo/ai-ceo-log";

/**
 * PHASE 5: META-LEARNING ENGINE
 * Aggregates individual decision outcomes into strategic patterns.
 * Updates the patterns database to guide future decisions.
 */

/**
 * Refreshes all strategy patterns based on the latest decision outcomes.
 * Usually runs as a background job after outcome evaluations.
 */
export async function updateCeoStrategyPatterns() {
  // 1. evaluate all pending outcomes first
  const pendingMemories = await prisma.ceoDecisionMemory.findMany({
    where: { 
      outcomes: { none: {} },
      // At least 24h old
      createdAt: { lt: new Date(Date.now() - 86400000) }
    },
    select: { id: true }
  });
  
  console.log(`[ceo-meta] evaluating ${pendingMemories.length} pending outcomes`);
  for (const m of pendingMemories) {
    try {
      await evaluateCeoDecisionOutcome(m.id);
    } catch (e) {
      console.error(`[ceo-meta] failed to evaluate outcome for ${m.id}`, e);
    }
  }

  // 2. Load all evaluated memories to rebuild patterns
  // Note: For massive scale, we'd use a more incremental aggregation.
  const memories = await prisma.ceoDecisionMemory.findMany({
    include: { outcomes: true },
    where: { outcomes: { some: {} } }
  });

  const patternMap: Record<string, {
    domain: string;
    fingerprint: string;
    type: string;
    pos: number;
    neu: number;
    neg: number;
    totalScore: number;
  }> = {};

  for (const m of memories) {
    const outcome = m.outcomes[0];
    if (!outcome) continue;

    const key = `${m.domain}:${m.contextFingerprint}:${m.decisionType}`;
    
    if (!patternMap[key]) {
      patternMap[key] = {
        domain: m.domain,
        fingerprint: m.contextFingerprint,
        type: m.decisionType,
        pos: 0, neu: 0, neg: 0, totalScore: 0
      };
    }

    const p = patternMap[key];
    if (outcome.resultLabel === "POSITIVE") p.pos++;
    else if (outcome.resultLabel === "NEGATIVE") p.neg++;
    else p.neu++;
    
    p.totalScore += outcome.impactScore;
  }

  console.log(`[ceo-meta] updating ${Object.keys(patternMap).length} strategy patterns`);

  // 3. Persist patterns
  for (const [key, p] of Object.entries(patternMap)) {
    const timesUsed = p.pos + p.neu + p.neg;
    // Simple average score
    let score = p.totalScore / timesUsed;
    
    // Safety bound for reinforcement
    score = Math.max(-50, Math.min(50, score));

    await prisma.ceoStrategyPattern.upsert({
      where: { patternKey: key },
      update: {
        timesUsed,
        positiveCount: p.pos,
        neutralCount: p.neu,
        negativeCount: p.neg,
        score,
        updatedAt: new Date(),
      },
      create: {
        patternKey: key,
        domain: p.domain,
        contextFingerprint: p.fingerprint,
        timesUsed,
        positiveCount: p.pos,
        neutralCount: p.neu,
        negativeCount: p.neg,
        score,
      }
    });
  }

  aiCeoLog("info", "strategy_patterns_updated", { patternCount: Object.keys(patternMap).length });
}
