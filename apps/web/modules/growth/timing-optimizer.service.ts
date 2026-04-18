export type TimingUrgency = "critical" | "high" | "standard";

export type TimingRecommendation = {
  recommendation: string;
  urgency: TimingUrgency;
};

/**
 * Advisory response windows — not guarantees; operators still judge context.
 */
export function getBestActionTiming(): TimingRecommendation[] {
  return [
    { recommendation: "reply within 1–5 minutes", urgency: "critical" },
    { recommendation: "follow-up within 1 hour", urgency: "high" },
    { recommendation: "push connection same day", urgency: "high" },
    { recommendation: "push showing within 24–48h", urgency: "standard" },
  ];
}
