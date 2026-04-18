import type { ClosingTactic } from "./closing-psychology.types";

/**
 * Ethical, transparent nudges — human-delivered only; never deceptive.
 * `city` reserved for future localization; messages are exact per product spec.
 */
export function getClosingTactics(_city: string): ClosingTactic[] {
  void _city;
  return [
    {
      trigger: "speed",
      timing: "immediate",
      message: "Let's move quickly — the good properties don't stay long.",
    },
    {
      trigger: "scarcity",
      timing: "after interest",
      message: "Some of the options in this range get taken fast.",
    },
    {
      trigger: "clarity",
      timing: "when confused",
      message: "I'll simplify things and focus only on the best matches.",
    },
    {
      trigger: "momentum",
      timing: "after engagement",
      message: "You're already in a great position — we can move forward easily from here.",
    },
    {
      trigger: "confidence",
      timing: "when trust is needed",
      message: "I'll connect you with someone who knows exactly how to handle this.",
    },
  ];
}
