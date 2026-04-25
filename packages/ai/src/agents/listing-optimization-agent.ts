/**
 * Listing Optimization Agent — copy, SEO, photos/amenities gaps, conversion-oriented suggestions.
 */
import { getAgentSystemPrompt } from "../prompts/registry";

export function listingOptimizationSystemPrompt() {
  return getAgentSystemPrompt("listing_optimization");
}
