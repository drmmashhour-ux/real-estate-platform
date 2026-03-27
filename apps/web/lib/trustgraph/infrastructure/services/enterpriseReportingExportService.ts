/**
 * Internal export scaffolding — returns JSON-safe summaries for compliance tooling.
 */
export function exportWorkspaceQueueSummaryJson(rows: unknown[]): string {
  return JSON.stringify({ version: 1, rows });
}

export function exportPortfolioTrustSummaryJson(summary: unknown): string {
  return JSON.stringify({ version: 1, summary });
}

export function exportSlaPerformanceSummaryJson(summary: unknown): string {
  return JSON.stringify({ version: 1, summary });
}
