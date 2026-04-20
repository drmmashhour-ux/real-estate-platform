/**
 * Policy Simulation Sandbox v1 — offline scenario replay (never affects production governance).
 */
import type { UnifiedGovernanceInput } from "../governance/unified-governance.types";

export interface PolicySimulationConfig {
  id: string;
  name: string;
  description?: string;

  thresholds?: {
    combinedRiskMedium?: number;
    combinedRiskHigh?: number;
    anomalySensitivity?: number;
    fraudWeight?: number;
    legalWeight?: number;
  };

  overrides?: {
    forceRequireApproval?: boolean;
    forceBlockHighRisk?: boolean;
  };
}

export interface PolicySimulationCase {
  caseId?: string;
  regionCode?: string;
  actionType?: string;
  entityType?: string;

  originalPrediction: {
    governanceDisposition: string;
    combinedRiskScore: number;
    legalRiskScore: number;
    fraudRiskScore: number;
  };

  truthEvents: Array<{
    type: string;
    amount?: number;
  }>;

  /** Snapshot of unified-governance inputs for deterministic replay (recommended). */
  replayInput?: UnifiedGovernanceInput;
}

export interface PolicySimulationResult {
  configId: string;

  totalCases: number;

  falsePositiveRate: number;
  falseNegativeRate: number;

  protectedRevenue: number;
  leakedRevenue: number;

  delta: {
    falsePositiveRate: number;
    falseNegativeRate: number;
    protectedRevenue: number;
    leakedRevenue: number;
  };

  narrative: string;
}

export interface PolicySimulationComparisonReport {
  baseline: PolicySimulationResult;
  scenarios: PolicySimulationResult[];
  bestScenarioId?: string;
}
