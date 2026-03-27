export function answerCopilotQuestion(input: {
  question: string;
  trustScore?: number | null;
  dealScore?: number | null;
  leadScore?: number | null;
  recommendations?: string[];
}): { answer: string; nextActions: string[] } {
  const q = input.question.toLowerCase();
  const trust = input.trustScore ?? null;
  const deal = input.dealScore ?? null;
  const lead = input.leadScore ?? null;
  const rec = input.recommendations ?? [];

  if (q.includes("good deal") || q.includes("worth")) {
    const status =
      (deal ?? 50) >= 75 && (trust ?? 50) >= 70
        ? "This looks like a strong opportunity."
        : (deal ?? 50) >= 55
          ? "This is a moderate opportunity that needs validation."
          : "This looks risky based on current scores.";
    return {
      answer: `${status} Deal score: ${deal ?? "—"}, trust score: ${trust ?? "—"}.`,
      nextActions: rec.length ? rec : ["Verify trust signals", "Compare with similar listings", "Run ROI scenario"],
    };
  }

  if (q.includes("next") || q.includes("do now")) {
    return {
      answer: "Use the highest-confidence action first, then move to verification and follow-up.",
      nextActions: rec.length ? rec : ["Call high-intent lead now", "Verify low-trust listing", "Schedule follow-up"],
    };
  }

  return {
    answer: `Based on platform data: trust ${trust ?? "—"}, deal ${deal ?? "—"}, lead ${lead ?? "—"}.`,
    nextActions: rec.length ? rec : ["Request a listing analysis", "Review risk explanations", "Prioritize top leads"],
  };
}
