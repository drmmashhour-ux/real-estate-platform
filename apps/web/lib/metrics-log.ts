/**
 * Structured console metrics for growth / funnel / deal / learning pipelines.
 * Safe for server logs; avoid PII in `meta` (use counts and ids only when necessary).
 */

type MetricsScope = "growth" | "funnel" | "deal" | "learning";

const PREFIX: Record<MetricsScope, string> = {
  growth: "[growth]",
  funnel: "[funnel]",
  deal: "[deal]",
  learning: "[learning]",
};

function emit(scope: MetricsScope, message: string, meta?: Record<string, unknown>): void {
  const tag = PREFIX[scope];
  if (meta && Object.keys(meta).length > 0) {
    console.log(`${tag} ${message}`, meta);
  } else {
    console.log(`${tag} ${message}`);
  }
}

export const metricsLog = {
  growth: (message: string, meta?: Record<string, unknown>) => emit("growth", message, meta),
  funnel: (message: string, meta?: Record<string, unknown>) => emit("funnel", message, meta),
  deal: (message: string, meta?: Record<string, unknown>) => emit("deal", message, meta),
  learning: (message: string, meta?: Record<string, unknown>) => emit("learning", message, meta),
};
