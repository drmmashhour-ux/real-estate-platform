/** Normalize dimensions for rollup unique keys (empty string = use in composite index). */
export function normDim(v: string | null | undefined): string {
  return (v ?? "").trim();
}

export type LearningRoutingContext = {
  stage: string;
  detectedIntent: string;
  detectedObjection: string;
  highIntent: boolean;
};

export function toPerformanceKey(ctx: LearningRoutingContext): LearningRoutingContext {
  return {
    stage: normDim(ctx.stage),
    detectedIntent: normDim(ctx.detectedIntent),
    detectedObjection: normDim(ctx.detectedObjection),
    highIntent: ctx.highIntent,
  };
}
