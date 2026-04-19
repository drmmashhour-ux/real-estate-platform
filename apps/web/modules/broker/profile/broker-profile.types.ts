/**
 * Broker service areas + specialization — explicit declarations only; routing reads these as hints.
 */

export type BrokerServiceAreaPriority = "primary" | "secondary" | "occasional";

export type BrokerServiceArea = {
  country?: string | null;
  city: string;
  area?: string | null;
  priorityLevel: BrokerServiceAreaPriority;
};

export type BrokerSpecializationPropertyType =
  | "residential"
  | "condo"
  | "commercial"
  | "land"
  | "rental"
  | "bnhub"
  | "luxury"
  | "investor";

export type BrokerSpecializationConfidenceSource = "self_declared" | "observed" | "admin_verified";

export type BrokerSpecialization = {
  propertyType: BrokerSpecializationPropertyType;
  confidenceSource: BrokerSpecializationConfidenceSource;
  enabled: boolean;
};

export type BrokerLeadPreferenceType =
  | "buyer"
  | "seller"
  | "renter"
  | "investor"
  | "host"
  | "consultation";

export type BrokerLeadPreferencePriority = "preferred" | "standard" | "avoid";

export type BrokerLeadPreference = {
  leadType: BrokerLeadPreferenceType;
  priorityLevel: BrokerLeadPreferencePriority;
};

export type BrokerLanguageProficiency = "native" | "fluent" | "working";

export type BrokerLanguageProfile = {
  code: string;
  label: string;
  proficiency: BrokerLanguageProficiency;
};

export type BrokerCapacityProfile = {
  maxActiveLeads?: number | null;
  preferredActiveRange?: { min?: number; max?: number } | null;
  acceptingNewLeads: boolean;
};

export type BrokerProfileConfidenceLevel = "low" | "medium" | "high";

/** Persisted JSON — no computed routing fields. */
export type BrokerServiceProfileStored = {
  serviceAreas: BrokerServiceArea[];
  specializations: BrokerSpecialization[];
  leadPreferences: BrokerLeadPreference[];
  languages: BrokerLanguageProfile[];
  capacity: BrokerCapacityProfile;
  notes?: string | null;
  /** When set, boosts confidence for admin-verified rows in merge logic. */
  adminVerifiedAt?: string | null;
};

/** Full profile including identity + computed confidence for routing UI. */
export type BrokerServiceProfile = {
  brokerId: string;
  displayName: string;
  serviceAreas: BrokerServiceArea[];
  specializations: BrokerSpecialization[];
  leadPreferences: BrokerLeadPreference[];
  languages: BrokerLanguageProfile[];
  capacity: BrokerCapacityProfile;
  notes?: string | null;
  profileConfidence: BrokerProfileConfidenceLevel;
  updatedAt: string;
};

/** Explainable routing hints attached to distribution candidates. */
export type BrokerProfileRoutingHints = {
  serviceAreaMatch?: string;
  specializationMatch?: string;
  languageMatch?: boolean;
  capacityNote?: string;
  /** Advisory only — lighter pipeline vs peers, not a guarantee of availability. */
  capacityAvailabilityFit?: boolean;
  observedSupportNote?: string;
  profileConfidenceNote?: string;
};
