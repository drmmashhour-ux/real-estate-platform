import { prisma } from "@/lib/db";

/**
 * Rule-weight adaptation: aggregate success scores by pattern (no ML).
 */
export async function getAutopilotV2PatternWeights(): Promise<Record<string, number>> {
  const rows = await prisma.autopilotV2Outcome.groupBy({
    by: ["patternKey"],
    _avg: { successScore: true },
    where: { patternKey: { not: null } },
  });
  const w: Record<string, number> = {};
  for (const r of rows) {
    if (r.patternKey && r._avg.successScore != null) {
      w[r.patternKey] = r._avg.successScore;
    }
  }
  return w;
}

/**
 * Bounded multipliers (≈0.94–1.06) so weights never swing wildly (reduces oscillation).
 */
export async function getBoundedPatternMultipliers(): Promise<Record<string, number>> {
  const raw = await getAutopilotV2PatternWeights();
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!Number.isFinite(v)) continue;
    const centered = (v - 0.5) * 0.18;
    out[k] = Math.min(1.06, Math.max(0.94, 1 + centered));
  }
  return out;
}

export async function recordAutopilotOutcome(input: {
  suggestionId: string;
  beforeMetrics: Record<string, unknown>;
  afterMetrics: Record<string, unknown>;
  patternKey?: string | null;
}): Promise<void> {
  const b = summarizeMetrics(input.beforeMetrics);
  const a = summarizeMetrics(input.afterMetrics);
  const rawDelta = a - b;
  const delta = Math.max(-80, Math.min(80, rawDelta));
  const successScore = Math.max(0, Math.min(1, 0.5 + delta / 240));

  await prisma.autopilotV2Outcome.create({
    data: {
      suggestionId: input.suggestionId,
      beforeMetrics: input.beforeMetrics as object,
      afterMetrics: input.afterMetrics as object,
      delta,
      successScore,
      patternKey: input.patternKey?.slice(0, 128) ?? null,
    },
  });
}

/** Host accept/reject — soft label for learning (no fabricated uplift). */
export async function recordAutopilotV2UserFeedback(input: {
  suggestionId: string;
  patternKey: string;
  accepted: boolean;
}): Promise<void> {
  const successScore = input.accepted ? 0.65 : 0.35;
  await prisma.autopilotV2Outcome.create({
    data: {
      suggestionId: input.suggestionId,
      beforeMetrics: {},
      afterMetrics: { feedback: input.accepted ? "accepted" : "rejected" },
      delta: 0,
      successScore,
      patternKey: input.patternKey.slice(0, 128),
    },
  });
}

function summarizeMetrics(m: Record<string, unknown>): number {
  const views = Number(m.views ?? 0);
  const saves = Number(m.saves ?? 0);
  return views * 1 + saves * 5;
}
