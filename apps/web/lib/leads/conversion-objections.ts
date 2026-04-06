/**
 * Buyer hesitation → action in 1–2 messages.
 * Pattern: acknowledge → one question → one push (no arguing, no long explain).
 */

export type ConversionObjection = {
  id: string;
  /** What the buyer said / implied */
  trigger: string;
  acknowledge: string;
  question: string;
  push: string;
};

export const CONVERSION_OBJECTION_GOLDEN_RULE =
  "Don’t argue. Don’t over-explain. Redirect to one clear action.";

export const CONVERSION_OBJECTIONS: ConversionObjection[] = [
  {
    id: "browsing",
    trigger: "“I’m just browsing”",
    acknowledge: "Totally fair.",
    question: "What would make something stand out enough for you to actually consider it?",
    push: "If something catches your eye, send one inquiry — I’ll help you move quickly on it.",
  },
  {
    id: "expensive",
    trigger: "“Too expensive”",
    acknowledge: "I get that.",
    question: "Are you comparing based on price only, or overall value and opportunity?",
    push:
      "If it fits what you’re looking for, it might be worth moving quickly before it’s gone.\n\nWant me to help you move forward on it?",
  },
  {
    id: "not_sure",
    trigger: "“I’m not sure”",
    acknowledge: "That’s completely normal.",
    question: "What’s the main thing holding you back right now?",
    push: "If we remove that part, would you be ready to move on it?",
  },
  {
    id: "trust",
    trigger: "“Is this legit?” / trust",
    acknowledge:
      "Good question — everything runs through the platform with verified listings and direct broker connection.\n\nYou stay in control the whole time.",
    question: "",
    push: "If you want, we can move step by step — start with one inquiry.",
  },
  {
    id: "think",
    trigger: "“I’ll think about it”",
    acknowledge: "Makes sense.",
    question: "Just so I know — what would you need to see to move forward?",
    push: "If this one fits, we can move quickly — I can handle the next step for you.",
  },
];

/** Message 1: acknowledge + question (or acknowledge alone if no question). */
export function objectionMessage1(o: ConversionObjection): string {
  const q = o.question.trim();
  if (!q) return o.acknowledge.trim();
  return `${o.acknowledge.trim()}\n\n${q}`;
}

export function objectionMessage2(o: ConversionObjection): string {
  return o.push.trim();
}

/** Full two-message sequence for clipboard. */
export function objectionFullSequence(o: ConversionObjection): string {
  const m1 = objectionMessage1(o);
  const m2 = objectionMessage2(o);
  return `— Message 1 —\n${m1}\n\n— Message 2 —\n${m2}`;
}
