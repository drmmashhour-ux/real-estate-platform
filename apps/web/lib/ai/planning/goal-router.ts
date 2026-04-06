import type { AgentKey } from "../types";

export function goalToAgent(goalTag: string): AgentKey {
  if (goalTag.startsWith("listing")) return "listing_optimization";
  if (goalTag.startsWith("booking")) return "booking_ops";
  if (goalTag.startsWith("payout")) return "host_management";
  if (goalTag.startsWith("trust")) return "trust_safety";
  if (goalTag.startsWith("growth")) return "growth";
  return "admin_insights";
}
