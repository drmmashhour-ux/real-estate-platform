import { buildMemoryRankHintFromSignals } from "@/lib/marketplace-memory/memory-ranking-hint";

/**
 * Advisory-only demand label for pricing assistants — never mutates prices.
 */
export function demandHintFromMemorySignals(signals: Record<string, unknown> | null | undefined): {
  demandIntensityLabel: "cool" | "warm" | "hot";
  rationale: string;
} | null {
  if (!signals || signals.personalizationEnabled !== true) return null;

  const hint = buildMemoryRankHintFromSignals(signals);
  const u = (signals.intentSummary as { urgencyScore?: number } | undefined)?.urgencyScore ?? 0;
  const active = (signals.behaviorSummary as { activeVsPassive?: string } | undefined)?.activeVsPassive === "active";

  if (!hint && u < 25 && !active) return null;

  let demandIntensityLabel: "cool" | "warm" | "hot" = "cool";
  if (u >= 55 || active) demandIntensityLabel = "hot";
  else if (u >= 30 || hint) demandIntensityLabel = "warm";

  const rationale =
    demandIntensityLabel === "hot"
      ? "Recent marketplace activity for this account is elevated — demand may be firmer than average (advisory only)."
      : demandIntensityLabel === "warm"
        ? "There is measurable browsing or preference signal — consider standard competitive positioning (advisory only)."
        : "Limited recent intensity signal — pricing can follow baseline comps (advisory only).";

  return { demandIntensityLabel, rationale };
}
