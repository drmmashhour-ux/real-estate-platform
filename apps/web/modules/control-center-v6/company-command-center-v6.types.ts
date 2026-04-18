/**
 * Company Command Center V6 — board / diligence / war room / audit views over V4 + optional V1 history.
 */
import type {
  AiControlCenterRolloutSummary,
  AiControlCenterSystems,
  ExecutiveOverallStatus,
} from "@/modules/control-center/ai-control-center.types";

export type CommandCenterV6Mode = "weekly_board_pack" | "due_diligence" | "launch_war_room" | "audit_trail";

export type CommandCenterBoardPack = {
  mode: "weekly_board_pack";
  executiveSummary: string;
  weeklyWins: string[];
  weeklyRisks: string[];
  rolloutChanges: string[];
  systemHealthSummary: Record<string, string | number>;
  boardMetrics: Record<string, string>;
  notes: string[];
};

export type CommandCenterDueDiligenceSummary = {
  mode: "due_diligence";
  diligenceSummary: string;
  moatSignals: string[];
  governanceSignals: string[];
  maturitySignals: string[];
  riskSignals: string[];
  openQuestions: string[];
  evidenceNotes: string[];
};

export type CommandCenterWarRoomSummary = {
  mode: "launch_war_room";
  launchSummary: string;
  criticalSystems: string[];
  blockers: string[];
  goNoGoSignals: string[];
  escalationItems: string[];
  readinessChecklist: Record<string, boolean>;
  warnings: string[];
};

export type CommandCenterAuditTrailEntry = {
  id: string;
  source: "history" | "digest" | "delta" | "synthetic";
  system: string;
  severity: "info" | "watch" | "warning" | "critical";
  title: string;
  detail: string;
  provenance?: string | null;
};

export type CommandCenterAuditTrailGroup = {
  key: string;
  label: string;
  entries: CommandCenterAuditTrailEntry[];
};

export type CommandCenterTraceabilityNote = {
  id: string;
  text: string;
};

export type CommandCenterV6Modes = {
  weeklyBoardPack: CommandCenterBoardPack;
  dueDiligence: CommandCenterDueDiligenceSummary;
  launchWarRoom: CommandCenterWarRoomSummary;
  auditTrail: {
    mode: "audit_trail";
    summary: string;
    entries: CommandCenterAuditTrailEntry[];
    groupedBySystem: CommandCenterAuditTrailGroup[];
    groupedBySeverity: CommandCenterAuditTrailGroup[];
    traceabilityNotes: CommandCenterTraceabilityNote[];
  };
};

export type CompanyCommandCenterV6Shared = {
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

export type CompanyCommandCenterV6Meta = {
  currentWindow: { label: string; days: number; offsetDays: number };
  previousWindow: { label: string; days: number; offsetDays: number };
  dataFreshnessMs: number;
  sourcesUsed: string[];
  missingSources: string[];
  highlightsGenerated: number;
  auditEntryCount: number;
  focusedMode: CommandCenterV6Mode | null;
  v1HistoryAvailable: boolean;
};

export type CompanyCommandCenterV6Payload = {
  shared: CompanyCommandCenterV6Shared;
  modes: CommandCenterV6Modes;
  meta: CompanyCommandCenterV6Meta;
};

export type LoadCompanyCommandCenterV6Params = {
  days?: number;
  limit?: number;
  offsetDays?: number;
  previousOffsetDays?: number;
  role?: string | null;
  presetId?: string | null;
  mode?: string | null;
};
