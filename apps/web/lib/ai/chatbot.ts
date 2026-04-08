/**
 * ImmoContact / platform CRM chatbot — intent, lead triggers, replies.
 */

import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import type { CrmConversationMetadata } from "@/lib/immo/crm-metadata";

const SERIOUS_PATTERNS =
  /\b(i want to buy|i need (a )?mortgage|i am interested|i'm interested|interested in|ready to buy|looking to (buy|purchase|rent)|je veux acheter|j'ai besoin d'un prêt|hypothèque|louer un|appartement à)\b/i;

const BUY_PATTERNS = /\b(buy|purchase|home|condo|house|apartment|duplex|invest)\b/i;
const RENT_PATTERNS = /\b(rent|lease|tenant|short[-\s]?term|bnb|airbnb)\b/i;
const MORTGAGE_PATTERNS = /\b(mortgage|pre[-\s]?approval|down payment|rate|lender|loan|finance)\b/i;

export function detectChatIntent(text: string): NonNullable<CrmConversationMetadata["intent"]> {
  const t = text.toLowerCase();
  if (MORTGAGE_PATTERNS.test(t)) return "mortgage";
  if (RENT_PATTERNS.test(t)) return "rent";
  if (BUY_PATTERNS.test(t)) return "buy";
  if (/\b(expert|agent|broker|talk to someone|human|advisor)\b/i.test(t)) return "expert";
  return "general";
}

/** User message should create a CRM lead (serious intent). */
export function shouldAutoCreateLead(text: string): boolean {
  return SERIOUS_PATTERNS.test(text.trim());
}

/**
 * Strong intent → broker CRM handoff (create/update lead, urgency — never auto-close).
 */
export function detectStrongBrokerHandoffIntent(text: string): boolean {
  const t = text.trim();
  return (
    SERIOUS_PATTERNS.test(t) ||
    /\b(buying soon|this month|next week|book (a )?(call|visit|consultation|meeting)|schedule (a )?(visit|call|consultation)|come see|walk.?through|pre[-\s]?approval|speak (to|with) (a )?(broker|agent|someone))\b/i.test(
      t
    )
  );
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/;

export function extractContactFromText(text: string): CrmConversationMetadata["capture"] {
  const emailM = text.match(EMAIL_RE);
  const phoneM = text.match(PHONE_RE);
  return {
    email: emailM ? emailM[0] : undefined,
    phone: phoneM ? phoneM[1].trim().slice(0, 40) : undefined,
  };
}

function ruleBasedReply(message: string, intent: NonNullable<CrmConversationMetadata["intent"]>): string {
  const m = message.trim();
  if (/montreal|montréal|laval|qu[eé]bec|quebec city/i.test(m)) {
    return (
      "Great — we cover Montreal, Laval, and Québec City. What's your approximate budget or preferred area? " +
        "I can also connect you with a verified expert for a private consultation."
    );
  }
  if (intent === "mortgage") {
    return (
      "I can help with mortgage basics (down payment, pre-approval, timelines). " +
        "For personalized rates, a verified mortgage expert can review your file. " +
        "Would you like me to prioritize getting you matched? Also share your name and best email if you're comfortable."
    );
  }
  if (intent === "rent") {
    return (
      "For rentals and short-stays, you can browse curated listings on BNHub. " +
        "Tell me your dates, city, and budget — I'll point you to the right search."
    );
  }
  if (intent === "buy") {
    return (
      "Exciting — buying is a big step. What's your price range and timeline? " +
        "I can connect you with a local expert who knows the neighbourhood market."
    );
  }
  if (intent === "expert") {
    return (
      "I can bring a verified expert into this chat. Please share your **name**, **email**, and optional **phone** so they can follow up."
    );
  }
  return (
    "I'm here for buying, renting, or mortgage questions — or to connect you with a specialist. " +
      "What are you trying to do next?"
  );
}

export async function generateImmoChatReply(params: {
  userMessage: string;
  intent: NonNullable<CrmConversationMetadata["intent"]>;
  recentLines: string[];
}): Promise<string> {
  const sys = `You are Immo AI, a concise assistant for LECIPM (Montreal, Laval, Québec real estate).
Topics: buying, renting, short-term stays (BNHub), mortgages (experts, not licensed advice).
Always: be warm, practical, 2–4 short sentences max. Offer to connect with a verified expert when relevant.
Never: promise specific rates or legal advice. Use English unless the user writes in French — then reply in French.
If the user gives location + product (e.g. apartment in Montreal), acknowledge and ask budget + timeline, offer expert connection (like: "I can also connect you with a verified expert.").`;

  const ctx = params.recentLines.slice(-8).join("\n");

  const client = openai;
  if (isOpenAiConfigured() && client) {
    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sys },
          {
            role: "user",
            content: `Intent hint: ${params.intent}\nRecent:\n${ctx}\n\nUser: ${params.userMessage}`,
          },
        ],
        max_tokens: 320,
        temperature: 0.55,
      });
      const out = completion.choices[0]?.message?.content?.trim();
      if (out) return out;
    } catch {
      /* fall through */
    }
  }

  return ruleBasedReply(params.userMessage, params.intent);
}
