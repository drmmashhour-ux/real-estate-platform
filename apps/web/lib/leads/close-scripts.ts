/**
 * Operator-facing buyer + broker close flows (qualify → understand → match → one clear action).
 * Rules: short, forward, one action per message — no passive “let me know.”
 */

export type CloseScriptStage = {
  id: string;
  title: string;
  /** Use {{name}} and {{link}} placeholders. */
  body: string;
  /** Optional alternate lines (e.g. browsing vs serious). */
  branches?: { id: string; label: string; body: string }[];
};

export const BUYER_CLOSE_SCRIPT: CloseScriptStage[] = [
  {
    id: "open",
    title: "Stage 1 — Open (low pressure)",
    body:
      "Hey {{name}} — quick question.\n\n" +
      "If you found the right property, would you actually move on it or just browsing for now?",
  },
  {
    id: "qualify",
    title: "Stage 2 — Qualify",
    branches: [
      {
        id: "browsing",
        label: "If they say “just browsing”",
        body: "Got it — what would make something stand out enough for you to actually consider it?",
      },
      {
        id: "serious",
        label: "If they say “serious”",
        body: "Perfect — what are you mainly looking for right now? (budget, area, type)",
      },
    ],
    body: "",
  },
  {
    id: "platform",
    title: "Stage 3 — Position your platform",
    body:
      "Makes sense.\n\n" +
      "I built this platform so you can:\n" +
      "- find real opportunities\n" +
      "- connect directly with brokers\n" +
      "- move fast when something fits\n\n" +
      "Want me to send you access?",
  },
  {
    id: "first_action",
    title: "Stage 4 — First action (critical)",
    body:
      "Here’s the link:\n{{link}}\n\n" +
      "If something stands out, send ONE inquiry — I’ll push it forward quickly for you.",
  },
  {
    id: "push",
    title: "Stage 5 — Push (after view, no action)",
    body:
      "Did anything stand out or not really?\n\n" +
      "If one caught your eye, I can help you move on it quickly.",
  },
  {
    id: "close",
    title: "Stage 6 — Close",
    body:
      "If you’re seriously considering that one, I can connect you directly and move it forward fast.\n\n" +
      "Want me to do that?",
  },
  {
    id: "final",
    title: "Stage 7 — Final push",
    body:
      "We can move quickly on this — I’ll make sure everything is handled smoothly.\n\n" +
      "Do you want me to connect you now?",
  },
];

/** Broker positioning: deal flow, not free leads. */
export const BROKER_MONETIZATION_SCRIPT: CloseScriptStage[] = [
  {
    id: "hook",
    title: "Stage 1 — Hook",
    body:
      "Hey {{name}} — quick one.\n\n" +
      "I’m sending serious buyer inquiries directly through my platform.\n\n" +
      "Are you open to testing a few leads?",
  },
  {
    id: "value",
    title: "Stage 2 — Value",
    body:
      "These are not random leads:\n\n" +
      "- active buyers\n" +
      "- real inquiries\n" +
      "- ready to move\n\n" +
      "You just respond fast and close.",
  },
  {
    id: "offer",
    title: "Stage 3 — Offer",
    body: "I’ll send you a few to test.\n\nIf it works, we scale it.",
  },
  {
    id: "monetization",
    title: "Stage 4 — Monetization",
    body:
      "Once you start getting results, we move to a simple model:\n\n" +
      "- per lead\n" +
      "or\n" +
      "- monthly access\n\n" +
      "Fair and performance-based.",
  },
  {
    id: "broker_close",
    title: "Stage 5 — Close",
    body: "Want me to send you your first lead to test?",
  },
];

export const BROKER_REVENUE_MODELS = [
  {
    id: "ppl",
    title: "Pay per lead (fastest)",
    range: "$50–$200 per lead (quality-dependent)",
    bestFor: "Early stage, quick cash",
  },
  {
    id: "ppd",
    title: "Pay per deal (high value)",
    range: "% of commission or fixed $500–$2,000",
    bestFor: "Serious brokers, long-term",
  },
  {
    id: "sub",
    title: "Subscription (scalable)",
    range: "$99–$499/month — access to leads",
    bestFor: "Scaling volume",
  },
] as const;

export const BROKER_RECOMMENDED_PITCH =
  "Start with a lead fee (fast cash), then upgrade serious partners to subscription.";

export function personalizeCloseScript(template: string, ctx: { name: string; link?: string }): string {
  const first = ctx.name?.trim().split(/\s+/)[0] || "there";
  const link = (ctx.link ?? "").trim() || "[link]";
  return template.replace(/\{\{name\}\}/g, first).replace(/\{\{link\}\}/g, link);
}

export function defaultPlatformLinkForScripts(): string {
  if (typeof window !== "undefined") {
    const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    if (env) return `${env}/buy`;
    return `${window.location.origin}/buy`;
  }
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return env ? `${env}/buy` : "https://lecipm.com/buy";
}
