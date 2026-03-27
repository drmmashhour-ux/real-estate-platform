/**
 * Structured objections for Sales Assistant (short + full script).
 */

export type TrainingObjection = {
  id: string;
  objection: string;
  shortAnswer: string;
  fullScript: string;
};

export const ASSISTANT_OBJECTIONS: TrainingObjection[] = [
  {
    id: "fsbo",
    objection: "I want to sell myself",
    shortAnswer:
      "Totally fair—many try FSBO first. I focus on your net outcome after exposure and negotiation, not just the fee.",
    fullScript:
      "I understand wanting control and saving on commission. What I usually show clients is a simple comparison: net proceeds FSBO versus broker-managed sales in your neighbourhood—pricing mistakes and weak exposure often cost more than the fee. If you’d like, we can look at comparables together and you decide—no pressure either way.",
  },
  {
    id: "commission",
    objection: "Commission is too high",
    shortAnswer:
      "Let’s compare net dollars, not the headline rate—I’ll walk you through a net sheet with real numbers.",
    fullScript:
      "I hear that a lot, and it’s smart to ask. The number that matters is what you walk away with after marketing, negotiation, and timing. I’m happy to model a conservative, base, and strong scenario so you can see net—not guess. If the math doesn’t make sense for you, you’ll know before you commit.",
  },
  {
    id: "exploring",
    objection: "I’m just exploring",
    shortAnswer:
      "Exploring is the right first step—I’ll keep it educational and you can pause anytime.",
    fullScript:
      "That’s perfect. Selling is a big decision. I’ll treat this as pure information: market range, timeline, and what sellers are seeing in your area right now. You don’t owe me a decision today—if it’s useful, we plan a next step; if not, you still walk away clearer.",
  },
  {
    id: "think",
    objection: "I need to think about it",
    shortAnswer:
      "Of course—what part would help to think over? I can follow up with a short summary so you’re not relying on memory.",
    fullScript:
      "Absolutely—most people need time. To make thinking productive, what’s the one thing you want clarity on: price, fees, timeline, or the process? I can email a one-page snapshot of what we discussed so you can decide calmly. Would a check-in in a few days work, or do you prefer to reach out when you’re ready?",
  },
  {
    id: "diy",
    objection: "I want to do it myself",
    shortAnswer:
      "That’s fine—I can still give you a sharp market read so your DIY plan is based on real comps, not guesses.",
    fullScript:
      "Many owners want to try on their own first. What I usually offer is a simple, factual comparison: what homes like yours actually sold for and how long they took. You stay in control—if you want help later on offers or paperwork, I’m here; if not, you still leave with better information.",
  },
  {
    id: "not_ready",
    objection: "I’m not ready",
    shortAnswer:
      "Totally normal—let’s anchor a light next step so when you are ready, you’re not starting from zero.",
    fullScript:
      "No pressure at all. Readiness often comes down to timing, finances, or life changes. I can keep it light: one market snapshot on your timeline, or a follow-up when you say go—whichever feels least invasive. What timeframe feels realistic for you to revisit this?",
  },
];
