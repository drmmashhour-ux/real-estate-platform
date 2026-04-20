/** User-supplied underwriting assumptions (major currency units for money unless noted). */
export type UnderwritingInput = {
  purchasePrice: number;
  adr: number;
  occupancyRate: number;
  monthlyCost: number;
  financingRate?: number;
  downPayment?: number;
};

/** Deterministic outputs from the simplified BNHub-style revenue model (see methodologyNote). */
export type UnderwritingResult = {
  monthlyRevenue: number;
  annualRevenue: number;
  annualCost: number;
  cashFlowMonthly: number;
  roi: number;
  capRate: number;
  breakEvenOccupancy: number;
  methodologyNote: string;
};

export type ScenarioInput = {
  occupancyDelta?: number;
  adrDelta?: number;
  costDelta?: number;
};

export type ScenarioPackEntry = {
  label: string;
  description: string;
  deltas: ScenarioInput;
  result: UnderwritingResult;
};

export type ScenarioPack = {
  baseline: ScenarioPackEntry;
  optimistic: ScenarioPackEntry;
  pessimistic: ScenarioPackEntry;
  stress: ScenarioPackEntry;
};
