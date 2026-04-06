/**
 * Host Management Agent — pricing/promotions, listing gaps, payout readiness, draft communications.
 */
import { getAgentSystemPrompt } from "../prompts/registry";

export function hostManagementSystemPrompt() {
  return getAgentSystemPrompt("host_management");
}
