export type BrokerStage = "new" | "contacted" | "replied" | "demo" | "converted" | "lost";

export type BrokerProspectSource = "manual" | "instagram" | "linkedin" | "referral";

export type BrokerMessageScriptKind = "first_message" | "follow_up" | "demo_pitch" | "close";

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
};

export type BrokerPipelineSummary = {
  total: number;
  byStage: Record<BrokerStage, number>;
  /** Percentage 0–100 (one decimal). */
  conversionRate: number;
  createdAt: string;
};
