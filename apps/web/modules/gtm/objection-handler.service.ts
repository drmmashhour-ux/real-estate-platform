export type ObjectionKey =
  | "fees_too_high"
  | "why_not_airbnb"
  | "compliance_trust"
  | "stripe_security"
  | "need_guarantee";

const RESPONSES: Record<ObjectionKey, string[]> = {
  fees_too_high: [
    "We don’t benchmark “cheapest” versus OTAs — compare net after your declared fee % using our ROI tool inputs.",
    "Checkout shows guest service fee + taxes + host fee lines before pay — no surprise totals.",
  ],
  why_not_airbnb: [
    "Airbnb optimizes guest stays; LECIPM adds brokerage-grade deal workflows and Québec-facing compliance patterns where product supports them.",
    "We’re not claiming market share — we’re offering one connected stack for teams that want it.",
  ],
  compliance_trust: [
    "Consent and audit trails are first-class; Law 25-style patterns are applied at send-time for marketing flows.",
    "AI drafting is review-first — nothing auto-publishes legal content without human approval where required.",
  ],
  stripe_security: [
    "Card processing uses Stripe — we don’t store raw PANs in LECIPM.",
    "Payout timing follows Stripe Connect rules; hosts see fee lines in dashboard.",
  ],
  need_guarantee: [
    "We can’t guarantee bookings or closings — any model output is labeled as an estimate with assumptions you control.",
    "Investor and ROI views are exports of internal tables, not promises of performance.",
  ],
};

export function handleObjection(key: ObjectionKey): { objection: string; responses: string[] } {
  const labels: Record<ObjectionKey, string> = {
    fees_too_high: "Your fees seem high",
    why_not_airbnb: "Why switch from Airbnb / Centris?",
    compliance_trust: "How do I trust compliance?",
    stripe_security: "Is payments secure?",
    need_guarantee: "Can you guarantee ROI?",
  };
  return { objection: labels[key], responses: RESPONSES[key] };
}
