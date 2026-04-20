/** Structured internal observability — no PII in metadata. */

function emit(event: string, meta: Record<string, unknown>): void {
  try {
    const safe = Object.fromEntries(
      Object.entries(meta).map(([k, v]) => [k, typeof v === "string" ? v.slice(0, 160) : v])
    );
    console.info(`[growth-intelligence] ${event}`, safe);
  } catch {
    /* no-throw contract */
  }
}

export function trackGrowthSignalDetected(signalType: string, meta: Record<string, unknown>): void {
  emit("signal_detected", { signalType, ...meta });
}

export function trackGrowthOpportunityCreated(opportunityId: string, meta: Record<string, unknown>): void {
  emit("opportunity_created", { opportunityId: opportunityId.slice(0, 40), ...meta });
}

export function trackGrowthBriefCreated(opportunityId: string, meta: Record<string, unknown>): void {
  emit("brief_created", { opportunityId: opportunityId.slice(0, 40), ...meta });
}

export function trackGrowthOpportunityPrioritized(opportunityId: string, score: number): void {
  emit("opportunity_prioritized", { opportunityId: opportunityId.slice(0, 40), scoreBucket: Math.round(score / 10) * 10 });
}

export function trackGrowthTaskCreated(taskKey: string, meta: Record<string, unknown>): void {
  emit("task_created", { taskKey: taskKey.slice(0, 80), ...meta });
}

export function trackGrowthTrendDetected(signalType: string, meta: Record<string, unknown>): void {
  emit("trend_detected", { signalType: signalType.slice(0, 48), ...meta });
}
