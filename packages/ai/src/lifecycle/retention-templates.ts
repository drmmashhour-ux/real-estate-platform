/**
 * Post-close retention copy — broker-facing drafts (Québec: assistant does not send as broker).
 * Actual send is human or your automation worker.
 */

export const RETENTION_TEMPLATE_KEYS = [
  "retention_1w",
  "retention_1m",
  "retention_3m",
  "retention_6m",
  "retention_12m",
] as const;

export type RetentionTemplateKey = (typeof RETENTION_TEMPLATE_KEYS)[number];

export const RETENTION_TEMPLATES: Record<
  RetentionTemplateKey,
  { title: string; body: string; complianceNote: string }
> = {
  retention_1w: {
    title: "1 week — satisfaction check",
    body: "Hope you're settling in well! If anything about the property or closing needs follow-up, reply here — a licensed broker can help coordinate.",
    complianceNote: "Do not provide legal advice; escalate defects to appropriate professionals.",
  },
  retention_1m: {
    title: "1 month — stay in touch",
    body: "Checking in — how is everything? If you're curious about market trends or a second property, we can schedule a quick call with a broker.",
    complianceNote: "No investment guarantees; brokerage rules apply.",
  },
  retention_3m: {
    title: "3 months — new opportunities",
    body: "If you're looking for investment or upsizing/downsizing, we can share new listings that match your criteria — always through a licensed broker.",
    complianceNote: "Assistant copy only; broker validates suitability.",
  },
  retention_6m: {
    title: "6 months — referrals",
    body: "If friends or family are buying or selling in Québec, we'd appreciate a referral — we'll connect them with a licensed courtier on our team.",
    complianceNote: "Referrals must not misrepresent regulated services.",
  },
  retention_12m: {
    title: "12 months — anniversary",
    body: "One year in — hope you still love the home. Thinking of a move or rental strategy? A broker can review options with you.",
    complianceNote: "No tax/legal advice in messaging.",
  },
};
