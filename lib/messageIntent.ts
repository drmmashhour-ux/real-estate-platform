export type MessageIntent =
  | "renew_subscription"
  | "billing_timing_question"
  | "unknown";

const PLAN_KEYWORDS = ["plan", "subscription", "membership", "package"];
const RENEW_KEYWORDS = ["renew", "renewal", "extend", "continue"];
const PAYMENT_KEYWORDS = ["pay", "payment", "bill", "billing", "charge"];
const TIMING_KEYWORDS = ["now", "wait", "finish", "finished", "later", "until"];

function normalizeMessage(message: string): string {
  return message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasKeyword(normalizedMessage: string, keywords: string[]): boolean {
  return keywords.some((keyword) =>
    new RegExp(`\\b${keyword}\\b`, "i").test(normalizedMessage),
  );
}

export function detectMessageIntent(message: string): MessageIntent {
  const normalizedMessage = normalizeMessage(message);

  if (
    hasKeyword(normalizedMessage, PAYMENT_KEYWORDS) &&
    hasKeyword(normalizedMessage, PLAN_KEYWORDS) &&
    (hasKeyword(normalizedMessage, TIMING_KEYWORDS) ||
      hasKeyword(normalizedMessage, RENEW_KEYWORDS))
  ) {
    return "billing_timing_question";
  }

  if (
    hasKeyword(normalizedMessage, RENEW_KEYWORDS) &&
    hasKeyword(normalizedMessage, PLAN_KEYWORDS)
  ) {
    return "renew_subscription";
  }

  return "unknown";
}

export function buildAssistantReply(message: string): string {
  const intent = detectMessageIntent(message);

  if (intent === "billing_timing_question") {
    return "Yes — you can pay now to renew, or you can wait until your current plan finishes and renew then. To avoid service interruption, renew before the current period ends.";
  }

  if (intent === "renew_subscription") {
    return "Absolutely — I can help with your plan renewal. Please share the email on your account, and confirm whether you want monthly or annual billing.";
  }

  return "I can help with account and subscription requests. Please tell me what you need in a bit more detail.";
}
