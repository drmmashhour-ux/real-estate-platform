import type { AutomationRuleKey } from "./automation-rules";
import { AUTOMATION_RULE_DEFINITIONS } from "./automation-rules";
import { runAutomationRule, syncAutomationRuleDefinitions } from "./automation-engine";

export async function runAllAutomations(keys?: AutomationRuleKey[]) {
  await syncAutomationRuleDefinitions();
  const list = keys?.length
    ? AUTOMATION_RULE_DEFINITIONS.filter((r) => keys.includes(r.key))
    : AUTOMATION_RULE_DEFINITIONS;
  const results = [];
  for (const r of list) {
    results.push(await runAutomationRule(r.key));
  }
  return results;
}
