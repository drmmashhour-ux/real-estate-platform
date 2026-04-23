/** Tunable weights — centralized, typed (PART 17). */
export type DominationWeights = {
  penetration: number;
  revenueContribution: number;
  supplyCoverage: number;
  demandCapture: number;
  repeatUsage: number;
  growthMomentum: number;
};

export const DEFAULT_DOMINATION_WEIGHTS: DominationWeights = {
  penetration: 0.22,
  revenueContribution: 0.2,
  supplyCoverage: 0.14,
  demandCapture: 0.18,
  repeatUsage: 0.12,
  growthMomentum: 0.14,
};

export type PrioritizationWeights = {
  revenueUpside: number;
  speedToWin: number;
  demandIntensity: number;
  strategicFit: number;
  operationalFeasibility: number;
  competitorWeakness: number;
};

export const DEFAULT_PRIORITIZATION_WEIGHTS: PrioritizationWeights = {
  revenueUpside: 0.26,
  speedToWin: 0.14,
  demandIntensity: 0.2,
  strategicFit: 0.14,
  operationalFeasibility: 0.14,
  competitorWeakness: 0.12,
};

export type ReadinessWeights = {
  supply: number;
  demandSignals: number;
  operationalCoverage: number;
  revenueSignals: number;
  conversionPotential: number;
  localTraction: number;
};

export const DEFAULT_READINESS_WEIGHTS: ReadinessWeights = {
  supply: 0.18,
  demandSignals: 0.22,
  operationalCoverage: 0.18,
  revenueSignals: 0.16,
  conversionPotential: 0.14,
  localTraction: 0.12,
};
