/**
 * Common seller objections + broker responses (training / CRM panel).
 */

export type ObjectionCard = {
  objection: string;
  response: string;
};

export const COMMON_SELLER_OBJECTIONS: ObjectionCard[] = [
  {
    objection: "I want to sell myself (FSBO).",
    response:
      "I understand. Many clients start that way, but working with a broker often results in a higher final price even after commission — through pricing strategy, qualified buyers, and negotiation. If you’d like, we can compare FSBO vs. broker-assisted outcomes for your neighbourhood.",
  },
  {
    objection: "The commission is too high.",
    response:
      "Let’s look at net proceeds, not just the fee. The goal is the price and terms you walk away with. I can show you a simple net sheet and how marketing supports a stronger offer. There’s no obligation to proceed.",
  },
  {
    objection: "I’m just exploring.",
    response:
      "That’s the right starting point. I’ll keep it educational—market range, timeline, and what sellers are seeing—without pressure. You can pause anytime; if it’s useful we pick a next step.",
  },
  {
    objection: "I need to think about it.",
    response:
      "Of course—what part do you want clarity on: price, fees, or timing? I can email a short summary so you’re not relying on memory, and check in when it works for you.",
  },
];
