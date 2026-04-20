export type BaselineMetrics = {
  grossRevenue: number;
  occupancyRate: number;
  bookingCount: number;
  adr: number;
  revpar: number;
};

export type OutcomeMetrics = {
  grossRevenue: number;
  occupancyRate: number;
  bookingCount: number;
  adr: number;
  revpar: number;
};

export type OutcomeEvaluation = {
  rewardScore: number;
  outcomeLabel: "positive" | "neutral" | "negative";
  deltas: {
    revenueDelta: number;
    occupancyDelta: number;
    bookingDelta: number;
    adrDelta: number;
    revparDelta: number;
  };
};
