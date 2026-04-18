/** Ordered narrative sections for the LECIPM investor pitch. */
export type PitchSectionId =
  | "problem"
  | "solution"
  | "product"
  | "business_model"
  | "traction"
  | "market"
  | "advantage"
  | "vision"
  | "ask";

export type PitchVariant = "short" | "long" | "standard";

export type PitchSection = {
  id: PitchSectionId;
  title: string;
  content: string;
  bullets: string[];
};

/** Snapshot inputs for narrative + readiness (no secrets). */
export type PitchDeckContext = {
  totalUsers: number;
  activeUsers30d: number;
  totalListings: number;
  bookings30d: number;
  revenue30d: number;
  conversionRate: number;
  leads30d: number;
  buyerPersonaUsers: number;
  buyersToListingsRatio: number;
};

export type InvestorReadiness = "LOW" | "MEDIUM" | "STRONG";
