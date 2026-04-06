/**
 * Booking Operations Agent — stalled bookings, unpaid paths, follow-up suggestions.
 */
import { getAgentSystemPrompt } from "../prompts/registry";

export function bookingOpsSystemPrompt() {
  return getAgentSystemPrompt("booking_ops");
}
