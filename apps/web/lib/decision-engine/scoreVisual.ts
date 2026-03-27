/** Visual bands for elite score UI — 0–39 red, 40–64 amber, 65–84 green, 85+ gold/emerald verified */

export type ScoreVisualBand = "critical" | "caution" | "strong" | "verified";

export function scoreToVisualBand(score: number, trustLevel?: string | null): ScoreVisualBand {
  if (trustLevel === "verified" || score >= 85) return "verified";
  if (score >= 65) return "strong";
  if (score >= 40) return "caution";
  return "critical";
}

export function confidenceTier(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 80) return "high";
  if (confidence >= 40) return "medium";
  return "low";
}

/** Tailwind classes for score number + border */
export function bandAccent(band: ScoreVisualBand): { ring: string; text: string; label: string } {
  switch (band) {
    case "verified":
      return {
        ring: "ring-2 ring-amber-400/60 shadow-[0_0_24px_rgba(251,191,36,0.15)]",
        text: "text-amber-300",
        label: "text-amber-200/90",
      };
    case "strong":
      return {
        ring: "ring-1 ring-emerald-500/40",
        text: "text-emerald-300",
        label: "text-emerald-200/80",
      };
    case "caution":
      return {
        ring: "ring-1 ring-amber-600/50",
        text: "text-amber-400",
        label: "text-amber-300/80",
      };
    default:
      return {
        ring: "ring-1 ring-red-500/40",
        text: "text-red-300",
        label: "text-red-200/70",
      };
  }
}
