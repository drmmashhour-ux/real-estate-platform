export const ScenarioKind = {
  CONSERVATIVE: "conservative",
  EXPECTED: "expected",
  AGGRESSIVE: "aggressive",
} as const;
export type ScenarioKind = (typeof ScenarioKind)[keyof typeof ScenarioKind];

export const ScenarioMode = {
  RENTAL: "rental",
  BNHUB: "bnhub",
} as const;
export type ScenarioMode = (typeof ScenarioMode)[keyof typeof ScenarioMode];

export type RentalScenarioMetrics = {
  scenarioType: ScenarioKind;
  scenarioMode: typeof ScenarioMode.RENTAL;
  monthlyRentCents: number | null;
  occupancyRate: number | null;
  operatingCostCents: number | null;
  mortgageCostCents: number | null;
  monthlyCashFlowCents: number | null;
  annualRoi: number | null;
  capRate: number | null;
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  mortgageUnavailableReason: string | null;
};

export type BnhubScenarioMetrics = {
  scenarioType: ScenarioKind;
  scenarioMode: typeof ScenarioMode.BNHUB;
  nightlyRateCents: number | null;
  occupancyRate: number | null;
  platformFeeCents: number | null;
  cleaningCostCents: number | null;
  monthlyGrossRevenueCents: number | null;
  monthlyNetOperatingCents: number | null;
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
};

export type SimulatedScenarioRow = RentalScenarioMetrics | BnhubScenarioMetrics;
