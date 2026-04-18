/**
 * Company Command Center V2 — tabbed read-only payload (builds on V1 aggregate).
 */
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";

export type CommandCenterV2TabId = "executive" | "growth" | "ranking" | "brain" | "swarm" | "rollouts";

export type RolloutPostureUi =
  | "disabled"
  | "shadow"
  | "influence"
  | "primary"
  | "limited"
  | "blocked"
  | "unavailable";

export type RolloutSystemRow = {
  id: string;
  label: string;
  posture: RolloutPostureUi;
  recommendation: string | null;
  warningCount: number;
  topNote: string | null;
};

export type CompanyCommandCenterV2Payload = {
  /** Full V1 aggregate — single source for subsystem summaries. */
  v1: AiControlCenterPayload;
  executive: {
    overallStatus: AiControlCenterPayload["executiveSummary"]["overallStatus"];
    criticalWarnings: string[];
    topOpportunities: string[];
    topRisks: string[];
    systemsHealthyCount: number;
    systemsWarningCount: number;
    systemsCriticalCount: number;
    rolloutSummary: AiControlCenterPayload["rolloutSummary"];
    quickKpis: { label: string; value: string; href: string | null }[];
    unifiedWarningsPreview: string[];
  };
  growth: {
    opportunities: string[];
    risks: string[];
  };
  ranking: {
    governanceDashboardFlag: boolean;
  };
  brain: {
    opportunities: string[];
    risks: string[];
  };
  swarm: {
    opportunities: string[];
    risks: string[];
  };
  rollouts: {
    rows: RolloutSystemRow[];
  };
  meta: {
    dataFreshnessMs: number;
    sourcesUsed: string[];
    missingSources: string[];
    systemsLoadedCount: number;
    overallStatus: AiControlCenterPayload["executiveSummary"]["overallStatus"];
    partialData: boolean;
  };
};

export type LoadCompanyCommandCenterV2Params = {
  days?: number;
  limit?: number;
  offsetDays?: number;
  /** Reserved for future partial responses; ignored for now. */
  tab?: CommandCenterV2TabId;
};
