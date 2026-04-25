/**
 * Ideal broker profile (IBP) for early LECIPM adoption — manual sourcing; no automated scraping.
 * Used to align scoring and rep messaging (value: lead prioritization, not volume hype).
 */

export type ExperienceLevel = "junior" | "mid" | "senior";

export type ActivityLevel = "high" | "medium" | "low";

export type TechAdoption = "high" | "medium" | "low";

export type BrokerSpecializationTag = "condo" | "rental" | "investor" | "luxury" | "other";

/** What we are explicitly looking for in the first 10 “high-probability” brokers. */
export type IdealBrokerProfile = {
  experienceLevel: ExperienceLevel;
  /** Social / channel activity (manual assessment). */
  activityLevel: ActivityLevel;
  /** Primary city or submarket string (e.g. “Montréal”, “Gatineau”). */
  market: string;
  specialization: BrokerSpecializationTag;
  techAdoption: TechAdoption;
};

/**
 * Default ICP: mid-level, active on social, lead-prioritization pain — fits LECIPM’s first value props.
 * Not a data contract; product positioning only.
 */
export const IDEAL_BROKER_TARGET: IdealBrokerProfile = {
  experienceLevel: "mid",
  activityLevel: "high",
  market: "Greater Montréal / Québec",
  specialization: "condo",
  techAdoption: "high",
};

/**
 * Input for the scoring engine — can be fully manual or inferred from `OutreachLead` + your notes.
 */
export type BrokerTargetScoreInput = {
  experienceLevel: ExperienceLevel;
  activityLevel: ActivityLevel;
  market: string;
  specialization: string;
  techAdoption: TechAdoption;
  /** Inferred or noted: visible IG + LinkedIn or similar. */
  hasActiveSocials: boolean;
  /** How you’d label their reply speed (manual). */
  responsiveness: "fast" | "normal" | "unknown";
  source: string;
  /** You noted they struggle to pick which lead / deal to push on first. */
  leadPrioritizationPain?: boolean;
};

/** Typed slice of `OutreachLead.notes_json` for action tracking (no new columns required). */
export type BrokerOutreachNotesJson = {
  /** When a call was scheduled (ISO string). */
  callBookedAt?: string;
  /** Optional short interaction log. */
  interactionLog?: Array<{ at: string; action: "contacted" | "replied" | "call_booked" | "nudge"; note?: string }>;
};

export function isBrokerOutreachNotes(value: unknown): value is BrokerOutreachNotesJson {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
