/**
 * Capital preservation view — qualitative / educational. Not a risk model or advice.
 */

import type { PreservationSnapshot, WealthProfile } from "./wealth.types";
import { identifyOverconcentration } from "./allocation.service";

export function buildPreservationSnapshot(profile: WealthProfile): PreservationSnapshot {
  const concentrationFlags = identifyOverconcentration(profile);
  const months = profile.liquidity.monthsOfReserveCoverage;
  const liquid = profile.liquidity.liquidFraction;

  let downsideSensitivityLabel: PreservationSnapshot["downsideSensitivityLabel"] = "MODERATE";
  if (profile.riskBand === "CONSERVATIVE") downsideSensitivityLabel = "LOWER";
  if (profile.riskBand === "AGGRESSIVE") downsideSensitivityLabel = "HIGHER";

  const downsideSensitivityNotes = [
    "Sensitivity here reflects your selected risk band and concentration flags — not a modeled drawdown.",
    "Real outcomes depend on asset mix, leverage, liquidity terms, and correlations that change over time.",
  ];

  const ventureHeavy =
    (profile.primaryVentureWeight ?? 0) >= 0.25 ||
    (profile.buckets.find((b) => b.key === "OPERATING_VENTURES")?.currentWeight ?? 0) >= 0.35;

  const singleMarket =
    !!profile.primaryMarketRegion &&
    (profile.dependencyNotes?.toLowerCase().includes("concentrat") ||
      profile.dependencyNotes?.toLowerCase().includes("single market") ||
      false);

  const dependencyNotes: string[] = [];
  if (profile.dependencyNotes?.trim()) dependencyNotes.push(profile.dependencyNotes.trim());
  if (ventureHeavy) {
    dependencyNotes.push(
      "Material operating / venture weight can tie outcomes to a small number of cash-flow sources."
    );
  }
  if (singleMarket || profile.primaryMarketRegion) {
    dependencyNotes.push(
      `Geographic label "${profile.primaryMarketRegion ?? "—"}" is for awareness only; it does not measure true economic exposure.`
    );
  }

  return {
    liquidityRunwayMonths: months,
    liquidFraction: liquid,
    concentrationFlags,
    downsideSensitivityLabel,
    downsideSensitivityNotes,
    dependencyOnSingleCompany: (profile.primaryVentureWeight ?? 0) >= 0.4,
    dependencyOnSingleMarket: !!profile.primaryMarketRegion && concentrationFlags.length >= 2,
    dependencyNotes: dependencyNotes.length ? dependencyNotes : ["No extra dependency notes supplied on profile."],
  };
}
