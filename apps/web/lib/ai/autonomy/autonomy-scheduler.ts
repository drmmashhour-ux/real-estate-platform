import "server-only";

/** Summary row for admin autonomy status when automation rules are persisted (placeholder until wired). */
export type AutomationScheduleSummary = {
  ruleId: string;
  label: string;
  cadence: string;
  nextRunIso: string | null;
  enabled: boolean;
};

/**
 * Optional schedule surface for `/api/ai/autonomy/status` (admin). Returns an empty list until
 * cron / rules storage is connected — keeps the API bundle resolvable.
 */
export async function listAutomationScheduleSummary(): Promise<AutomationScheduleSummary[]> {
  return [];
}
