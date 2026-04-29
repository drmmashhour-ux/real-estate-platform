import "server-only";

import { runAutomationRule } from "@/lib/ai/actions/automation-engine";
import type { AutomationRuleKey } from "@/lib/ai/actions/automation-rules";
import { AUTOMATION_RULE_KEYS } from "@/lib/ai/actions/automation-rules";

/** Runs the platform automation keys (subset or full set) — each tick is an audit trail row in shadow mode. */
export async function runAllAutomations(keys?: AutomationRuleKey[]) {
  const toRun = keys?.length ? keys : [...AUTOMATION_RULE_KEYS];
  const results: Record<string, { ok: boolean; createdRecommendations: number }> = {};
  for (const k of toRun) {
    results[k] = await runAutomationRule(k);
  }
  return results;
}
