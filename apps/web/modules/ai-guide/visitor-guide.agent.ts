export type VisitorIntent = 
  | "WHAT_IS_THIS"
  | "HOW_IT_WORKS"
  | "PRICING"
  | "GET_LEADS"
  | "TRUST"
  | "GET_STARTED"
  | "GENERAL";

export type VisitorContext = {
  route: string;
  isLoggedIn: boolean;
  hasPurchasedBefore: boolean;
};

export interface VisitorGuideResponse {
  text: string;
  suggestedAction?: {
    label: string;
    href?: string;
    intent?: VisitorIntent;
  };
  quickReplies: string[];
}

const SYSTEM_PROMPT = `
You are an AI assistant for a real estate platform.

Your goal:
* help brokers understand the platform quickly
* explain value in simple terms
* guide them to try the product

Rules:
* be short, clear, and helpful
* focus on outcomes (more deals, less wasted time)
* never use technical jargon
* always guide toward action

Core value:
"This platform helps you focus on the deals most likely to close and tells you what to do next."

Always:
* answer the question
* then suggest a next step
`;

const INTENT_RESPONSES: Record<VisitorIntent, string> = {
  WHAT_IS_THIS: "This is a platform that helps you prioritize your deals and tells you exactly what to do next to close faster.",
  HOW_IT_WORKS: "It analyzes your leads and shows which ones are worth your time, plus suggests your next action.",
  PRICING: "You can try your first lead at a reduced price, then choose based on quality and demand.",
  GET_LEADS: "We provide high-quality leads in priority markets like Montréal and Laval, scored by intent.",
  TRUST: "Our system is built on real signals and compliance-first drafting to keep your deals secure.",
  GET_STARTED: "The best way is to try your first lead — it takes less than 2 minutes to see the value.",
  GENERAL: "I'm here to help you close more deals with less effort. What would you like to know?"
};

const PAGE_CONTEXT_ADDITIONS: Record<string, string> = {
  "landing": "Welcome! We're helping brokers transform how they manage deals.",
  "dashboard": "This is your command center for deal prioritization.",
  "pricing": "Our pricing is transparent and based on lead quality.",
};

export function detectIntent(input: string): VisitorIntent {
  const text = input.toUpperCase();
  if (text.includes("WHAT") || text.includes("WHO") || text.includes("IS THIS")) return "WHAT_IS_THIS";
  if (text.includes("HOW") || text.includes("WORKS") || text.includes("WORK")) return "HOW_IT_WORKS";
  if (text.includes("PRICE") || text.includes("COST") || text.includes("PAY")) return "PRICING";
  if (text.includes("LEAD") || text.includes("BUY")) return "GET_LEADS";
  if (text.includes("TRUST") || text.includes("SAFE") || text.includes("LEGAL")) return "TRUST";
  if (text.includes("START") || text.includes("SIGN") || text.includes("TRY")) return "GET_STARTED";
  return "GENERAL";
}

export function generateVisitorGuideResponse(
  input: string,
  context: VisitorContext
): VisitorGuideResponse {
  const intent = detectIntent(input);
  let responseText = INTENT_RESPONSES[intent];

  // Add context awareness
  for (const [route, addition] of Object.entries(PAGE_CONTEXT_ADDITIONS)) {
    if (context.route.includes(route)) {
      responseText = `${addition} ${responseText}`;
      break;
    }
  }

  // CTA Logic
  let suggestedAction;
  let quickReplies: string[] = [];

  if (intent === "GET_STARTED" || intent === "GET_LEADS") {
    suggestedAction = { label: "Try first lead", href: "/dashboard/crm" };
    quickReplies = ["How much for first lead?", "How are leads scored?"];
  } else if (intent === "PRICING") {
    suggestedAction = { label: "View opportunities", href: "/dashboard/crm" };
    quickReplies = ["What is a high-quality lead?", "Is there a monthly plan?"];
  } else {
    suggestedAction = { label: "Show me how it works", intent: "HOW_IT_WORKS" as VisitorIntent };
    quickReplies = ["How do I get leads?", "How much does it cost?"];
  }

  return {
    text: responseText,
    suggestedAction,
    quickReplies
  };
}
