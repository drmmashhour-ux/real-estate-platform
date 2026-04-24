import type { GreenEngineInput, GreenListingMetadata } from "@/modules/green/green.types";
import { evaluateGreenEngine } from "@/modules/green/green.engine";
import { runGreenAiAnalysis } from "@/modules/green-ai/green-ai.engine";
import { findEligibleGrants } from "@/modules/green-ai/grants/grants.engine";
import { evaluateGreenVerifiedPresentation } from "@/modules/green-ai/green-certification";
import { parseGreenProgramTier } from "@/modules/green/green.types";
import type { GreenAiPerformanceLabel, GreenVerificationLevel } from "@/modules/green-ai/green.types";
import { GREEN_SEARCH_PUBLIC_DISCLAIMER, logGreenEvent } from "./green-search-helpers";
import { sumIllustrativeGrantDollars } from "./green-search-parsing";
import type { GreenSearchResultDecoration, PublicListingGreenPayload } from "./green-search.types";

/**
 * Generic FSBO (or similar) record — fields optional; decoration stays null-safe.
 */
export type GreenListableInput = {
  id?: string;
  yearBuilt?: number | null;
  propertyType?: string | null;
  surfaceSqft?: number | null;
  lecipmGreenInternalScore?: number | null;
  lecipmGreenAiLabel?: string | null;
  lecipmGreenMetadataJson?: unknown;
  lecipmGreenProgramTier?: string | null;
  lecipmGreenCertifiedAt?: Date | string | null;
  lecipmGreenVerificationLevel?: string | null;
  lecipmGreenConfidence?: number | null;
  sellerDeclarationJson?: unknown;
};

function parseLabel(raw: string | null | undefined): "GREEN" | "IMPROVABLE" | "LOW" | null {
  if (raw === "GREEN" || raw === "IMPROVABLE" || raw === "LOW") return raw;
  return null;
}

function improvementBucket(delta: number | null): "high" | "medium" | "low" | null {
  if (delta == null) return null;
  if (delta >= 20) return "high";
  if (delta >= 10) return "medium";
  return "low";
}

function readMetadata(raw: unknown): GreenListingMetadata | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as GreenListingMetadata;
  return null;
}

function breakdownHeuristics(b: Record<string, number> | undefined) {
  if (!b) {
    return {
      efficientHeating: null as boolean | null,
      highInsulation: null as boolean | null,
      highWindowPerformance: null as boolean | null,
    };
  }
  return {
    efficientHeating: typeof b.heating === "number" ? b.heating >= 70 : null,
    highInsulation: typeof b.insulation === "number" ? b.insulation >= 68 : null,
    highWindowPerformance: typeof b.windows === "number" ? b.windows >= 70 : null,
  };
}

function mapQuebecEsgToLecipm(que: string | undefined): "GREEN" | "IMPROVABLE" | "LOW" {
  if (que === "GREEN") return "GREEN";
  if (que === "STANDARD") return "IMPROVABLE";
  return "LOW";
}

function heatingScoreFromIntake(intake: GreenEngineInput): number {
  if (intake.hasHeatPump === true) return 94;
  const h = (intake.heatingType ?? "").toLowerCase();
  if (h.includes("heat pump") || h.includes("thermopompe")) return 94;
  if (h.includes("oil") || h.includes("fioul")) return 30;
  if (h.includes("gas") || h.includes("gaz") || h.includes("propane")) return 44;
  if (h.includes("baseboard") || h.includes("plinthe")) return 56;
  if (h.includes("electric") || h.includes("électrique")) return 64;
  return 46;
}

function buildBrokersCallouts(d: GreenSearchResultDecoration): string[] {
  const out: string[] = [];
  if (d.currentScore != null && d.currentScore >= 70) {
    out.push("Strong modeled current performance — verify with on-site or official sources.");
  }
  if (d.scoreDelta != null && d.scoreDelta >= 12) {
    out.push("Meaningful upgrade delta — internal prioritization only, not a quote.");
  }
  if (d.hasPotentialIncentives) {
    out.push("Illustrative incentive tags — reconfirm each program with the client.");
  }
  if (d.rankingBoostSuggestion != null && d.rankingBoostSuggestion > 1.04) {
    out.push("Internal boost is assistive; default relevance can still differ for buyers.");
  }
  return out.slice(0, 4);
}

/**
 * Read snapshots / DB fields and optionally run deterministic on-the-fly evaluation.
 * **Never throws** to callers.
 */
