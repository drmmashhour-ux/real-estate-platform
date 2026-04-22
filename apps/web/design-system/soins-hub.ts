/**
 * Soins Hub — luxury black/gold + urgency semantics (accessible, high contrast).
 */

export const SOINS_HUB = {
  bg: "#050505",
  surface: "#0D0D0D",
  surfaceElevated: "#141414",
  gold: "#D4AF37",
  goldMuted: "rgba(212, 175, 55, 0.55)",
  text: "#FAFAF8",
  textMuted: "rgba(250, 250, 248, 0.62)",
  borderSubtle: "rgba(212, 175, 55, 0.14)",
  /** Normal / stable */
  urgencyNormal: "#22C55E",
  /** Attention / review soon */
  urgencyAttention: "#EAB308",
  /** Emergency / critical */
  urgencyCritical: "#EF4444",
} as const;

export type SoinsUrgencyLevel = "normal" | "attention" | "emergency";

export function urgencyFromSeverity(
  s: "LOW" | "MEDIUM" | "HIGH" | string
): SoinsUrgencyLevel {
  const u = s.toUpperCase();
  if (u === "HIGH" || u === "EMERGENCY") return "emergency";
  if (u === "MEDIUM" || u === "ATTENTION") return "attention";
  return "normal";
}

export const SOINS_TYPE_SCALE = {
  /** Default body — still large for older users */
  body: "text-[17px] leading-relaxed",
  /** Emphasis / tiles */
  lead: "text-xl leading-snug md:text-2xl",
  /** Headers */
  title: "text-2xl font-semibold tracking-tight md:text-3xl",
  /** Minimum tap-friendly control height */
  minTap: "min-h-[52px] min-w-[52px]",
} as const;
