import type { CalibrationMetrics } from "@/modules/model-validation/domain/validation.types";
import type { ClusterAnalysis, DisagreementClusterId } from "@/modules/model-validation/infrastructure/disagreementClusterService";
import type { TuningProfileConfig } from "@/modules/scoring/tuningProfile";

export type { ClusterAnalysis, DisagreementClusterId };

export type SimulationDiffRow = {
  itemId: string;
  entityId: string;
  before: {
    trustScore: number | null;
    dealScore: number | null;
    recommendation: string | null;
    trustAgreement: boolean | null;
    dealAgreement: boolean | null;
  };
  after: {
    trustScore: number | null;
    dealScore: number | null;
    recommendation: string | null;
    trustAgreement: boolean | null;
    dealAgreement: boolean | null;
  };
};

export type SimulationResult = {
  validationRunId: string;
  tuningProfileId: string;
  beforeMetrics: CalibrationMetrics;
  afterMetrics: CalibrationMetrics;
  diffs: SimulationDiffRow[];
  clustersBefore: ClusterAnalysis[];
};

export type TuningProfileRecord = {
  id: string;
  name: string | null;
  description: string | null;
  basedOnValidationRunId: string | null;
  config: TuningProfileConfig;
  createdBy: string | null;
  createdAt: Date;
  appliedAt: Date | null;
  appliedBy: string | null;
  supersedesId: string | null;
  isActive: boolean;
};

export type { TuningProfileConfig, CalibrationMetrics };
