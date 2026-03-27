/**
 * Suggested outreach scripts for LECIPM broker follow-up (Mohamed Al Mashhour).
 */

export const BROKER_SCRIPTS = {
  defaultFollowUp:
    "Hello, this is Mohamed Al Mashhour, licensed residential real estate broker with LECIPM. I’m following up on the free property evaluation you requested. I’d be happy to give you a more precise market opinion and discuss the best strategy for your property.",

  firstCall:
    "Hi, this is Mohamed Al Mashhour from LECIPM — I’m calling about the free evaluation you received online. Do you have two minutes? I can walk you through what the numbers mean and next steps if you’re thinking of selling.",

  followUp:
    "Hi — it’s Mohamed from LECIPM again. I wanted to check in after your estimate: do you have any questions on the range, or would a short call help clarify timing and pricing for your area? I’m happy to keep it high-level and no-pressure.",

  closing:
    "Based on what you’ve shared, the next step I recommend is a simple listing plan: price positioning, marketing, and how we handle showings. If you’re comfortable moving forward, I’ll send a clear engagement summary so you know exactly what to expect — fees, timelines, and my responsibilities as your broker.",

  voicemail:
    "Hi, this is Mohamed Al Mashhour, residential real estate broker with LECIPM, license J1321. I’m following up on your property evaluation. Please call or text me back at your convenience — happy to provide a precise market analysis at no obligation.",

  whatsappFollowUp:
    "Hi — Mohamed from LECIPM here. I saw you received the free AI estimate for your property. If you’d like, I can prepare a more accurate market opinion and a simple selling strategy. Are mornings or evenings better for a quick call?",

  emailFollowUp:
    "Thank you again for using our free evaluation tool. If you’d like a licensed broker’s opinion backed by recent comparables, reply to this email or book a no-obligation consultation — I’ll outline timeline, pricing, and what to expect in today’s Quebec market.",
} as const;

/** Short objection replies (see also COMMON_SELLER_OBJECTIONS). */
export const OBJECTION_SNIPPETS = {
  fsbo:
    "Many sellers try FSBO first; what I focus on is your net outcome — stronger exposure and negotiation often offset the commission.",
  fee:
    "Let’s compare net after fees, not the headline rate. I’ll show you a net sheet so you can decide with real numbers.",
  timing:
    "Totally fair to wait — I’ll share what the data says for your neighbourhood so timing isn’t guesswork.",
} as const;

export type BrokerScriptKey = keyof typeof BROKER_SCRIPTS;

export function getBrokerScript(key: BrokerScriptKey): string {
  return BROKER_SCRIPTS[key];
}
