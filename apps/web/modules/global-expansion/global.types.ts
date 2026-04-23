/**
 * Global Expansion Engine — configuration and awareness types.
 * Not legal advice; rules are operator-configurable and must be reviewed by qualified counsel.
 */

export type DataHandlingMode =
  | "STANDARD"
  | "STRICT_PII"
  | "REGIONAL_RESIDENCY_HINT"
  | "ENCRYPTED_AT_REST_PREFERENCE";

export type CountryExpansionStatus = "planning" | "active" | "scaling" | "paused";

export type HubKey =
  | "BUYER"
  | "SELLER"
  | "BROKER"
  | "BNHUB"
  | "INVESTOR"
  | "RESIDENCE"
  | "MORTGAGE"
  | "INSURANCE";

export type FeatureKey =
  | "listings"
  | "bnhub"
  | "mortgage_hub"
  | "insurance_hub"
  | "investor_portal"
  | "residence_services"
  | "acquisition_crm"
  | "autonomous_marketing";

/** Operator-defined flag — extend as needed; values are labels for governance, not statute citations */
export type RegulatoryFlagToken = string;

export type CountryConfig = {
  countryCode: string;
  name: string;
  supportedCities: string[];
  defaultLanguage: string;
  supportedLanguages: string[];
  currency: string;
  /** IANA example for UX — validate in infra */
  timezone: string;
  activeHubs: HubKey[];
  enabledFeatures: FeatureKey[];
  regulatoryFlags: RegulatoryFlagToken[];
  paymentProvider: string;
  /** Human-readable contact constraints template — not legal text */
  contactRules: string;
  dataHandlingMode: DataHandlingMode;
  /** Readiness for expansion UI */
  expansionStatus: CountryExpansionStatus;
  /** Relative priority 0–100 for pipeline sorting */
  expansionReadinessScore: number;
};

export type MarketEntryStrategy = {
  countryCode: string;
  entryCities: string[];
  primaryHub: HubKey;
  targetAudience: string;
  initialMarketingStrategy: string;
  salesApproach: string;
};

export type RegulationView = {
  countryCode: string;
  allowedActions: string[];
  restrictedActions: string[];
  adminWarnings: string[];
  disclaimer: string;
  lastReviewedByPolicyNote: string;
};

export type CurrencyDisplay = {
  amount: number;
  currency: string;
  formatted: string;
  normalizedCents: number;
};

export type GlobalCountryPerformance = {
  countryCode: string;
  revenueCentsProxy: number;
  leadsProxy: number;
  growthRateProxy: number;
  lastUpdatedIso: string;
};

export type GlobalExpansionAlert = {
  id: string;
  kind: "country_ready" | "regulatory_conflict" | "rapid_growth" | "underperformance" | "data_isolation";
  countryCode: string;
  title: string;
  body: string;
  severity: "info" | "watch" | "important" | "critical";
};

export type GlobalDashboardSnapshot = {
  generatedAtIso: string;
  countries: (CountryConfig & { strategy?: MarketEntryStrategy })[];
  pipeline: { countryCode: string; name: string; expansionReadinessScore: number; status: CountryExpansionStatus }[];
  performance: GlobalCountryPerformance[];
  alerts: GlobalExpansionAlert[];
  dataIsolationNote: string;
};

export type CountryDetailView = {
  country: CountryConfig;
  strategy: MarketEntryStrategy;
  regulation: RegulationView;
  performance: GlobalCountryPerformance;
  integrationNotes: {
    marketDomination: string;
    cityLaunch: string;
    growthBrain: string;
    revenuePredictor: string;
  };
  launchHistory: { launchedAtIso: string; stepsCompleted: string[]; auditLine: string } | null;
  explainability: string[];
};

export type LaunchCountryResult = {
  countryCode: string;
  ok: boolean;
  steps: { id: string; label: string; done: boolean; detail: string }[];
  nextActions: string[];
  audit: string[];
  disclaimer: string;
};
