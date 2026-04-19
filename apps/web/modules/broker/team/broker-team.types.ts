/**
 * Broker manager / team view — coaching visibility for admins and leads only (not broker-facing rankings).
 */

import type {
  BrokerExecutionBand,
  BrokerPerformanceEngineSnapshot,
} from "@/modules/broker/performance/broker-performance.types";
import type { BrokerIncentiveSummary } from "@/modules/broker/incentives/broker-incentives.types";
import type { BrokerProfileConfidenceLevel } from "@/modules/broker/profile/broker-profile.types";
import type {
  BrokerAvailabilityStatus,
  BrokerCapacityBand,
  BrokerSlaHealth,
} from "@/modules/broker/availability/broker-availability.types";

/** Aggregate follow-up posture for the cohort (advisory). */
export type BrokerTeamFollowUpHealth = "good" | "moderate" | "poor";

/** Support priority — not a punishment tier. */
export type BrokerTeamRiskLevel = "low" | "medium" | "high";

export type BrokerTeamInsightSeverity = "info" | "low" | "medium" | "high";

export type BrokerTeamInsightType =
  | "follow_up_culture"
  | "conversion_gap"
  | "capacity_wellness"
  | "recognition"
  | "pipeline_balance";

export type BrokerTeamSummary = {
  totalBrokers: number;
  activeBrokers: number;
  inactiveBrokers: number;
  avgPerformanceScore: number;
  /** Mean of wonDeals / max(leadsAssigned, 1) per broker in cohort */
  avgConversionRate: number;
  followUpHealth: BrokerTeamFollowUpHealth;
};

/** Compact declared profile — optional when service-profile flags are off. */
export type BrokerTeamProfileCompact = {
  topServiceArea: string | null;
  topSpecialization: string | null;
  acceptingNewLeads: boolean;
  profileConfidence: BrokerProfileConfidenceLevel;
};

export type BrokerTeamRow = {
  brokerId: string;
  displayName: string;
  performanceScore: number;
  band: BrokerExecutionBand;
  leadsAssigned: number;
  leadsActive: number;
  followUpsDue: number;
  followUpsOverdue: number;
  lastActiveAt: string | null;
  riskLevel: BrokerTeamRiskLevel;
  topStrength: string;
  topWeakness: string;
  profileCompact?: BrokerTeamProfileCompact;
  opsRouting?: BrokerTeamOpsRoutingCompact;
};

export type BrokerTeamInsight = {
  type: BrokerTeamInsightType;
  label: string;
  description: string;
  severity: BrokerTeamInsightSeverity;
  suggestedManagerAction: string;
};

export type BrokerTeamDashboardPayload = {
  summary: BrokerTeamSummary;
  rows: BrokerTeamRow[];
  topPerformers: BrokerTeamRow[];
  /** Brokers who may need additional support (risk signal — not a blame label). */
  supportPriorityBrokers: BrokerTeamRow[];
  inactiveBrokers: BrokerTeamRow[];
  insights: BrokerTeamInsight[];
  disclaimer: string;
  generatedAt: string;
};

export type BrokerTeamPipelineStageCount = {
  stage: string;
  count: number;
};

export type BrokerTeamManagerBrokerDetail = {
  brokerId: string;
  displayName: string;
  performance: BrokerPerformanceEngineSnapshot | null;
  pipelineStages: BrokerTeamPipelineStageCount[];
  followUpDiscipline: {
    followUpsDue: number;
    followUpsOverdue: number;
    followUpsCompleted: number;
    leadsActive: number;
  };
  incentives: BrokerIncentiveSummary | null;
  aiAssistNote: string;
  readOnly: true;
};
