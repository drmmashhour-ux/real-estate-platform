import type { BrokerPushCategory, BrokerPushPreferences } from "./push.types";

export function defaultPushPreferences(): BrokerPushPreferences {
  const categories: Record<BrokerPushCategory, boolean> = {
    urgent_deadline: true,
    document_received: true,
    signature_completed: true,
    client_reply: true,
    negotiation_action: true,
    payment_status: true,
    closing_risk: true,
    compliance: true,
    high_priority_lead: true,
  };
  return { categories, privacyMinimizeLockScreen: false };
}

export function templateForCategory(category: BrokerPushCategory, detail: { dealLabel?: string }): { title: string; body: string } {
  const d = detail.dealLabel ? ` (${detail.dealLabel})` : "";
  switch (category) {
    case "urgent_deadline":
      return { title: "Deadline today", body: `A closing condition or task needs attention${d}.` };
    case "negotiation_action":
      return { title: "Negotiation review", body: `A negotiation suggestion is waiting for review${d}.` };
    case "compliance":
      return { title: "Compliance", body: `A compliance case needs reviewer action${d}.` };
    case "high_priority_lead":
      return { title: "CRM follow-up", body: `A high-priority lead needs contact.` };
    default:
      return { title: "LECIPM", body: "You have an update in your broker workspace." };
  }
}
