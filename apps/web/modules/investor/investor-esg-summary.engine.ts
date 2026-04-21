import type { ConfidenceTier } from "@/modules/investor/investor.types";
import type { InvestorListingContext } from "@/modules/investor/investor-context.loader";

export function confidenceFromEsg(ctx: InvestorListingContext): ConfidenceTier {
  const c = ctx.esgProfile?.evidenceConfidence;
  if (c == null) return "UNKNOWN";
  if (c >= 70) return "HIGH";
  if (c >= 45) return "MEDIUM";
  return "LOW";
}

export function buildEsgNarrativeParts(ctx: InvestorListingContext): {
  scoreLine: string;
  carbonLine: string;
  drivers: string[];
  gaps: string[];
  verifiedNote: string;
} {
  const grade = ctx.esgProfile?.grade ?? "—";
  const score = ctx.esgProfile?.compositeScore;
  const cov = ctx.esgProfile?.dataCoveragePercent;

  const scoreLine =
    score != null ?
      `Composite score **${score.toFixed(1)}** (grade **${grade}**) — methodology is internal to LECIPM; not a regulated label.`
    : "Composite ESG score not yet available from structured inputs — profile may be initializing.";

  const carbonParts: string[] = [];
  if (ctx.esgProfile?.carbonScore != null) carbonParts.push(`Carbon axis ≈ ${ctx.esgProfile.carbonScore.toFixed(0)} (estimated where utility data is incomplete).`);
  if (ctx.esgProfile?.highCarbonMaterials) carbonParts.push(`High embodied-carbon materials flag is set — review disclosures.`);
  const carbonLine =
    carbonParts.length > 0 ?
      carbonParts.join(" ")
    : "Carbon detail is thin in structured data — treat energy / carbon conclusions as **estimated, not verified** until utility evidence improves.";

  const drivers: string[] = [];
  if (ctx.esgProfile?.solar) drivers.push("Solar / renewable feature flagged in profile.");
  if (ctx.esgProfile?.renovation) drivers.push("Renovation history / intent flagged.");
  if (ctx.esgProfile?.certification) drivers.push(`Certification / label reference: ${ctx.esgProfile.certification} (confirm validity in diligence).`);

  const gaps: string[] = [];
  if (cov != null && cov < 60) gaps.push(`Evidence coverage ~${cov.toFixed(0)}% — disclosure gaps remain.`);
  if (ctx.evidenceCounts.documents === 0) gaps.push("No uploaded ESG documents on file — confidence remains limited.");

  const verifiedNote =
    "Verified vs. estimated: scores blend modeled defaults and uploaded evidence; items without primary documents remain **estimated**.";

  return { scoreLine, carbonLine, drivers, gaps, verifiedNote };
}
