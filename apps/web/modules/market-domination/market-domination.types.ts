export type TerritoryScope = "CITY" | "DISTRICT" | "NEIGHBORHOOD" | "REGION";

export type HubType =
  | "BUYER"
  | "SELLER"
  | "BROKER"
  | "BNHUB"
  | "INVESTOR"
  | "RESIDENCE";

export type PenetrationBand = "LOW" | "MEDIUM" | "HIGH" | "DOMINANT";

export type TerritoryMetrics = {
  listingsCount: number;
  activeBrokers: number;
  bnhubSupply: number;
  investorActivity: number;
  residenceServicesSupply: number;
  buyerDemand: number;
  renterDemand: number;
  leadVolume: number;
  bookingVolume: number;
  revenueCents: number;
  /** 0–1 */
  conversionRate: number;
  /** YoY or rolling approx -1..1 */
  growthRate: number;
  activeUsers: number;
  /** supply / demand proxy 0..2+ */
  supplyDemandRatio: number;
};

export type Territory = {
  id: string;
  name: string;
  scope: TerritoryScope;
  parentTerritoryId?: string;
  slug: string;
  regionLabel: string;
  metrics: TerritoryMetrics;
};

export type HubPenetrationResult = {
  hub: HubType;
  band: PenetrationBand;
  /** 0–1 */
  score: number;
  supportingMetrics: string[];
};

export type GapType =
  | "HIGH_DEMAND_LOW_SUPPLY"
  | "TRAFFIC_WEAK_CONVERSION"
  | "BROKER_UNDERREPRESENTED"
  | "BNHUB_LOW_INVENTORY"
  | "INVESTOR_INTEREST_WEAK_INVENTORY"
  | "RESIDENCE_DEMAND_LOW_SUPPLY";

export type MarketGap = {
  id: string;
  gapType: GapType;
  territoryId: string;
  severity: "watch" | "important" | "critical";
  whyItMatters: string;
  recommendedNextMove: string;
};

export type ReadinessBand = "NOT_READY" | "EMERGING" | "READY" | "PRIORITY";

export type ExpansionReadiness = {
  territoryId: string;
  score: number;
  band: ReadinessBand;
  strengths: string[];
  blockers: string[];
  recommendedEntryStrategy: string;
};

export type CompetitorCategory =
  | "LISTING_PLATFORM"
  | "RENTAL_PLATFORM"
  | "SHORT_TERM_RENTAL"
  | "BROKER_CRM"
  | "RESIDENCE_MARKETPLACE";

export type CompetitorRecord = {
  id: string;
  name: string;
  territoryId: string;
  category: CompetitorCategory;
  /** 1–10 perceived strength */
  perceivedStrength: number;
  notes?: string;
  opportunityNotes?: string;
};

export type CompetitorPressureView = {
  territoryId: string;
  pressureScore: number;
  attackAngles: string[];
  weaknessZones: string[];
};

export type DominationTrend = "up" | "flat" | "down";

export type TerritoryDomination = {
  territoryId: string;
  score: number;
  trend: DominationTrend;
  biggestWeakness: string;
  biggestStrength: string;
};

export type StrategicRecommendation = {
  id: string;
  action: string;
  territoryId: string;
  targetHub: HubType;
  expectedImpact: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high";
  /** 0–1 qualitative */
  confidence: number;
  explanation: string;
};

export type PrioritizedMarket = {
  rank: number;
  territoryId: string;
  territoryName: string;
  whyNow: string;
  targetHubs: HubType[];
  recommendedActions: string[];
  priorityScore: number;
};

export type TerritoryExplainability = {
  territoryId: string;
  scoreDrivers: string[];
  weakeners: string[];
  whyActNow: string;
  leadingHub: HubType;
};
