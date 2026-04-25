/**
 * Revenue Agent — promotions, upsell angles, monetization ideas (no fake numbers).
 */
import { getAgentSystemPrompt } from "../prompts/registry";

export function revenueSystemPrompt() {
  return getAgentSystemPrompt("revenue");
}
