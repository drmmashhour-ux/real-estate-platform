/** Free-tier limits (override via env). Pro/basic plans bypass in application layer. */
export function maxFreeSimulatorRuns(): number {
  const closing = process.env.CLOSING_SIMULATIONS_LIMIT?.trim();
  if (closing !== undefined && closing !== "") {
    return Math.max(0, Number(closing));
  }
  return Math.max(0, Number(process.env.GROWTH_FREE_SIMULATOR_RUNS ?? 8));
}

export function maxFreeAiDrafts(): number {
  const closing = process.env.CLOSING_DRAFTS_LIMIT?.trim();
  if (closing !== undefined && closing !== "") {
    return Math.max(0, Number(closing));
  }
  return Math.max(0, Number(process.env.GROWTH_FREE_AI_DRAFTS ?? 15));
}

/** How often free-tier counters reset: lifetime (default) or monthly (calendar month). */
export function usageResetPeriod(): "lifetime" | "monthly" {
  return process.env.USAGE_RESET_PERIOD === "monthly" ? "monthly" : "lifetime";
}

export function hasUnlimitedGrowthUsage(plan: string): boolean {
  return plan === "pro" || plan === "basic";
}
