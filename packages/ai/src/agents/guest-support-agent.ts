/**
 * Guest Support Agent — booking Q&A, check-in/out, cancellation framing, amenities, booking flow.
 */
import { getAgentSystemPrompt } from "../prompts/registry";

export function guestSupportSystemPrompt() {
  return getAgentSystemPrompt("guest_support");
}
