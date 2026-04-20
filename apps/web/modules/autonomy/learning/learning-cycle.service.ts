import { prisma } from "@/lib/db";
import { evaluateActionOutcome } from "./outcome-evaluator.service";

const configWindowCache = new Map<string, number>();

async function learningWindowDaysForScope(scopeType: string, scopeId: string): Promise<number> {
  const k = `${scopeType}:${scopeId}`;
  if (configWindowCache.has(k)) return configWindowCache.get(k)!;

  const cfg = await prisma.autonomyConfig.findUnique({
    where: {
      scopeType_scopeId: {
        scopeType,
        scopeId,
      },
    },
    select: { learningWindowDays: true },
  });

  const days = cfg?.learningWindowDays ?? 7;
  configWindowCache.set(k, days);
  return days;
}

function olderThanWindow(createdAt: Date, windowDays: number): boolean {
  const cutoff = new Date();
  cutoff.setTime(cutoff.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return createdAt <= cutoff;
}

export async function runLearningCycle() {
  configWindowCache.clear();

  const existingOutcomes = await prisma.autonomyOutcome.findMany({
    select: { actionId: true },
  });
  const evaluated = new Set(existingOutcomes.map((e) => e.actionId));

  const whereId =
    evaluated.size > 0
      ? {
          id: {
            notIn: [...evaluated],
          },
        }
      : {};

  const candidates = await prisma.autonomyAction.findMany({
    where: {
      status: { in: ["executed", "approved", "proposed"] },
      learningEligible: true,
      ...whereId,
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const results: Array<{
    actionId: string;
    success: boolean;
    result?: unknown;
    deferred?: boolean;
    error?: string;
  }> = [];

  let evaluatedCount = 0;

  for (const action of candidates) {
    const windowDays = await learningWindowDaysForScope(action.scopeType, action.scopeId);
    if (!olderThanWindow(action.createdAt, windowDays)) {
      results.push({ actionId: action.id, success: true, deferred: true });
      continue;
    }

    evaluatedCount += 1;

    try {
      const result = await evaluateActionOutcome(action.id);
      results.push({ actionId: action.id, success: true, result });
    } catch (error) {
      results.push({
        actionId: action.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { results, evaluatedCount };
}
