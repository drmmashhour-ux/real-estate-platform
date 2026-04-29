import "server-only";

/** Rule rollup hook — callers wrap in try/catch; noop until learning tables are finalized. */
export async function updateRulePerformance(_ruleName: string, _outcomeLabel: string): Promise<void> {}
