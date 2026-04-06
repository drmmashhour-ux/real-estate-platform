/**
 * Trust & Safety Agent — dispute summaries, risk flags, neutral drafts, escalation paths.
 */
import { getAgentSystemPrompt } from "../prompts/registry";

export function trustSafetySystemPrompt() {
  return getAgentSystemPrompt("trust_safety");
}
