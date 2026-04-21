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
  };
  /** Illustrative grants matched to engine recommendations — verify with official programs */
  grantsSnapshot?: {
    eligibleGrants: Array<{ id: string; name: string; amount: string; reason: string; howToApply: string }>;
    disclaimer: string;
    byRecommendation: Array<{ action: string; grants: Array<{ id: string; name: string; amount: string; reason: string; howToApply: string }> }>;
    updatedAtIso?: string;
  };
};
