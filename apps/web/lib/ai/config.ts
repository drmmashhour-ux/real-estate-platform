import type { AgentKey } from "./types";

export const MANAGER_AI_CHAT_MODEL = process.env.MANAGER_AI_MODEL ?? "gpt-4o-mini";

export const AGENT_LABELS: Record<AgentKey, string> = {
  guest_support: "Guest Support",
  host_management: "Host Management",
  listing_optimization: "Listing Optimization",
  booking_ops: "Booking Operations",
  revenue: "Revenue",
  trust_safety: "Trust & Safety",
  admin_insights: "Admin Insights",
  compliance: "Compliance Assistant",
  growth: "Growth",
  communications: "Communications",
};
