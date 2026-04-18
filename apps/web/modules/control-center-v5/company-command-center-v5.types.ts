/**
 * Company Command Center V5 — operational mode views over V4 aggregate.
 */
import type {
  AiControlCenterRolloutSummary,
  AiControlCenterSystems,
  ExecutiveOverallStatus,
} from "@/modules/control-center/ai-control-center.types";

export type CommandCenterMode = "morning_brief" | "incident" | "launch" | "investor";

export type CommandCenterBriefPriority = {
  id: string;
  label: string;
};

export type CommandCenterIncidentSeverity = "low" | "medium" | "high" | "critical";

export type CommandCenterLaunchReadiness = "go" | "caution" | "hold";

export type MorningBriefModeView = {
  mode: "morning_brief";
  heroSummary: string;
  topChanges: string[];
  topRisks: string[];
  topOpportunities: string[];
  keySystems: { id: string; label: string; status: string; note: string }[];
  todayFocus: string[];
  warnings: string[];
};

export type IncidentModeView = {
  mode: "incident";
  severity: CommandCenterIncidentSeverity;
  incidentSummary: string;
  affectedSystems: string[];
  criticalWarnings: string[];
  rollbackSignals: string[];
  stabilityIndicators: Record<string, string | number | null>;
  recommendedAttentionAreas: string[];
};

export type LaunchModeView = {
  mode: "launch";
  launchReadiness: CommandCenterLaunchReadiness;
  blockers: string[];
  readinessChecklist: Record<string, boolean>;
  rolloutStates: { label: string; detail: string }[];
  recommendedGoNoGoNotes: string[];
  warnings: string[];
};

export type InvestorModeView = {
  mode: "investor";
  companySummary: string;
  growthSignals: string[];
  stabilitySignals: string[];
  moatSignals: string[];
  topMetrics: Record<string, string>;
  strategicRisks: string[];
  progressNarrative: string[];
};

export type CommandCenterModePayload = {
  morningBrief: MorningBriefModeView;
  incident: IncidentModeView;
  launch: LaunchModeView;
  investor: InvestorModeView;
};

export type CompanyCommandCenterV5Shared = {
  overallStatus: ExecutiveOverallStatus;
  systems: AiControlCenterSystems | null;
  rolloutSummary: AiControlCenterRolloutSummary;
  quickKpis: { label: string; value: string; href: string | null }[];
  meta: {
    systemsLoadedCount: number;
    overallStatus: ExecutiveOverallStatus;
    partialData: boolean;
  };
};

export type CompanyCommandCenterV5Meta = {
  currentWindow: { label: string; days: number; offsetDays: number };
  previousWindow: { label: string; days: number; offsetDays: number };
  dataFreshnessMs: number;
  sourcesUsed: string[];
  missingSources: string[];
  highlightsGenerated: number;
  focusedMode: CommandCenterMode | null;
};

export type CompanyCommandCenterV5Payload = {
  shared: CompanyCommandCenterV5Shared;
  modes: CommandCenterModePayload;
  meta: CompanyCommandCenterV5Meta;
  /** Echo of V4 digest/briefing counts for UI — read-only. */
  v4Echo: {
    briefingCardCount: number;
    digestItemCount: number;
    deltaChangedCount: number;
  };
};

export type LoadCompanyCommandCenterV5Params = {
  days?: number;
  limit?: number;
  offsetDays?: number;
  previousOffsetDays?: number;
  role?: string | null;
  presetId?: string | null;
  /** If set, non-selected modes get empty placeholder views. */
  mode?: string | null;
};
