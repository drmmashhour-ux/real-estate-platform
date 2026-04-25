import { classifyActionKey } from "../policies/action-policy";
import type { DecisionMode } from "../types";

export function selectExecutableActionKeys(
  keys: string[],
  decisionMode: DecisionMode
): { allowed: string[]; blocked: string[] } {
  const allowed: string[] = [];
  const blocked: string[] = [];
  for (const k of keys) {
    const r = classifyActionKey(k);
    if (r === "forbidden" || r === "requires_approval") {
      blocked.push(k);
      continue;
    }
    if (decisionMode === "AUTO_EXECUTE_SAFE" && (r === "safe" || r === "guardrail")) {
      allowed.push(k);
    } else if (decisionMode === "SUGGEST_ONLY") {
      blocked.push(k);
    } else {
      blocked.push(k);
    }
  }
  return { allowed, blocked };
}
