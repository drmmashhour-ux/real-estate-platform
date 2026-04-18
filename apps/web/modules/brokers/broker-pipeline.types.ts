export type BrokerStage = "new" | "contacted" | "replied" | "demo" | "converted" | "lost";

export type BrokerProspectSource = "manual" | "instagram" | "linkedin" | "referral";

export type BrokerMessageScriptKind =
  | "first_message"
  | "follow_up"
  | "demo_pitch"
  | "close"
  | "closing"
  | "featured_upsell"
  | "lead_unlock_pitch";

/** Operator classifications — not enforced by code. */
export type BrokerOperatorTag = "paying" | "active" | "high_value";

export type BrokerProspect = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  agency?: string;
  stage: BrokerStage;
  /** Timestamped notes (newest appended). */
  notes?: string[];
  source?: BrokerProspectSource;
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
  lastMessageType?: BrokerMessageScriptKind;
  firstPurchaseDate?: string;
  totalSpent?: number;
  /** Operator showed anonymized demo lead — workflow only; not a paid unlock. */
  demoLeadPreviewShown?: boolean;
  /** Acquisition performance — real counts only (operator + system hooks). */
  listingsCount?: number;
  leadsReceived?: number;
  leadsUnlocked?: number;
  /** Closed deals attributed in ops (manual or CRM sync). */
  closedDealsCount?: number;
  /** Lifetime revenue attributed to this prospect (CAD), manual + unlocked lead payments when linked. */
  revenueGenerated?: number;
  /** Last meaningful pipeline or revenue activity (ISO). */
  lastActivityAt?: string;
  /** Optional CRM region/city hint for lead routing (`Lead.purchaseRegion`-style). */
  territoryRegion?: string;
  /** Operator tags for prioritization in the dashboard. */
  operatorTags?: BrokerOperatorTag[];
};

export type BrokerPipelineSummary = {
  total: number;
  byStage: Record<BrokerStage, number>;
  /** Percentage 0–100 (one decimal). */
  conversionRate: number;
  createdAt: string;
};
