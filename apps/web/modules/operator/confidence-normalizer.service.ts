export function normalizeConfidenceLabel(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score >= 0.8) return "HIGH";
  if (score >= 0.55) return "MEDIUM";
  return "LOW";
}

export function clampScore(value: number | null | undefined, fallback = 0.3): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}
