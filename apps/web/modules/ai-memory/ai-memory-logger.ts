import { logComplianceTagged } from "@/lib/server/launch-logger";

export function logAiMemory(event: "ai_memory_saved" | "ai_pattern_created" | "ai_pattern_applied" | "ai_user_preference_applied", payload: Record<string, unknown>): void {
  logComplianceTagged.info(`[ai-memory] ${event}`, payload);
}
