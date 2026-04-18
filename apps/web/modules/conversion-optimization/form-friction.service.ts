/**
 * Form friction scoring — field-count heuristic.
 */
export function estimateFormFriction(fieldCount: number) {
  if (fieldCount <= 4) return { level: "low" as const, tip: "Keep optional fields collapsed." };
  if (fieldCount <= 8) return { level: "medium" as const, tip: "Split into steps for mobile." };
  return { level: "high" as const, tip: "Reduce required fields; defer identity verification." };
}