export function decorateListingWithGreenSignals(listing: GreenListableInput): GreenSearchResultDecoration {
  const disclaimers = [GREEN_SEARCH_PUBLIC_DISCLAIMER];
  const meta = readMetadata(listing.lecipmGreenMetadataJson);
  const rationale: string[] = [];
  let usedSnapshot = false;
  let computedOnTheFly = false;

  let currentScore: number | null = typeof listing.lecipmGreenInternalScore === "number" ? listing.lecipmGreenInternalScore : null;
  let projectedScore: number | null = null;
  let quebecLabel: string | null = null;

  const qs = meta?.quebecEsgSnapshot;
  const grants = meta?.grantsSnapshot;
  const gSnap = meta?.greenSearchSnapshot;
  const recSnap = meta?.recommendationsSnapshot;
  const invSnap = meta?.incentivesSnapshot;
  const roiSnap = meta?.roiSnapshot;
  const priceBoostSnap = meta?.pricingBoostSnapshot;
  if (recSnap && recSnap.length) {
    usedSnapshot = true;
    logGreenEvent("green_snapshot_used", { id: listing.id, layer: "recommendationsSnapshot" });
  }
  if (invSnap && (invSnap.totalIllustrativeCad != null || invSnap.note)) {
    usedSnapshot = true;
    logGreenEvent("green_snapshot_used", { id: listing.id, layer: "incentivesSnapshot" });
  }
  if (roiSnap && (roiSnap.bandLabel || roiSnap.note)) {
    usedSnapshot = true;
    logGreenEvent("green_snapshot_used", { id: listing.id, layer: "roiSnapshot" });
  }
  if (priceBoostSnap && (priceBoostSnap.boostFactor != null || priceBoostSnap.note)) {
    usedSnapshot = true;
    logGreenEvent("green_snapshot_used", { id: listing.id, layer: "pricingBoostSnapshot" });
  }
  const intakeFromMeta: GreenEngineInput = {
    propertyType: listing.propertyType ?? null,
    yearBuilt: listing.yearBuilt ?? null,
    surfaceSqft: listing.surfaceSqft ?? null,
    ...(meta?.greenIntake ?? {}),
  };

  if (qs) {
    usedSnapshot = true;
    logGreenEvent("green_snapshot_used", { id: listing.id, layer: "quebecEsgSnapshot" });
    if (currentScore == null) currentScore = qs.score;
    quebecLabel = qs.label;
  } else {
    logGreenEvent("green_snapshot_missing", { id: listing.id, reason: "no_quebec_snapshot" });
  }

  if (gSnap) {
    usedSnapshot = true;
    if (gSnap.currentScore != null) currentScore = gSnap.currentScore;
    if (gSnap.projectedScore != null) projectedScore = gSnap.projectedScore;
    if (gSnap.quebecLabel) quebecLabel = gSnap.quebecLabel;
  }
  for (const line of recSnap?.slice(0, 2) ?? []) {
    if (line && typeof line === "string" && line.trim()) {
      rationale.push(`Recommendation (cached): ${line.slice(0, 160)}${line.length > 160 ? "…" : ""}`);
    }
  }
  if (roiSnap?.note && roiSnap.note.trim()) {
    rationale.push(`Modeled value / ROI context (illustrative): ${roiSnap.note.slice(0, 200)}`);
  } else if (roiSnap?.bandLabel) {
    rationale.push(`Modeled ROI band: ${roiSnap.bandLabel} (not a guarantee).`);
  }

  const labelLec: "GREEN" | "IMPROVABLE" | "LOW" | null =
    (gSnap?.label as "GREEN" | "IMPROVABLE" | "LOW" | undefined) ??
    parseLabel(listing.lecipmGreenAiLabel) ??
    (quebecLabel ? mapQuebecEsgToLecipm(quebecLabel) : null);

  let h = breakdownHeuristics(qs?.breakdown as Record<string, number> | undefined);
  let hasSolar: boolean | null = gSnap?.hasSolarIndicated ?? null;
  let hasGreenRoof: boolean | null = gSnap?.hasGreenRoofIndicated ?? null;

  let hasPotentialIncentives = (grants?.eligibleGrants?.length ?? 0) > 0;
  let estimatedIncentives: number | null =
    typeof gSnap?.estimatedIncentivesTotal === "number" ? gSnap.estimatedIncentivesTotal : null;
  if (estimatedIncentives == null && grants?.eligibleGrants?.length) {
    estimatedIncentives = sumIllustrativeGrantDollars(grants.eligibleGrants.map((g) => g.amount));
  }
  if (invSnap && typeof invSnap.totalIllustrativeCad === "number" && invSnap.totalIllustrativeCad >= 0) {
    if (estimatedIncentives == null) estimatedIncentives = invSnap.totalIllustrativeCad;
    if (invSnap.totalIllustrativeCad > 0) hasPotentialIncentives = true;
  }

  try {
    const canModelFull = Boolean(
      qs || intakeFromMeta.insulationQuality || intakeFromMeta.windowsQuality || intakeFromMeta.heatingType
    );
    if (canModelFull) {
      const e = evaluateGreenEngine(intakeFromMeta);
      const engineGrants = findEligibleGrants({ property: intakeFromMeta, plannedUpgrades: e.improvements });
      if (projectedScore == null) projectedScore = e.targetScore;
      if (estimatedIncentives == null && engineGrants.eligibleGrants.length) {
        estimatedIncentives = sumIllustrativeGrantDollars(engineGrants.eligibleGrants.map((g) => g.amount));
      }
      hasPotentialIncentives = hasPotentialIncentives || engineGrants.eligibleGrants.length > 0;
      if (!qs) {
        const ai = runGreenAiAnalysis({ intake: intakeFromMeta, documents: [] });
        computedOnTheFly = true;
        if (currentScore == null) currentScore = ai.score;
        quebecLabel = quebecLabel ?? ai.quebecEsg.label;
        h = {
          efficientHeating: heatingScoreFromIntake(intakeFromMeta) >= 70,
          highInsulation: intakeFromMeta.insulationQuality === "good" || intakeFromMeta.atticInsulationQuality === "good" ? true : null,
          highWindowPerformance:
            intakeFromMeta.windowsQuality === "triple_high_performance" || intakeFromMeta.windowsQuality === "double" ? true : null,
        };
        hasSolar = (intakeFromMeta.solarPvKw ?? 0) > 0;
        hasGreenRoof = intakeFromMeta.hasGreenRoof === true;
      } else {
        if (hasSolar == null) hasSolar = (intakeFromMeta.solarPvKw ?? 0) > 0;
        if (hasGreenRoof == null) hasGreenRoof = intakeFromMeta.hasGreenRoof === true;
      }
    } else if (typeof listing.yearBuilt === "number" && listing.yearBuilt > 1700) {
      const e = evaluateGreenEngine({ yearBuilt: listing.yearBuilt, propertyType: listing.propertyType });
      computedOnTheFly = true;
      if (currentScore == null) currentScore = e.currentScore;
      if (projectedScore == null) projectedScore = e.targetScore;
      rationale.push("Heuristic from year built only; add heating/envelope detail for a tighter model.");
    }
  } catch {
    rationale.push("Could not run extended green evaluation; showing stored signals when present.");
  }

  let scoreDelta: number | null = null;
  if (gSnap?.scoreDelta != null) {
    scoreDelta = gSnap.scoreDelta;
  } else if (currentScore != null && projectedScore != null) {
    scoreDelta = Math.max(0, projectedScore - currentScore);
  } else {
    scoreDelta = null;
  }
  if (gSnap?.projectedScore != null) projectedScore = gSnap.projectedScore;

  const improv = gSnap?.improvementPotential ?? improvementBucket(scoreDelta);

  const tier = parseGreenProgramTier(listing.lecipmGreenProgramTier ?? "none");
  const pres = evaluateGreenVerifiedPresentation({
    score: currentScore,
    label: (labelLec as GreenAiPerformanceLabel) ?? null,
    verificationLevel: (listing.lecipmGreenVerificationLevel as GreenVerificationLevel) ?? null,
    confidence: listing.lecipmGreenConfidence,
    programTier: tier,
  });
  const baseBoost: number =
    typeof gSnap?.rankingBoostSuggestion === "number"
      ? gSnap.rankingBoostSuggestion
      : pres.showBadge
        ? 1.05
        : tier === "premium"
          ? 1.03
          : 1.0;
  const fromPricingSnapshot =
    typeof priceBoostSnap?.boostFactor === "number" && Number.isFinite(priceBoostSnap.boostFactor)
      ? priceBoostSnap.boostFactor
      : null;
  const rankingBoostSuggestion: number =
    fromPricingSnapshot != null
      ? Math.max(1, Math.min(1.12, Math.max(baseBoost, fromPricingSnapshot)))
      : baseBoost;

  if (rationale.length < 2) {
    if (quebecLabel) {
      rationale.push(`Québec factor-model: ${quebecLabel} (not a government or EnerGuide label).`);
    } else if (labelLec) {
      rationale.push(`LECIPM model band: ${labelLec} — not an official certification.`);
    }
  }

  const d: GreenSearchResultDecoration = {
    currentScore,
    projectedScore,
    scoreDelta,
    label: labelLec,
    quebecLabel,
    improvementPotential: improv,
    hasPotentialIncentives,
    estimatedIncentives,
    rankingBoostSuggestion: Number.isFinite(rankingBoostSuggestion) ? rankingBoostSuggestion : 1.0,
    brokerCallouts: [],
    disclaimers,
    rationale: rationale.slice(0, 6),
    efficientHeating: h.efficientHeating,
    highInsulation: h.highInsulation,
    highWindowPerformance: h.highWindowPerformance,
    hasSolar,
    hasGreenRoof,
    usedSnapshot,
    computedOnTheFly,
  };

  d.brokerCallouts = buildBrokersCallouts(d);
  logGreenEvent("green_search_decoration_applied", {
    id: listing.id,
    usedSnapshot: d.usedSnapshot,
    computedOnTheFly: d.computedOnTheFly,
  });

  return d;
}

export function toPublicListingGreenPayload(
  d: GreenSearchResultDecoration
): PublicListingGreenPayload {
  return {
    currentScore: d.currentScore,
    projectedScore: d.projectedScore,
    scoreDelta: d.scoreDelta,
    label: d.label,
    quebecLabel: d.quebecLabel,
    improvementPotential: d.improvementPotential,
    estimatedIncentives: d.estimatedIncentives,
    rationale: d.rationale.slice(0, 4),
    disclaimer: GREEN_SEARCH_PUBLIC_DISCLAIMER,
  };
}
