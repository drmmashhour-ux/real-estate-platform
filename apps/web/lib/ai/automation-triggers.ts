import "server-only";

export async function recordHotLeadAlert(_payload?: Record<string, unknown>): Promise<void> {}
export async function recordClientChatHandoff(_payload?: Record<string, unknown>): Promise<void> {}
export async function recordClientChatEscalation(_payload?: Record<string, unknown>): Promise<void> {}
export async function recordWarmFollowUpIntent(_payload?: Record<string, unknown>): Promise<void> {}
export async function recordColdNurtureIntent(_payload?: Record<string, unknown>): Promise<void> {}

/** Used by deals API hydration */
export async function recordDealCrmStageChange(_payload?: Record<string, unknown>): Promise<void> {}

export function getAutomationTriggers() {
  return [];
}
