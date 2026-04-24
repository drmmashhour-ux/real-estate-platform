/**
 * LECIPM Green Score & Optimization Program — internal scoring only.
 * Never implies Rénoclimat, municipal bylaws, or official third-party certification.
 */

export type GreenProgramTier = "none" | "free" | "premium";

/** Monetization labels (stripe/billing wired separately). */
export const GREEN_PROGRAM_PRICING = {
  BASIC: {
    tier: "none" as const,
    label: "Suggestions",
    includes: ["ESG-oriented upgrade ideas", "Rough internal score preview"],
  },
  PREMIUM: {
    tier: "premium" as const,
    label: "Green Upgrade Program",
    includes: ["Full staged upgrade plan", "LECIPM Green Certified badge (internal score)", "Browse priority boost"],
    /** Display only — reconcile with Stripe product id in billing layer */
    hintMonthlyCad: "49",
  },
} as const;

export type GreenImprovementImpact = "LOW" | "MEDIUM" | "HIGH";

export type GreenImprovement = {
  action: string;
  impact: GreenImprovementImpact;
  estimatedCostLabel: string;
  expectedGainPoints: number;
};

export type GreenEngineInput = {
  propertyType?: string | null;
  /** Year built — newer builds score higher baseline */
  yearBuilt?: number | null;
  surfaceSqft?: number | null;
  /** User-reported / intake fields */
  heatingType?: string | null;
  insulationQuality?: "poor" | "average" | "good" | "unknown";
  windowsQuality?: "single" | "double" | "triple_high_performance" | "unknown";
  hasHeatPump?: boolean | null;
  solarPvKw?: number | null;
  /** Self-declared major retrofits */
  envelopeRetrofitYearsAgo?: number | null;

  /** Québec ESG layer — attic vs wall when known */
  atticInsulationQuality?: "poor" | "average" | "good" | "unknown";
  wallInsulationQuality?: "poor" | "average" | "good" | "unknown";
  materialsProfile?: "sustainable" | "standard" | "unknown";
  waterEfficiency?: "low" | "average" | "high" | "unknown";
  /** Relative consumption band — high = inefficient / costly */
  energyConsumptionBand?: "high" | "moderate" | "low" | "unknown";
  /** Often relevant in Montréal / dense cores */
  hasGreenRoof?: boolean | null;
};

export type GreenEngineOutput = {
  currentScore: number;
  /** Ceiling after realistic upgrades for this archetype */
  targetScore: number;
  improvements: GreenImprovement[];
};

export type GreenOfficialDocumentRef = {
  /** e.g. energuide, renovation_invoice — staff review queue */
  kind: string;
  storagePath?: string;
  uploadedAtIso: string;
  note?: string;
};

export function parseGreenProgramTier(raw: unknown): GreenProgramTier {
  if (raw === "premium" || raw === "free" || raw === "none") return raw;
  return "none";
}

export type GreenListingMetadata = {
  selectedImprovementActions?: string[];
  officialDocuments?: GreenOfficialDocumentRef[];
  disclaimerAcceptedAt?: string;
  /** Never store unredacted government certificate numbers in logs */
  programNotes?: string;
  /** Last Québec ESG snapshot from server-side sync (browse / dashboard) */
  quebecEsgSnapshot?: {
    score: number;
    label: string;
    breakdown: Record<string, number>;
    improvementAreas: string[];
    disclaimer: string;
    updatedAtIso?: string;
    recommendations?: any[];
    simulation?: any;
    callouts?: any;
  };
  /** Illustrative grants matched to engine recommendations — verify with official programs */
  grantsSnapshot?: {
    eligibleGrants: Array<{ id: string; name: string; amount: string; reason: string; howToApply: string }>;
    disclaimer: string;
    byRecommendation: Array<{ action: string; grants: Array<{ id: string; name: string; amount: string; reason: string; howToApply: string }> }>;
    updatedAtIso?: string;
  };
  /** Precomputed search/ranking fields — non-destructive merge; filled by green sync / jobs. */
  greenSearchSnapshot?: {
    currentScore?: number;
    projectedScore?: number;
    scoreDelta?: number;
    quebecLabel?: string;
    label?: "GREEN" | "IMPROVABLE" | "LOW";
    improvementPotential?: "high" | "medium" | "low";
    /** Illustrative $ sum from grant hints. */
    estimatedIncentivesTotal?: number;
    rankingBoostSuggestion?: number;
    /** Optional — persisted when known from last evaluation */
    hasSolarIndicated?: boolean;
    hasGreenRoofIndicated?: boolean;
    updatedAtIso?: string;
  };
  /**
   * Optional user-provided or imported intake (additive) — not required for read paths.
   */
  greenIntake?: GreenEngineInput;
  /** Shorthand recommendations (optional cache). */
  recommendationsSnapshot?: string[];
  /**
   * Aggregated incentive hint total (illustrative) — may mirror grants or a broker-computed sum.
   * Does not replace `grantsSnapshot` detail.
   */
  incentivesSnapshot?: {
    totalIllustrativeCad?: number;
    note?: string;
    updatedAtIso?: string;
  };
  /** Non-guarantee ROI / value narrative for discovery (internal or owner-facing tools). */
  roiSnapshot?: {
    bandLabel?: string;
    note?: string;
    updatedAtIso?: string;
  };
  /** Browse-ranking assist from premium / program (1.x scale). */
  pricingBoostSnapshot?: {
    boostFactor?: number;
    note?: string;
    updatedAtIso?: string;
  };
  /**
   * Wave: Québec ESG economics (costs, incentives, ROI, internal pricing signal) — additive merge in PATCH.
   * Serialized JSON only; verify all figures with official programs and contractors.
   */
  quebecEsgEconomicsSnapshot?: {
    recommendationKeys?: string[];
    projectedQuebecScore?: number;
    currentQuebecScore?: number;
    costEstimates?: Record<string, unknown>;
    incentives?: Record<string, unknown>;
    roi?: Record<string, unknown>;
    pricingBoost?: Record<string, unknown>;
    disclaimers?: string[];
    catalogVersion?: string;
    updatedAtIso?: string;
  };
};
