/** Maps numeric confidence to human-readable bands for UI. */
export function explainConfidence(score: number): { label: string; hint: string } {
  const s = Math.max(0, Math.min(1, score));
  if (s >= 0.85) return { label: "High", hint: "Strong match to historical patterns or clear structural signals." };
  if (s >= 0.65) return { label: "Moderate", hint: "Useful directionally; verify key facts before acting." };
  return { label: "Exploratory", hint: "Low certainty — treat as a hypothesis, not a directive." };
}
