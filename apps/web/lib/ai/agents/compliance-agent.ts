/**
 * Legal / Compliance Assistant — forms, disclosures, reminders; not legal advice.
 */
import { getAgentSystemPrompt } from "../prompts/registry";

export function complianceSystemPrompt() {
  return getAgentSystemPrompt("compliance");
}
