/**
 * LECIPM CRO — primary/secondary CTAs for BNHub listing hero.
 * Experiments (DB) win when `experimentPrimary` is set; otherwise unified learning > rotation > default.
 */

import { engineFlags, oneBrainV3Flags } from "@/config/feature-flags";
import { ctaPrimaryBiasForLabel } from "@/modules/platform-core/brain-v3-runtime-cache";
import { buildUnifiedSnapshot } from "@/modules/growth/unified-learning.service";

const PRIMARY_VARIANTS = ["Book now", "Reserve your stay", "Check availability"] as const;

function hashToUint(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export type ResolveBnhubListingCtaInput = {
  listingId: string;
  /** From `BNHUB_LISTING_CTA` experiment config when A/B is on */
  experimentPrimary?: string | null;
  /** When true, rotate among PRIMARY_VARIANTS if no experiment copy */
  rotationEnabled: boolean;
};

export type ResolvedBnhubListingCtas = {
  primary: string;
  /** Secondary always scrolls to #availability; label complements primary */
  secondary: string;
  source: "experiment" | "rotation" | "default" | "unified_learning";
  chosenBy?: "EXPERIMENT" | "UNIFIED_LEARNING" | "ROTATION" | "DEFAULT";
  reason?: string;
  evidenceQuality?: string | null;
  warnings?: string[];
};

export function resolveBnhubListingCtas(input: ResolveBnhubListingCtaInput): ResolvedBnhubListingCtas {
  const exp = input.experimentPrimary?.trim();
  if (exp) {
    const secondary = exp === "Check availability" ? "Book now" : "Check availability";
    return { primary: exp, secondary, source: "experiment", chosenBy: "EXPERIMENT", reason: "experiment_primary" };
  }
  if (engineFlags.croEngineV1) {
    const u = buildUnifiedSnapshot();
    const allowed = new Set<string>(PRIMARY_VARIANTS);
    const primary =
      u.preferredPrimaryCta && allowed.has(u.preferredPrimaryCta)
        ? u.preferredPrimaryCta
        : u.bestCtas.find((c) => allowed.has(c)) ?? null;
    const highEvidence = u.evidenceQualityHint === "HIGH" || u.evidenceQualityHint === "MEDIUM";
    const weakSupported = Boolean(u.snapshotQuality?.sqlLowConversionTagged && u.weakCtas.length > 0);
    if (primary && !u.weakCtas.includes(primary) && highEvidence) {
      const secondary = primary === "Check availability" ? "Book now" : "Check availability";
      const v3 =
        oneBrainV3Flags.oneBrainV3CrossDomainV1 && Math.abs(ctaPrimaryBiasForLabel(primary)) > 0.0005 ?
          ` · Brain V3 cross-domain CTA bias ${ctaPrimaryBiasForLabel(primary).toFixed(3)} (capped; explainable)`
        : "";
      return {
        primary,
        secondary,
        source: "unified_learning",
        chosenBy: "UNIFIED_LEARNING",
        reason: `unified_best_cta_with_supported_evidence${v3}`,
        evidenceQuality: u.evidenceQualityHint,
        warnings: u.warnings,
      };
    }
    if (primary && !u.weakCtas.includes(primary)) {
      const secondary = primary === "Check availability" ? "Book now" : "Check availability";
      return {
        primary,
        secondary,
        source: "unified_learning",
        chosenBy: "UNIFIED_LEARNING",
        reason: weakSupported ? "unified_best_cta" : "unified_best_cta_exploratory",
        evidenceQuality: u.evidenceQualityHint,
        warnings: [...(u.warnings ?? []), "Evidence not medium/high — prefer rotation-safe defaults."],
      };
    }
  }
  if (!input.rotationEnabled) {
    return {
      primary: "Book now",
      secondary: "Check availability",
      source: "default",
      chosenBy: "DEFAULT",
      reason: "rotation_disabled",
    };
  }
  const idx = hashToUint(`cro-cta:${input.listingId}`) % PRIMARY_VARIANTS.length;
  const primary = PRIMARY_VARIANTS[idx]!;
  const secondary = primary === "Check availability" ? "Book now" : "Check availability";
  return {
    primary,
    secondary,
    source: "rotation",
    chosenBy: "ROTATION",
    reason: "hash_rotation",
  };
}
