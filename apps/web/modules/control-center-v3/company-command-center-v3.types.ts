/**
 * Company Command Center V3 — role-based read-only views over the same aggregates as V1/V2.
 */
import type {
  AiControlCenterRolloutSummary,
  AiControlCenterSystems,
  ExecutiveOverallStatus,
} from "@/modules/control-center/ai-control-center.types";

export type CommandCenterRole = "founder" | "growth" | "operations" | "risk_governance";

export type CommandCenterRolePriority = {
  id: string;
  label: string;
  rationale?: string | null;
};

export type CommandCenterRoleRisk = CommandCenterRolePriority;

export type CommandCenterRoleBlocker = CommandCenterRolePriority;

export type CommandCenterRoleSystemsHighlight = {
  highlights: {
    id: string;
    label: string;
    status: string;
    oneLiner: string;
  }[];
};

export type CommandCenterRoleView = {
  role: CommandCenterRole;
  heroSummary: string;
  topPriorities: CommandCenterRolePriority[];
  topRisks: CommandCenterRoleRisk[];
  topBlockers: CommandCenterRoleBlocker[];
  recommendedFocusAreas: string[];
  systems: CommandCenterRoleSystemsHighlight;
  rolloutSummary: AiControlCenterRolloutSummary;
  warnings: string[];
};

export type CompanyCommandCenterV3Shared = {
  overallStatus: ExecutiveOverallStatus;
  /** Null only when V3 aggregate failed entirely (error fallback). */
  systems: AiControlCenterSystems | null;
  rolloutSummary: AiControlCenterRolloutSummary;
  quickKpis: { label: string; value: string; href: string | null }[];
  meta: {
    dataFreshnessMs: number;
    sourcesUsed: string[];
    missingSources: string[];
    systemsLoadedCount: number;
    overallStatus: ExecutiveOverallStatus;
    partialData: boolean;
  };
};

export type CompanyCommandCenterV3Roles = {
  founder: CommandCenterRoleView;
  growth: CommandCenterRoleView;
  operations: CommandCenterRoleView;
  riskGovernance: CommandCenterRoleView;
};

export type CompanyCommandCenterV3Payload = {
  shared: CompanyCommandCenterV3Shared;
  roles: CompanyCommandCenterV3Roles;
  /** When API `role` query is set, only this role key may be populated in `roles`. */
  focusedRole?: CommandCenterRole | null;
};

export type LoadCompanyCommandCenterV3Params = {
  days?: number;
  limit?: number;
  offsetDays?: number;
  /** If set, service may narrow `roles` to this role only (API convenience). */
  role?: CommandCenterRole | null;
};
