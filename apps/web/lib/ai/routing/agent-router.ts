import type { AgentKey, ManagerAiContext } from "../types";

/** Route user message + surface context to an agent (lightweight rules; orchestrator may override with explicit agentKey). */
export function routeAgentKey(
  message: string,
  ctx: ManagerAiContext,
  explicit?: AgentKey | null
): AgentKey {
  if (explicit) return explicit;
  const m = message.toLowerCase();
  const role = (ctx.role ?? "").toUpperCase();

  if (ctx.surface === "admin" || role === "ADMIN") {
    if (/dispute|fraud|trust|safety|refund risk/i.test(message)) return "trust_safety";
    if (/kpi|metric|summary|operations|pipeline|dashboard/i.test(message)) return "admin_insights";
    return "admin_insights";
  }

  if (ctx.bookingId || /booking|check.?in|check.?out|cancel|reservation/i.test(m)) {
    return "guest_support";
  }

  if (role === "HOST" || /payout|calendar|pricing|promotion|occupancy|host/i.test(m)) {
    return "host_management";
  }

  if (ctx.listingId || /listing|title|description|seo|photo|amenities/i.test(m)) {
    return "listing_optimization";
  }

  if (/legal|compliance|disclosure|regulation|oaciq/i.test(m)) {
    return "compliance";
  }

  if (/revenue|upsell|monetize|lead/i.test(m)) {
    return "revenue";
  }

  if (/referral|growth|waitlist|acquisition/i.test(m)) {
    return "growth";
  }

  if (/notify|remind|email template|message draft/i.test(m)) {
    return "communications";
  }

  return "guest_support";
}
