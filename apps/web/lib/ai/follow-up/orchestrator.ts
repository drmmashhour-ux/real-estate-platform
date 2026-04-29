import "server-only";

export async function triggerAiFollowUpForLead(_args?: Record<string, unknown>): Promise<void> {}

export async function runFollowUpOrchestrator() {
  return { success: true };
}
