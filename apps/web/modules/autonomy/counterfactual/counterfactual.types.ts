export type CounterfactualObservedMetrics = {
  revenue: number;
  occupancy: number;
  bookings: number;
  adr: number;
  revpar: number;
};

export type CounterfactualExpectedMetrics = {
  revenue: number;
  occupancy: number;
  bookings: number;
  adr: number;
  revpar: number;
};

export type CounterfactualEvaluationResult = {
  observed: CounterfactualObservedMetrics;
  expected: CounterfactualExpectedMetrics;
  uplift: {
    revenue: number;
    occupancy: number;
    bookings: number;
    adr: number;
    revpar: number;
  };
  upliftScore: number;
  confidenceScore: number;
  estimateMethod: "trend_projection" | "matched_context" | "blended";
};
