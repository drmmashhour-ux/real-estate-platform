export type SafeCondition = {
  category: "financing" | "inspection" | "documents" | "timeline";
  label: string;
  note: string;
};

/** Conservative, non-exhaustive condition ideas — not legal clauses. */
export function buildSafeRecommendedConditions(args: {
  posture: "aggressive" | "balanced" | "cautious" | "insufficient_data";
}): SafeCondition[] {
  const base: SafeCondition[] = [
    {
      category: "financing",
      label: "Financing review",
      note: "Keep financing milestones aligned with your lender’s timeline — subject to lender terms.",
    },
    {
      category: "inspection",
      label: "Property inspection",
      note: "A professional inspection is commonly used to reduce surprise repair risk.",
    },
    {
      category: "documents",
      label: "Title / document diligence",
      note: "Confirm key documents with qualified professionals before firm commitments.",
    },
  ];

  const timeline: SafeCondition =
    args.posture === "cautious"
      ? {
          category: "timeline",
          label: "Cautious timeline",
          note: "Allow time for verification given elevated uncertainty signals on this listing.",
        }
      : args.posture === "aggressive"
        ? {
            category: "timeline",
            label: "Standard timeline",
            note: "Use timelines typical for your market; avoid waiving protections by default.",
          }
        : {
            category: "timeline",
            label: "Balanced timeline",
            note: "Balance speed with adequate diligence — especially if trust signals are mixed.",
          };

  return [...base, timeline];
}
