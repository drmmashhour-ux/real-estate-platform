/**
 * Hook for scheduled “continue your deal” emails — call from cron when ready.
 * Uses existing Resend stack; no-op when not configured (same pattern as other growth emails).
 */
export async function queueContinueDealReminder(_args: { userId: string; scenarioLabel?: string }): Promise<void> {
  // Wire to Resend template + GrowthEmailLog when product copy is finalized.
}
