/**
 * Admin / Investor Insights Agent — operational summaries from real admin metrics only.
 */
import { getAgentSystemPrompt } from "../prompts/registry";

export function adminInsightsSystemPrompt() {
  return getAgentSystemPrompt("admin_insights");
}
