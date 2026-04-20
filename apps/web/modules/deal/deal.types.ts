/** Intelligence pipeline lens — not the legal `Deal.status` string. */
export type DealIntelligenceStage = "VIEWING" | "OFFER" | "NEGOTIATION" | "CLOSED";

export type DealIntelligenceRisk = "LOW" | "MEDIUM" | "HIGH";

export type DealIntelligenceEventType = "VIEW" | "VISIT" | "OFFER" | "MESSAGE";

export type DealIntelligenceSnapshot = {
  dealId: string;
  dealScore: number;
  closeProbability: number;
  riskLevel: DealIntelligenceRisk;
  intelligenceStage: DealIntelligenceStage;
  suggestedAction: string;
  computedAt: Date;
  inputsSummary: {
    daysSinceLastActivity: number;
    eventCount14d: number;
    negotiationRoundMax: number;
    rejectedProposals: number;
    listPriceGapPct: number | null;
  };
};
